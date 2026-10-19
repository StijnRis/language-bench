import { spawn } from "node:child_process";
import fs from "node:fs";
import {
  alignMemory,
  contractViolations,
  kernelFlags,
  parseHarness,
  type Config,
  type HarnessOutput,
  type Kernel,
  type MemorySample,
  type Runs,
} from "@lb/core";
import type { Container, ExecResult } from "./docker";
import { runHyperfine } from "./hyperfine";
import type { Task } from "./session";
import { referenceHashes, toolPath } from "./tools";

/* ------------------------------------------------------------------ build */

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
  const r = c.exec(t.buildCommand, { timeoutSeconds: 15 * 60 });
  const seconds = (performance.now() - t0) / 1000;
  const output = (r.stdout + r.stderr).slice(0, 4000);
  if (r.code !== 0) return { ok: false, seconds, output, message: `build failed:\n${output}` };
  const size = c.exec(`stat -c %s ${t.bin}`);
  return { ok: true, seconds, output, binarySize: size.code === 0 ? Number(size.stdout.trim()) : undefined };
}

/* ------------------------------------------------------------------ one harness run */

interface HarnessRun {
  out: HarnessOutput;
  result: ExecResult;
  samples: MemorySample[];
}

interface RunOptions {
  maxIterations?: number;
  budgetSeconds?: number;
  minIterations?: number;
  sample?: boolean;
  /** extra environment (end-to-end runs) */
  env?: Record<string, string>;
}

/** Collects `<realtime ns> <bytes>` lines from lbsample until stopped. */
function startSampler(statPath: string | undefined, millis: number) {
  const samples: MemorySample[] = [];
  if (!statPath) return { stop: async () => samples };
  const p = spawn(toolPath("lbsample"), [statPath, String(Math.round(millis * 1000))], { stdio: ["ignore", "pipe", "ignore"] });
  let buf = "";
  p.stdout.on("data", (d) => {
    buf += d;
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const [w, b] = buf.slice(0, i).split(" ");
      buf = buf.slice(i + 1);
      if (w && b) samples.push({ wallNs: Number(w), bytes: Number(b) });
    }
  });
  const closed = new Promise<void>((r) => p.on("close", () => r()));
  return {
    stop: async () => {
      p.kill("SIGTERM");
      await closed;
      return samples;
    },
  };
}

async function runHarness(c: Container, t: Task, cfg: Config, o: RunOptions = {}): Promise<HarnessRun> {
  const k = cfg.kernel;
  const env: Record<string, string> = {
    LB_INPUT: t.problem.spec.instance,
    LB_PROBLEM: t.problem.spec.id,
    LB_BUDGET_SECONDS: String(o.budgetSeconds ?? k.budgetSeconds),
    LB_MIN_ITERS: String(o.minIterations ?? k.minIterations),
    LB_START: "0",
    ...(o.maxIterations ? { LB_MAX_ITERS: String(o.maxIterations) } : {}),
    ...o.env,
  };
  const sampler = o.sample ? startSampler(c.memoryStatPath(), k.sampleMillis) : undefined;
  const opts = { env, timeoutSeconds: k.timeoutSeconds };
  const result =
    t.problem.spec.instance === "stream"
      ? await c.pipeline(["stream", t.problem.spec.id, "0"], t.runCommand, opts)
      : c.exec(t.runCommand, opts);
  const samples = sampler ? await sampler.stop() : [];
  return { out: parseHarness(result.stdout), result, samples };
}

const tail = (r: ExecResult) => `exit ${r.code}${r.timedOut ? " (timed out)" : ""}\n${(r.stderr || r.stdout).slice(-1500)}`;

/** Checks the first iterations against the reference hashes of the generator. */
function compare(out: HarnessOutput, problem: string, n: number) {
  const k = Math.min(n, out.iterations.length);
  const refs = referenceHashes(problem, k);
  let matched = 0;
  let first: string | undefined;
  for (let i = 0; i < k; i++) {
    if (out.iterations[i]!.check === refs[i]) matched++;
    else first ??= `iteration ${i + 1}: got ${out.iterations[i]!.check}, expected ${refs[i]}`;
  }
  return { checked: k, matched, first };
}

/* ------------------------------------------------------------------ validation (no benchmark) */

export async function validateTask(c: Container, t: Task, cfg: Config, iterations: number) {
  const b = build(c, t);
  if (!b.ok) return { ok: false as const, message: b.message ?? "build failed", iterations: 0, seconds: 0 };
  const r = await runHarness(c, t, cfg, { maxIterations: t.problem.spec.kind === "startup" ? 1 : iterations });
  if (r.result.code !== 0 || !r.out.iterations.length) return { ok: false as const, message: `run failed: ${tail(r.result)}`, iterations: 0, seconds: 0 };
  const cmp = compare(r.out, t.problem.spec.id, iterations);
  const seconds = r.out.iterations.reduce((a, i) => a + (i.t1 - i.t0) / 1e9, 0) / r.out.iterations.length;
  if (cmp.matched !== cmp.checked) return { ok: false as const, message: `results differ from the reference: ${cmp.first}`, iterations: r.out.iterations.length, seconds };
  return { ok: true as const, iterations: r.out.iterations.length, seconds };
}

/* ------------------------------------------------------------------ conformance */

export async function conformanceTask(c: Container, t: Task, cfg: Config) {
  const b = build(c, t);
  if (!b.ok) return { ok: false as const, message: b.message ?? "build failed", iterations: 0 };
  const problems: string[] = [];
  const budget = 0.3, min = 3;
  const a = await runHarness(c, t, cfg, { budgetSeconds: budget, minIterations: min });
  if (a.result.code !== 0) return { ok: false as const, message: `budget run failed: ${tail(a.result)}`, iterations: 0 };
  problems.push(...contractViolations(a.out, { minIterations: min, budgetSeconds: budget }).map((x) => `budget run: ${x}`));
  const refs = referenceHashes("conformance", a.out.iterations.length);
  a.out.iterations.forEach((it, i) => {
    if (it.check !== refs[i]) problems.push(`budget run: iteration ${it.n} has check ${it.check}, the reference of instance ${i} is ${refs[i]} (instances reused or skipped?)`);
  });
  const lim = await runHarness(c, t, cfg, { maxIterations: 2, budgetSeconds: 100 });
  if (lim.result.code !== 0) problems.push(`LB_MAX_ITERS=2 run failed: ${tail(lim.result)}`);
  else problems.push(...contractViolations(lim.out, { minIterations: min, budgetSeconds: 100, maxIterations: 2 }).map((x) => `limited run: ${x}`));
  const slow = await runHarness(c, t, cfg, { budgetSeconds: 0.2, minIterations: 6 });
  if (slow.out.iterations.length < 6) problems.push(`LB_MIN_ITERS=6 was not respected (${slow.out.iterations.length} iterations)`);
  return problems.length ? { ok: false as const, message: problems.join("\n"), iterations: a.out.iterations.length } : { ok: true as const, iterations: a.out.iterations.length };
}

/* ------------------------------------------------------------------ the benchmark of one task */

export type Measured =
  | { status: "failed"; error: string; correct: boolean; buildSeconds?: number; buildOutput?: string; binarySize?: number }
  | {
      status: "ok" | "incomplete";
      error?: string;
      correct: boolean;
      buildSeconds?: number;
      buildOutput?: string;
      binarySize?: number;
      kernel?: Kernel;
      runs?: Runs;
      hyperfineArgs?: string;
    };

const round9 = (x: number) => Math.round(x * 1e9) / 1e9;

export async function measureTask(c: Container, t: Task, cfg: Config, workDir: string, log: (...a: unknown[]) => void, label: string): Promise<Measured> {
  const b = build(c, t);
  if (!b.ok) return { status: "failed", error: b.message ?? "build failed", correct: false, buildSeconds: b.seconds, buildOutput: b.output };
  const info = { buildSeconds: b.seconds, buildOutput: b.output, binarySize: b.binarySize };
  const spec = t.problem.spec;
  const checked = cfg.kernel.checkedIterations;

  // 1. a short run first: wrong results are not worth ten seconds of benchmarking
  const probe = await runHarness(c, t, cfg, { maxIterations: spec.kind === "startup" ? 1 : 3 });
  if (probe.result.code !== 0 || !probe.out.iterations.length) return { status: "failed", error: `run failed: ${tail(probe.result)}`, correct: false, ...info };
  const pc = compare(probe.out, spec.id, 3);
  if (pc.matched !== pc.checked) return { status: "failed", error: `results differ from the reference: ${pc.first}`, correct: false, ...info };

  // 2. the kernel loop
  let kernel: Kernel | undefined;
  let status: "ok" | "incomplete" = "ok";
  let error: string | undefined;
  let coldEstimate = probe.out.iterations[0] ? (probe.out.iterations[0].t1 - probe.out.iterations[0].t0) / 1e9 : 0.1;
  if (spec.kind === "kernel") {
    const r = await runHarness(c, t, cfg, { sample: true });
    const violations = r.result.code === 0 ? contractViolations(r.out, { minIterations: cfg.kernel.minIterations, budgetSeconds: cfg.kernel.budgetSeconds }) : [];
    if (r.result.timedOut || r.result.code === 124 || r.result.code === 137) {
      status = "incomplete";
      error = `kernel run hit the hard timeout of ${cfg.kernel.timeoutSeconds} s`;
    } else if (r.result.code !== 0 || !r.out.iterations.length) {
      return { status: "failed", error: `kernel run failed: ${tail(r.result)}`, correct: false, ...info };
    } else if (violations.length) {
      return { status: "failed", error: `harness output violates the contract: ${violations.slice(0, 5).join("; ")}`, correct: false, ...info };
    } else {
      const cmp = compare(r.out, spec.id, checked);
      const durations = r.out.iterations.map((i) => round9((i.t1 - i.t0) / 1e9));
      const first = r.out.iterations[0]!.t0;
      const k: Kernel = {
        clock: r.out.clock,
        budgetSeconds: cfg.kernel.budgetSeconds,
        iterations: durations.length,
        kernelSeconds: round9(durations.reduce((a, d) => a + d, 0)),
        reason: r.out.done?.reason === "iters" ? "iters" : "budget",
        durations,
        starts: r.out.iterations.map((i) => round9((i.t0 - first) / 1e9)),
        checked: cmp.checked,
        matched: cmp.matched,
        memory: alignMemory(r.out, r.samples),
        flags: [],
      };
      k.flags = kernelFlags(k, cfg.kernel.warmupSeconds);
      if (cmp.matched !== cmp.checked) return { status: "failed", error: `results differ from the reference: ${cmp.first}`, correct: false, ...info };
      kernel = k;
      coldEstimate = durations[0]!;
      log(`[kernel] ${label}: ${k.iterations} iterations, cold ${(durations[0]! * 1000).toFixed(2)} ms${k.memory ? `, ${(k.memory.avgBytes / 1e6).toFixed(1)} MB` : ""}${k.flags.length ? `, flags: ${k.flags.join(", ")}` : ""}`);
    }
  }
  if (status === "incomplete") return { status, error, correct: true, ...info };

  // 3. end to end: one iteration per process, process start to exit
  const hf = endToEnd(c, t, cfg, workDir, coldEstimate, log, label);
  return { status, correct: true, ...info, kernel, runs: hf.runs, hyperfineArgs: hf.args };
}

function endToEnd(c: Container, t: Task, cfg: Config, workDir: string, estimate: number, log: (...a: unknown[]) => void, label: string) {
  const spec = t.problem.spec;
  const env: Record<string, string> = { LB_INPUT: spec.instance, LB_PROBLEM: spec.id, LB_MAX_ITERS: "1", LB_START: "0" };
  let stdinFile: string | undefined;
  let cleanup: (() => void) | undefined;
  if (spec.instance === "stream") {
    const rel = `inputs/${spec.id}.i0`;
    const host = c.hostWorkPath(rel);
    if (!fs.existsSync(host)) {
      fs.mkdirSync(c.hostWorkPath("inputs"), { recursive: true });
      const fd = fs.openSync(host, "w");
      const r = spawnSyncGen(["instance", spec.id, "0"], fd);
      fs.closeSync(fd);
      if (r !== 0) throw new Error(`lbgen instance ${spec.id} failed`);
    }
    stdinFile = `/work/${rel}`;
  } else if (spec.instance === "file") {
    // the file is part of the input, not of the run: generate it once, every run reads the same one
    const path = "/dev/shm/lb-e2e-input";
    const g = c.exec(`/usr/local/bin/lbgen file ${spec.id} 0 ${path}`);
    if (g.code !== 0) throw new Error(`generating the end-to-end input failed: ${g.stderr}`);
    env.LB_FILE = path;
    env.LB_FILE_READY = "1";
    cleanup = () => void c.exec(`rm -f ${path}`);
  }
  try {
    const { min, max } = spec.runs;
    const hi = Math.min(max, cfg.repetitions.max);
    const lo = Math.max(cfg.repetitions.min, Math.min(min, cfg.repetitions.max));
    const est = Math.max(estimate + 0.1, 1e-3);
    const runs = Math.max(lo, Math.min(hi, Math.floor((spec.budgetSeconds * cfg.budgetSecondsScale) / est)));
    log(`[e2e] ${label}: ~${est.toFixed(2)}s/run -> ${runs} runs`);
    const prefix = Object.entries(env).map(([k, v]) => `${k}='${v}'`).join(" ");
    return runHyperfine(c, workDir, `${prefix} ${t.runCommand}`, runs, cfg.warmupRuns, stdinFile);
  } finally {
    cleanup?.();
  }
}

import { spawnSync } from "node:child_process";
function spawnSyncGen(args: string[], fd: number) {
  return spawnSync(toolPath("lbgen"), args, { stdio: ["ignore", fd, "inherit"] }).status;
}
