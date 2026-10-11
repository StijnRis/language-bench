import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  hashSeed,
  mulberry32,
  type Language,
  type LanguageData,
  type Measurement,
  type Problem,
  type Session,
  type Variant,
} from "@lb/core";
import { loadLanguages, loadProblems, readSource, type LoadedLanguage, type LoadedProblem } from "@lb/core/discover";
import prettier from "prettier";
import { ANCHOR, CACHE, ROOT, WORK } from "./config";
import { Container } from "./docker";
import { runHyperfine } from "./hyperfine";

const log = (...a: unknown[]) => console.error(...a);

export interface Task {
  variant: Variant;
  problem: LoadedProblem;
  /** resolved commands as stored in the data file */
  buildCommand?: string;
  runCommand: string;
  bin: string;
  sourceHash: string;
}

export function findLanguage(id: string): LoadedLanguage {
  const l = loadLanguages(ROOT).find((x) => x.spec.id === id);
  if (!l) throw new Error(`unknown language "${id}"`);
  return l;
}

/** Generate (deterministically) the input files of all problems that need one. */
export function prepareInputs(problems: LoadedProblem[], workDir: string): void {
  for (const p of problems) {
    const inp = p.spec.input;
    if (!inp) continue;
    const gen = path.join(p.dir, inp.generator);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(gen)).digest("hex").slice(0, 12);
    const cached = path.join(CACHE, "inputs", `${p.spec.id}-${hash}`, inp.file);
    if (!fs.existsSync(cached)) {
      fs.mkdirSync(path.dirname(cached), { recursive: true });
      log(`[input] generating ${p.spec.id}/${inp.file}`);
      execFileSync("node", [gen, cached], { stdio: ["ignore", "inherit", "inherit"] });
    }
    const target = path.join(workDir, "inputs", inp.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(cached, target);
  }
}

const sub = (tpl: string, vars: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

export function planTasks(
  lang: Language,
  version: string,
  problems: LoadedProblem[],
  filter: { variant?: string; problem?: string } = {},
): Task[] {
  const tasks: Task[] = [];
  for (const variant of lang.variants) {
    if (variant.versions && !variant.versions.includes(version)) continue;
    if (filter.variant && variant.id !== filter.variant) continue;
    for (const problem of problems) {
      if (filter.problem && problem.spec.id !== filter.problem) continue;
      const src = readSource(ROOT, lang, problem.spec.id);
      if (src === undefined) continue; // this language has no implementation of that problem (yet)
      const vars = {
        src: `/repo/languages/${lang.id}/impl/${problem.spec.id}`,
        bin: `/work/bin/${variant.id}-${problem.spec.id}`,
      };
      const input = problem.spec.input ? `/work/inputs/${problem.spec.input.file}` : "";
      const args = problem.spec.args.map((a) => a.replace("{input}", input));
      tasks.push({
        variant,
        problem,
        buildCommand: variant.build ? sub(variant.build, vars) : undefined,
        runCommand: [sub(variant.run, vars), ...args].join(" "),
        bin: vars.bin,
        sourceHash: crypto.createHash("sha256").update(src).digest("hex").slice(0, 16),
      });
    }
  }
  return tasks;
}

export function imageFor(lang: Language, version: string) {
  return lang.image.replace("{version}", version);
}

export interface BuildResult {
  ok: boolean;
  binarySize?: number;
  message?: string;
}

export function build(c: Container, t: Task): BuildResult {
  c.exec("mkdir -p /work/bin");
  if (!t.buildCommand) return { ok: true };
  const r = c.exec(t.buildCommand, { timeoutMs: 15 * 60_000 });
  if (r.code !== 0) return { ok: false, message: `build failed:\n${r.stderr || r.stdout}` };
  const size = c.exec(`stat -c %s ${t.bin}`);
  return { ok: true, binarySize: size.code === 0 ? Number(size.stdout.trim()) : undefined };
}

export interface CheckResult {
  correct: boolean;
  message?: string;
  ms: number;
}

/** Run the program once and compare its stdout with problems/<id>/expected.txt */
export function check(c: Container, t: Task): CheckResult {
  const r = c.exec(t.runCommand, { timeoutMs: 20 * 60_000 });
  const norm = (s: string) => s.replace(/\r\n/g, "\n").trimEnd();
  if (r.code !== 0) return { correct: false, ms: r.ms, message: `exit code ${r.code}\n${r.stderr.slice(0, 2000)}` };
  if (norm(r.stdout) !== norm(t.problem.expected)) {
    return {
      correct: false,
      ms: r.ms,
      message: `output differs\n--- expected\n${norm(t.problem.expected).slice(0, 600)}\n--- got\n${norm(r.stdout).slice(0, 600)}`,
    };
  }
  return { correct: true, ms: r.ms };
}

/* ------------------------------------------------------------------ verify */

export function verify(opts: {
  language: string;
  version?: string;
  variant?: string;
  problems?: string[];
}): boolean {
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

/* ------------------------------------------------------------------- bench */

function captureEnvironment(c: Container, image: string, anchors: Session["anchors"]): Session {
  const sh = (cmd: string) => c.exec(cmd).stdout.trim();
  const env = process.env;
  const commit = env.GITHUB_SHA ?? execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  const hf = sh("hyperfine --version").replace("hyperfine", "").trim();
  return {
    date: new Date().toISOString(),
    actionsRunUrl:
      env.GITHUB_RUN_ID && env.GITHUB_REPOSITORY
        ? `${env.GITHUB_SERVER_URL ?? "https://github.com"}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
        : undefined,
    repoCommit: commit,
    image,
    imageDigest: c.imageDigest(),
    hyperfineVersion: hf,
    hardware: {
      cpuModel: sh("grep -m1 'model name' /proc/cpuinfo | cut -d: -f2") || sh("uname -m"),
      cores: Number(sh("nproc")),
      ramBytes: Number(sh("grep MemTotal /proc/meminfo | awk '{print $2}'")) * 1024,
      arch: sh("uname -m"),
    },
    kernel: sh("uname -r"),
    osRelease: sh(". /etc/os-release && echo $PRETTY_NAME"),
    glibc: sh("ldd --version 2>&1 | head -n1"),
    anchorSpec: ANCHOR.spec,
    anchors,
  };
}

export async function bench(opts: {
  language: string;
  version: string;
  reps?: number; // override max runs (for dry runs)
  problems?: string[];
  variant?: string;
  dryRun?: boolean;
  /** write a fragment file (merged later by `lb merge`) instead of appending to data/<lang>.json */
  out?: string;
  sessionSuffix?: string;
}): Promise<void> {
  const lang = findLanguage(opts.language);
  const image = imageFor(lang.spec, opts.version);
  const problems = loadProblems(ROOT).filter((p) => !opts.problems || opts.problems.includes(p.spec.id));
  const sessionId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${lang.spec.id}-${opts.version}${opts.sessionSuffix ? "-" + opts.sessionSuffix : ""}`;
  const workDir = path.join(WORK, sessionId);
  fs.mkdirSync(workDir, { recursive: true });
  prepareInputs(problems, workDir);

  /* anchor container (on the same VM as the benchmark container) */
  const anchorDir = path.join(WORK, `${sessionId}-anchor`);
  const ac = Container.start(`lb-anchor-${process.pid}`, ANCHOR.image, anchorDir, log);
  const bc = Container.start(`lb-bench-${process.pid}`, image, workDir, log);
  try {
    ac.exec("mkdir -p /work/anchor");
    const ab = ac.exec(ANCHOR.build);
    if (ab.code !== 0) throw new Error(`anchor build failed: ${ab.stderr}`);
    const anchors: Session["anchors"] = [];
    const measureAnchor = (at: "start" | "middle" | "end") => {
      log(`[anchor] ${at}`);
      const runs = opts.reps ? Math.min(opts.reps, ANCHOR.runs) : ANCHOR.runs;
      anchors.push({ at, hyperfine: runHyperfine(ac, anchorDir, ANCHOR.run, runs, 2) });
    };

    const tasks = planTasks(lang.spec, opts.version, problems, { variant: opts.variant });
    const rnd = mulberry32(hashSeed(sessionId));
    for (let i = tasks.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [tasks[i], tasks[j]] = [tasks[j]!, tasks[i]!];
    }

    const toolVersion = bc.exec(lang.spec.toolVersionCmd).stdout.trim();
    const measurements: Measurement[] = [];
    measureAnchor("start");
    for (const [n, t] of tasks.entries()) {
      if (n === Math.floor(tasks.length / 2)) measureAnchor("middle");
      const label = `${lang.spec.id} ${opts.version} ${t.variant.id} ${t.problem.spec.id}`;
      const b = build(bc, t);
      if (!b.ok) {
        log(`[skip] ${label}: ${b.message}`);
        continue;
      }
      const chk = check(bc, t);
      if (!chk.correct) log(`[WRONG OUTPUT] ${label}: ${chk.message}`);
      const budget = t.problem.spec.budgetSeconds;
      const { min, max } = t.problem.spec.runs;
      const maxRuns = opts.reps ? Math.min(opts.reps, max) : max;
      const est = Math.max(chk.ms / 1000, 1e-3);
      const runs = Math.max(opts.reps ? Math.min(opts.reps, min) : min, Math.min(maxRuns, Math.floor(budget / est)));
      log(`[bench] ${label}: ~${est.toFixed(2)}s/run -> ${runs} runs`);
      const hf = runHyperfine(bc, workDir, t.runCommand, runs);
      measurements.push({
        sessionId,
        version: opts.version,
        toolVersion,
        variant: t.variant.id,
        problem: t.problem.spec.id,
        buildCommand: t.buildCommand,
        runCommand: t.runCommand,
        sourceHash: t.sourceHash,
        correct: chk.correct,
        binarySize: b.binarySize,
        hyperfine: hf,
      });
    }
    measureAnchor("end");

    const session = captureEnvironment(bc, image, anchors);
    session.order = tasks.map((t) => `${t.variant.id}/${t.problem.spec.id}`);
    if (opts.dryRun) {
      log(`[dry-run] ${measurements.length} measurements, not writing data`);
      return;
    }
    if (opts.out) {
      fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
      fs.writeFileSync(opts.out, JSON.stringify({ language: lang.spec.id, sessionId, session, measurements }));
      log(`[done] wrote fragment ${opts.out} (${measurements.length} measurements)`);
      return;
    }
    await appendData(lang.spec.id, sessionId, session, measurements);
    log(`[done] wrote ${measurements.length} measurements to data/${lang.spec.id}.json (session ${sessionId})`);
  } finally {
    ac.stop();
    bc.stop();
  }
}

export async function appendData(language: string, sessionId: string, session: Session, ms: Measurement[]) {
  const file = path.join(ROOT, "data", `${language}.json`);
  const data: LanguageData = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : { schemaVersion: 1, language, sessions: {}, measurements: [] };
  if (data.sessions[sessionId]) throw new Error(`session ${sessionId} already recorded`);
  data.sessions[sessionId] = session; // append-only: existing entries are never touched
  data.measurements.push(...ms);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const cfg = (await prettier.resolveConfig(file)) ?? {};
  fs.writeFileSync(file, await prettier.format(JSON.stringify(data), { ...cfg, parser: "json" }));
}
