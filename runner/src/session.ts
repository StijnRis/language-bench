import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  benchmarkKey,
  cmpVersion,
  fromSessionFile,
  sessionFilePath,
  toSessionFile,
  hashSeed,
  mulberry32,
  type Candidate,
  type Config,
  type Counts,
  type Language,
  type LanguageData,
  type Measurement,
  type PlannedBenchmark,
  type Session,
  type Variant,
} from "@lb/core";
import {
  dataDir,
  loadConfig,
  loadData,
  loadLanguages,
  loadProblems,
  harnessDir,
  implDir,
  readSource,
  type LoadedLanguage,
  type LoadedProblem,
} from "@lb/core/discover";
import prettier from "prettier";
import { CACHE, HYPERFINE_VERSION, ROOT, WORK } from "./config";
import { startContainer, type Container } from "./docker";
import { ensureTools } from "./tools";
import { measureTask, validateTask } from "./measure";

const log = (...a: unknown[]) => console.error(...a);
const sha = (s: string | Buffer) => crypto.createHash("sha256").update(s).digest("hex");

/* ------------------------------------------------------------------ tasks */

export interface Task {
  language: Language;
  version: string;
  variant: Variant;
  problem: LoadedProblem;
  buildCommand?: string;
  runCommand: string;
  args: string[];
  bin: string;
  sourceFile: string;
  sourceHash: string;
  /** a problem that is not in problems/ (the harness conformance problem) */
  synthetic?: boolean;
}

/** Text of every file of the harness folder of this version (the harness is part of what is benchmarked). */
function harnessSource(lang: Language, version: string): string {
  const dir = harnessDir(ROOT, lang, version);
  if (!fs.existsSync(dir)) return "";
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => fs.readFileSync(path.join(dir, e.name), "utf8"))
    .join("\n");
}

export function findLanguage(id: string): LoadedLanguage {
  const l = loadLanguages(ROOT).find((x) => x.spec.id === id);
  if (!l) throw new Error(`unknown language "${id}"`);
  return l;
}

const sub = (tpl: string, vars: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

export function planTasks(
  lang: Language,
  version: string,
  problems: LoadedProblem[],
  filter: { variant?: string; problem?: string; conformance?: boolean } = {},
): Task[] {
  const tasks: Task[] = [];
  for (const variant of lang.variants) {
    if (variant.versions && !variant.versions.includes(version)) continue;
    if (variant.minVersion && cmpVersion(version, variant.minVersion) < 0) continue;
    if (filter.variant && variant.id !== filter.variant) continue;
    for (const problem of problems) {
      if (filter.problem && problem.spec.id !== filter.problem) continue;
      // the conformance problem lives in the harness folder: languages/<id>/harness/conformance/<sourceFile>
      const dir = filter.conformance
        ? path.relative(ROOT, path.join(harnessDir(ROOT, lang, version), "conformance")).split(path.sep).join("/")
        : path.relative(ROOT, implDir(ROOT, lang, problem.spec.id, version)).split(path.sep).join("/");
      const srcFile = path.join(ROOT, dir, lang.sourceFile);
      if (!fs.existsSync(srcFile)) continue; // no implementation of that problem in this language (yet)
      const src = fs.readFileSync(srcFile, "utf8");
      const rule = [...(variant.rules ?? [])].filter((r) => cmpVersion(version, r.minVersion) >= 0).sort((a, b) => cmpVersion(b.minVersion, a.minVersion))[0];
      const buildTpl = rule?.build ?? variant.build;
      const runTpl = rule?.run ?? variant.run;
      const hdir = path.relative(ROOT, harnessDir(ROOT, lang, version)).split(path.sep).join("/");
      const vars = {
        src: `/repo/${dir}`,
        harness: `/repo/${hdir}`,
        bin: `/work/bin/${lang.id}-${version}-${variant.id}-${problem.spec.id}`,
      };
      const args = problem.spec.args;
      tasks.push({
        language: lang,
        version,
        variant,
        problem,
        buildCommand: buildTpl ? sub(buildTpl, vars) : undefined,
        runCommand: [sub(runTpl, vars), ...args].join(" "),
        args,
        bin: vars.bin,
        sourceFile: `${dir}/${lang.sourceFile}`,
        sourceHash: sha(src + harnessSource(lang, version)).slice(0, 16),
      });
    }
  }
  return tasks;
}

export const imageFor = (lang: Language, version: string) => lang.image.replace("{version}", version);

/* ------------------------------------------------------------------ verify */

/**
 * Builds every implementation of a language version and compares the results of the first iterations
 * with the reference hashes of tools/lbgen (the same check every session does before it benchmarks).
 */
export async function verify(opts: { language: string; version?: string; variant?: string; problems?: string[]; iterations?: number }): Promise<boolean> {
  const lang = findLanguage(opts.language);
  const version = opts.version ?? lang.spec.versions.find((v) => v.latest)!.version;
  const problems = loadProblems(ROOT).filter((p) => !opts.problems || opts.problems.includes(p.spec.id));
  const workDir = path.join(WORK, `verify-${lang.spec.id}`);
  fs.rmSync(workDir, { recursive: true, force: true });
  const tasks = problems.flatMap((p) => planTasks(lang.spec, version, [p], { variant: opts.variant }));
  if (tasks.length === 0) {
    log("nothing to verify");
    return true;
  }
  ensureTools();
  const cfg = loadConfig(ROOT);
  const c = startContainer(`lb-verify-${lang.spec.id}`, imageFor(lang.spec, version), workDir, log);
  let failed = 0;
  try {
    for (const t of tasks) {
      const label = `${lang.spec.id} ${version} ${t.variant.id} ${t.problem.spec.id}`;
      const r = await validateTask(c, t, cfg, opts.iterations ?? 5);
      if (r.ok) console.log(`ok   ${label}  (${r.iterations} iterations, ${(r.seconds * 1000).toFixed(1)} ms in the kernel on average)`);
      else {
        failed++;
        console.log(`FAIL ${label}\n${r.message}`);
      }
    }
  } finally {
    c.stop();
  }
  console.log(failed ? `\n${failed} failure(s)` : `\nall ${tasks.length} implementations produce the reference results`);
  return failed === 0;
}

/**
 * Runs the harness of every build setting of a language version on the conformance problem and checks that
 * the output follows harness/CONTRACT.md (format, timestamps, loop rules, no reused instances).
 */
export async function conformance(opts: { language: string; version?: string }): Promise<boolean> {
  const lang = findLanguage(opts.language);
  const version = opts.version ?? lang.spec.versions.find((v) => v.latest)!.version;
  const workDir = path.join(WORK, `conformance-${lang.spec.id}`);
  fs.rmSync(workDir, { recursive: true, force: true });
  ensureTools();
  const cfg = loadConfig(ROOT);
  const problem = { spec: { id: "conformance", instance: "stream", args: [], kind: "kernel" }, dir: "", expected: "" } as unknown as LoadedProblem;
  const tasks = planTasks(lang.spec, version, [problem], { conformance: true });
  const { conformanceTask } = await import("./measure");
  const c = startContainer(`lb-conformance-${lang.spec.id}`, imageFor(lang.spec, version), workDir, log);
  let failed = 0;
  try {
    for (const t of tasks) {
      const label = `${lang.spec.id} ${version} ${t.variant.id}`;
      const r = await conformanceTask(c, t, cfg);
      if (r.ok) console.log(`ok   ${label}  (${r.iterations} iterations)`);
      else {
        failed++;
        console.log(`FAIL ${label}\n${r.message}`);
      }
    }
  } finally {
    c.stop();
  }
  return failed === 0 && tasks.length > 0;
}

/* ---------------------------------------------------------------- planning */

/** All benchmarks that should be measured right now: newest tracked versions x variants x problems. */
export function enumerateCandidates(): Candidate[] {
  const problems = loadProblems(ROOT);
  const out: Candidate[] = [];
  for (const l of loadLanguages(ROOT))
    for (const v of l.spec.versions)
      for (const t of planTasks(l.spec, v.version, problems))
        out.push({
          key: benchmarkKey({ language: l.spec.id, version: v.version, variant: t.variant.id, problem: t.problem.spec.id }),
          language: l.spec.id,
          version: v.version,
          variant: t.variant.id,
          problem: t.problem.spec.id,
        });
  return out;
}

export function currentCounts(): Map<string, Counts> {
  const counts = new Map<string, Counts>();
  for (const d of loadData(ROOT).languages)
    for (const m of d.measurements) {
      const k = benchmarkKey(m);
      const c = counts.get(k) ?? counts.set(k, { ok: 0, failed: 0 }).get(k)!;
      if (m.status === "ok") c.ok++;
      else c.failed++;
    }
  return counts;
}

export interface SessionPlan {
  sessionId: string;
  picks: PlannedBenchmark[];
  config: Config;
  trigger: Record<string, unknown>;
}

/* ----------------------------------------------------------------- session */

const read = (c: Container, cmd: string) => c.exec(cmd).stdout.trim();

function hostInfo(c: Container) {
  const lscpuLocal = spawnSync("lscpu", { encoding: "utf8" });
  const cpuinfo = read(c, "cat /proc/cpuinfo");
  const first = cpuinfo.split(/\n\s*\n/)[0] ?? "";
  const field = (k: string) => first.match(new RegExp(`^${k}\\s*:\\s*(.*)$`, "m"))?.[1]?.trim();
  const mem = (k: string) => Number(read(c, `grep '^${k}:' /proc/meminfo | awk '{print $2}'`)) * 1024;
  return {
    uname: read(c, "uname -a"),
    kernel: read(c, "uname -r"),
    arch: read(c, "uname -m"),
    cpu: {
      model: field("model name") ?? read(c, "uname -m"),
      vendor: field("vendor_id"),
      family: field("cpu family"),
      modelNumber: field("model"),
      stepping: field("stepping"),
      microcode: field("microcode"),
      cacheSize: field("cache size"),
      mhzAtStart: field("cpu MHz"),
      bogomips: field("bogomips"),
      flags: field("flags"),
      cores: Number(read(c, "nproc")),
      logicalProcessors: (cpuinfo.match(/^processor\s*:/gm) ?? []).length,
      lscpu: lscpuLocal.status === 0 ? lscpuLocal.stdout : undefined,
    },
    memory: { totalBytes: mem("MemTotal"), availableBytes: mem("MemAvailable"), swapTotalBytes: mem("SwapTotal") },
    cgroup: {
      cpuMax: read(c, "cat /sys/fs/cgroup/cpu.max 2>/dev/null"),
      memoryMax: read(c, "cat /sys/fs/cgroup/memory.max 2>/dev/null"),
    },
    scalingGovernor: read(c, "cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null"),
    smt: read(c, "cat /sys/devices/system/cpu/smt/active 2>/dev/null"),
    loadAvgStart: read(c, "cat /proc/loadavg"),
    diskFree: read(c, "df -P /work | tail -n1"),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function runnerInfo() {
  const e = process.env;
  const pick = (...keys: string[]) => Object.fromEntries(keys.filter((k) => e[k] !== undefined).map((k) => [k, e[k]]));
  return {
    githubActions: e.GITHUB_ACTIONS === "true",
    ...pick("RUNNER_NAME", "RUNNER_OS", "RUNNER_ARCH", "RUNNER_ENVIRONMENT", "ImageOS", "ImageVersion", "RUNNER_TRACKING_ID"),
    hostOs: `${process.platform} ${process.arch}`,
    hostNode: process.version,
  };
}

function triggerInfo(extra: Record<string, unknown>) {
  const e = process.env;
  const base = e.GITHUB_SERVER_URL ?? "https://github.com";
  return {
    event: e.GITHUB_EVENT_NAME,
    workflow: e.GITHUB_WORKFLOW,
    job: e.GITHUB_JOB,
    runId: e.GITHUB_RUN_ID,
    runAttempt: e.GITHUB_RUN_ATTEMPT,
    runNumber: e.GITHUB_RUN_NUMBER,
    runUrl: e.GITHUB_RUN_ID && e.GITHUB_REPOSITORY ? `${base}/${e.GITHUB_REPOSITORY}/actions/runs/${e.GITHUB_RUN_ID}` : undefined,
    repository: e.GITHUB_REPOSITORY,
    ref: e.GITHUB_REF,
    actor: e.GITHUB_ACTOR,
    ...extra,
  };
}

const gitCommit = () => process.env.GITHUB_SHA ?? execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();

function hyperfineInfo() {
  const arch = process.arch === "arm64" ? "aarch64" : "x86_64";
  return {
    hyperfineVersion: HYPERFINE_VERSION,
    hyperfineBuild: `hyperfine-v${HYPERFINE_VERSION}-${arch}-unknown-linux-musl`,
    hyperfineSource: `https://github.com/sharkdp/hyperfine/releases/tag/v${HYPERFINE_VERSION}`,
  };
}

export async function runSession(plan: SessionPlan, opts: { out: string; dryRun?: boolean }): Promise<void> {
  const cfg = plan.config;
  const startedAt = new Date();
  const problems = loadProblems(ROOT);
  const langs = new Map(loadLanguages(ROOT).map((l) => [l.spec.id, l]));
  const workDir = path.join(WORK, plan.sessionId);
  fs.mkdirSync(workDir, { recursive: true });
  const toolInfo = ensureTools();

  // resolve picks into tasks
  const tasks: { pick: PlannedBenchmark; task: Task; image: string }[] = [];
  const skipped: Record<string, unknown>[] = [];
  for (const pick of plan.picks) {
    const lang = langs.get(pick.language);
    const task = lang && planTasks(lang.spec, pick.version, problems, { variant: pick.variant, problem: pick.problem })[0];
    if (!lang || !task) {
      skipped.push({ key: pick.key, reason: "no longer configured" });
      continue;
    }
    tasks.push({ pick, task, image: imageFor(lang.spec, pick.version) });
  }
  const rnd = mulberry32(hashSeed(plan.sessionId));
  for (let i = tasks.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [tasks[i], tasks[j]] = [tasks[j]!, tasks[i]!];
  }

  const containers = new Map<string, Container>();
  const containerInfo: Record<string, unknown> = {};
  const containerFor = (image: string, lang: Language) => {
    let c = containers.get(image);
    if (!c) {
      c = startContainer(`lb-${process.pid}-${containers.size}`, image, workDir, log);
      containers.set(image, c);
      containerInfo[image] = {
        image,
        digest: c.imageDigest(),
        osRelease: read(c, ". /etc/os-release 2>/dev/null && echo $PRETTY_NAME"),
        kernel: read(c, "uname -r"),
        glibc: read(c, "ldd --version 2>&1 | head -n1"),
        toolVersion: read(c, lang.toolVersionCmd),
        hyperfine: c.hasHyperfine ? read(c, "hyperfine --version") : undefined,
      };
    }
    return c;
  };

  const measurements: Measurement[] = [];
  const executed: string[] = [];
  const deadline = startedAt.getTime() + cfg.sessionTimeBudgetMinutes * 60_000;
  let host: ReturnType<typeof hostInfo> | undefined;
  try {
    for (const { pick, task, image } of tasks) {
      if (Date.now() > deadline) {
        skipped.push({ key: pick.key, reason: "session time budget exhausted" });
        continue;
      }
      const c = containerFor(image, task.language);
      host ??= hostInfo(c);
      const label = `${pick.key} [${pick.reason}]`;
      const base = {
        sessionId: plan.sessionId,
        language: pick.language,
        version: pick.version,
        toolVersion: (containerInfo[image] as any).toolVersion as string,
        variant: pick.variant,
        variantSpec: task.variant as unknown as Record<string, unknown>,
        problem: pick.problem,
        kind: task.problem.spec.kind,
        args: task.args,
        containerImage: image,
        sourceFile: task.sourceFile,
        sourceHash: task.sourceHash,
        buildCommand: task.buildCommand,
        runCommand: task.runCommand,
        loadAvgBefore: read(c, "cat /proc/loadavg"),
      };
      const started = new Date().toISOString();
      executed.push(pick.key);
      const fail = (error: string, extra: Partial<Measurement> = {}) => {
        log(`[FAILED] ${label}: ${error.slice(0, 300)}`);
        measurements.push({ ...base, status: "failed", error: error.slice(0, 4000), correct: false, startedAt: started, finishedAt: new Date().toISOString(), ...extra });
      };
      try {
        const m = await measureTask(c, task, cfg, workDir, log, label);
        if (m.status === "failed") {
          fail(m.error, { buildSeconds: m.buildSeconds, buildOutput: m.buildOutput, binarySize: m.binarySize, correct: m.correct });
          continue;
        }
        measurements.push({
          ...base,
          buildSeconds: m.buildSeconds,
          buildOutput: m.buildOutput,
          binarySize: m.binarySize,
          status: m.status,
          error: m.error,
          correct: m.correct,
          startedAt: started,
          finishedAt: new Date().toISOString(),
          loadAvgAfter: read(c, "cat /proc/loadavg"),
          hyperfineArgs: m.hyperfineArgs,
          warmupRuns: m.runs ? cfg.warmupRuns : undefined,
          runs: m.runs,
          kernel: m.kernel,
        });
      } catch (e) {
        fail(String(e));
      }
    }
  } finally {
    const hostFinal = host;
    const finishedAt = new Date();
    const loadAvgEnd = containers.size ? read([...containers.values()][0]!, "cat /proc/loadavg") : undefined;
    for (const c of containers.values()) c.stop();
    if (hostFinal) {
      const session: Session = {
        id: plan.sessionId,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationSeconds: (finishedAt.getTime() - startedAt.getTime()) / 1000,
        repoCommit: gitCommit(),
        trigger: triggerInfo(plan.trigger),
        runner: runnerInfo(),
        host: { ...hostFinal, loadAvgEnd } as Session["host"],
        tooling: {
          ...hyperfineInfo(),
          lbgenSha: toolInfo.lbgenSha,
          hostGcc: toolInfo.gcc,
          harnessContract: 1,
          docker: spawnSync("docker", ["version", "--format", "{{json .}}"], { encoding: "utf8" }).stdout.trim(),
          node: process.version,
        },
        containers: containerInfo,
        config: cfg as unknown as Record<string, unknown>,
        plan: plan.picks as unknown as Record<string, unknown>[],
        order: executed,
        skipped,
      };
      fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
      fs.writeFileSync(opts.out, JSON.stringify({ session, measurements }));
      log(`[done] session ${plan.sessionId}: ${measurements.filter((m) => m.status === "ok").length} ok, ${measurements.filter((m) => m.status === "failed").length} failed, ${skipped.length} skipped -> ${opts.out}`);
    }
  }
}

/* ------------------------------------------------------------------- merge */

async function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const cfg = (await prettier.resolveConfig(file)) ?? {};
  fs.writeFileSync(file, await prettier.format(JSON.stringify(data), { ...cfg, parser: "json" }));
}

/** Append one session fragment as its own file data/sessions/<id>.json (never rewrites existing data). */
export async function mergeFragment(frag: { session: Session; measurements: Measurement[] }) {
  const file = sessionFilePath(dataDir(ROOT), frag.session.id);
  if (fs.existsSync(file)) throw new Error(`session ${frag.session.id} already recorded`);
  const content = toSessionFile(frag.session, frag.measurements);
  fromSessionFile(content); // validate before writing
  await writeJson(file, content);
}

export { loadConfig };
