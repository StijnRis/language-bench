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
  implDir,
  readSource,
  type LoadedLanguage,
  type LoadedProblem,
} from "@lb/core/discover";
import prettier from "prettier";
import { CACHE, HYPERFINE_VERSION, ROOT, WORK } from "./config";
import { Container } from "./docker";
import { runHyperfine } from "./hyperfine";

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
}

export function findLanguage(id: string): LoadedLanguage {
  const l = loadLanguages(ROOT).find((x) => x.spec.id === id);
  if (!l) throw new Error(`unknown language "${id}"`);
  return l;
}

export interface InputInfo {
  sha256: string;
  bytes: number;
}

/** Generate (deterministically) the input files of the given problems. */
export function prepareInputs(problems: LoadedProblem[], workDir: string): Map<string, InputInfo> {
  const infos = new Map<string, InputInfo>();
  for (const p of problems) {
    const inp = p.spec.input;
    if (!inp) continue;
    const gen = path.join(p.dir, inp.generator);
    const genHash = sha(fs.readFileSync(gen)).slice(0, 12);
    const cached = path.join(CACHE, "inputs", `${p.spec.id}-${genHash}`, inp.file);
    if (!fs.existsSync(cached)) {
      fs.mkdirSync(path.dirname(cached), { recursive: true });
      log(`[input] generating ${p.spec.id}/${inp.file}`);
      execFileSync("node", [gen, cached], { stdio: ["ignore", "inherit", "inherit"] });
    }
    const target = path.join(workDir, "inputs", inp.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(cached, target);
    const buf = fs.readFileSync(cached);
    infos.set(p.spec.id, { sha256: sha(buf), bytes: buf.length });
  }
  return infos;
}

const sub = (tpl: string, vars: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

export function planTasks(
  lang: Language,
  version: string,
  problems: LoadedProblem[],
  filter: { variant?: string; problem?: string } = {},
): Task[] {
  const tasks: Task[] = [];
  for (const variant of lang.variants) {
    if (variant.versions && !variant.versions.includes(version)) continue;
    if (variant.minVersion && cmpVersion(version, variant.minVersion) < 0) continue;
    if (filter.variant && variant.id !== filter.variant) continue;
    for (const problem of problems) {
      if (filter.problem && problem.spec.id !== filter.problem) continue;
      const src = readSource(ROOT, lang, problem.spec.id, version);
      if (src === undefined) continue; // no implementation of that problem in this language (yet)
      const dir = path.relative(ROOT, implDir(ROOT, lang, problem.spec.id, version)).split(path.sep).join("/");
      const rule = [...(variant.rules ?? [])].filter((r) => cmpVersion(version, r.minVersion) >= 0).sort((a, b) => cmpVersion(b.minVersion, a.minVersion))[0];
      const buildTpl = rule?.build ?? variant.build;
      const runTpl = rule?.run ?? variant.run;
      const vars = {
        src: `/repo/${dir}`,
        bin: `/work/bin/${lang.id}-${version}-${variant.id}-${problem.spec.id}`,
      };
      const input = problem.spec.input ? `/work/inputs/${problem.spec.input.file}` : "";
      const args = problem.spec.args.map((a) => a.replace("{input}", input));
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
        sourceHash: sha(src).slice(0, 16),
      });
    }
  }
  return tasks;
}

export const imageFor = (lang: Language, version: string) => lang.image.replace("{version}", version);

export interface BuildResult {
  ok: boolean;
  binarySize?: number;
  seconds?: number;
  output?: string;
  message?: string;
}

export function build(c: Container, t: Task): BuildResult {
  c.exec("mkdir -p /work/bin");
  if (!t.buildCommand) return { ok: true };
  const t0 = performance.now();
  const r = c.exec(t.buildCommand, { timeoutMs: 15 * 60_000 });
  const seconds = (performance.now() - t0) / 1000;
  const output = (r.stdout + r.stderr).slice(0, 4000);
  if (r.code !== 0) return { ok: false, seconds, output, message: `build failed:\n${output}` };
  const size = c.exec(`stat -c %s ${t.bin}`);
  return { ok: true, seconds, output, binarySize: size.code === 0 ? Number(size.stdout.trim()) : undefined };
}

export interface CheckResult {
  correct: boolean;
  message?: string;
  ms: number;
  outputSha256?: string;
}

/** Run the program once and compare its stdout with problems/<id>/expected.txt */
export function check(c: Container, t: Task): CheckResult {
  const r = c.exec(t.runCommand, { timeoutMs: 20 * 60_000 });
  const norm = (s: string) => s.replace(/\r\n/g, "\n").trimEnd();
  if (r.code !== 0) return { correct: false, ms: r.ms, message: `exit code ${r.code}\n${r.stderr.slice(0, 2000)}` };
  const outputSha256 = sha(norm(r.stdout));
  if (norm(r.stdout) !== norm(t.problem.expected)) {
    return {
      correct: false,
      ms: r.ms,
      outputSha256,
      message: `output differs\n--- expected\n${norm(t.problem.expected).slice(0, 600)}\n--- got\n${norm(r.stdout).slice(0, 600)}`,
    };
  }
  return { correct: true, ms: r.ms, outputSha256 };
}

/* ------------------------------------------------------------------ verify */

export function verify(opts: { language: string; version?: string; variant?: string; problems?: string[] }): boolean {
  const lang = findLanguage(opts.language);
  const version = opts.version ?? lang.spec.versions.find((v) => v.latest)!.version;
  const problems = loadProblems(ROOT).filter((p) => !opts.problems || opts.problems.includes(p.spec.id));
  const workDir = path.join(WORK, `verify-${lang.spec.id}`);
  fs.rmSync(workDir, { recursive: true, force: true });
  prepareInputs(problems, workDir);
  const tasks = problems.flatMap((p) => planTasks(lang.spec, version, [p], { variant: opts.variant }));
  if (tasks.length === 0) {
    log("nothing to verify");
    return true;
  }
  const c = Container.start(`lb-verify-${lang.spec.id}`, imageFor(lang.spec, version), workDir, log);
  let failed = 0;
  try {
    for (const t of tasks) {
      const label = `${lang.spec.id} ${version} ${t.variant.id} ${t.problem.spec.id}`;
      const b = build(c, t);
      if (!b.ok) {
        failed++;
        console.log(`FAIL ${label}\n${b.message}`);
        continue;
      }
      const r = check(c, t);
      if (r.correct) console.log(`ok   ${label}  (${(r.ms / 1000).toFixed(2)}s)`);
      else {
        failed++;
        console.log(`FAIL ${label}\n${r.message}`);
      }
    }
  } finally {
    c.stop();
  }
  console.log(failed ? `\n${failed} failure(s)` : `\nall ${tasks.length} implementations produce the expected output`);
  return failed === 0;
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
  const inputs = prepareInputs(
    problems.filter((p) => plan.picks.some((x) => x.problem === p.spec.id)),
    workDir,
  );

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
      c = Container.start(`lb-${process.pid}-${containers.size}`, image, workDir, log);
      containers.set(image, c);
      containerInfo[image] = {
        image,
        digest: c.imageDigest(),
        osRelease: read(c, ". /etc/os-release 2>/dev/null && echo $PRETTY_NAME"),
        kernel: read(c, "uname -r"),
        glibc: read(c, "ldd --version 2>&1 | head -n1"),
        toolVersion: read(c, lang.toolVersionCmd),
        hyperfine: read(c, "hyperfine --version"),
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
        args: task.args,
        containerImage: image,
        sourceFile: task.sourceFile,
        sourceHash: task.sourceHash,
        inputSha256: inputs.get(pick.problem)?.sha256,
        inputBytes: inputs.get(pick.problem)?.bytes,
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
        const b = build(c, task);
        if (!b.ok) {
          fail(b.message ?? "build failed", { buildSeconds: b.seconds, buildOutput: b.output });
          continue;
        }
        const chk = check(c, task);
        if (chk.outputSha256 === undefined) {
          fail(chk.message ?? "run failed", { buildSeconds: b.seconds, buildOutput: b.output, binarySize: b.binarySize });
          continue;
        }
        if (!chk.correct) log(`[WRONG OUTPUT] ${label}: ${chk.message}`);
        const { min, max } = task.problem.spec.runs;
        const hi = Math.min(max, cfg.repetitions.max);
        const lo = Math.max(cfg.repetitions.min, Math.min(min, cfg.repetitions.max));
        const est = Math.max(chk.ms / 1000, 1e-3);
        const runs = Math.max(lo, Math.min(hi, Math.floor((task.problem.spec.budgetSeconds * cfg.budgetSecondsScale) / est)));
        log(`[bench] ${label}: ~${est.toFixed(2)}s/run -> ${runs} runs`);
        const hf = runHyperfine(c, workDir, task.runCommand, runs, cfg.warmupRuns);
        measurements.push({
          ...base,
          buildSeconds: b.seconds,
          buildOutput: b.output,
          binarySize: b.binarySize,
          status: "ok",
          correct: chk.correct,
          outputSha256: chk.outputSha256,
          startedAt: started,
          finishedAt: new Date().toISOString(),
          loadAvgAfter: read(c, "cat /proc/loadavg"),
          hyperfineArgs: hf.args,
          warmupRuns: cfg.warmupRuns,
          runs: hf.runs,
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
