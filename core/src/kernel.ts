/**
 * Helpers for the in-process kernel loop (harness/CONTRACT.md): parsing the harness output, lining the
 * host's memory samples up with the timed regions, the warm-up cutoff and the automatic flags.
 */
import { median } from "./stats";
import type { Kernel } from "./schema";

export interface HarnessIteration {
  n: number;
  t0: number;
  t1: number;
  check: string;
}
export interface HarnessOutput {
  clock: string;
  mono0: number;
  wall0: number;
  iterations: HarnessIteration[];
  done?: { iters: number; kernelNs: number; reason: string };
}

/** Parses the lines a harness prints (LB / START / ITER / DONE). Times stay in nanoseconds. */
export function parseHarness(stdout: string): HarnessOutput {
  const out: HarnessOutput = { clock: "", mono0: NaN, wall0: NaN, iterations: [] };
  const field = (line: string, k: string) => line.match(new RegExp(`(?:^|\\s)${k}=(\\S+)`))?.[1];
  for (const line of stdout.split("\n")) {
    if (line.startsWith("LB ")) out.clock = field(line, "clock") ?? "";
    else if (line.startsWith("START ")) {
      out.mono0 = Number(field(line, "mono"));
      out.wall0 = Number(field(line, "wall"));
    } else if (line.startsWith("ITER ")) {
      const n = Number(line.split(/\s+/)[1]);
      out.iterations.push({ n, t0: Number(field(line, "t0")), t1: Number(field(line, "t1")), check: field(line, "check") ?? "" });
    } else if (line.startsWith("DONE ")) {
      out.done = { iters: Number(field(line, "iters")), kernelNs: Number(field(line, "kernel_ns")), reason: field(line, "reason") ?? "" };
    }
  }
  return out;
}

/** Problems with the harness output itself (format, ordering, counts); an empty list means it follows the contract. */
export function contractViolations(o: HarnessOutput, opts: { minIterations: number; budgetSeconds: number; maxIterations?: number }): string[] {
  const v: string[] = [];
  if (!o.clock) v.push("missing LB line");
  if (!Number.isFinite(o.mono0) || !Number.isFinite(o.wall0)) v.push("missing START line");
  if (!o.done) v.push("missing DONE line");
  if (!o.iterations.length) v.push("no iterations");
  let prev = -Infinity;
  let kernel = 0;
  o.iterations.forEach((it, i) => {
    if (it.n !== i + 1) v.push(`iteration numbered ${it.n}, expected ${i + 1}`);
    if (!(it.t1 >= it.t0)) v.push(`iteration ${it.n}: t1 < t0`);
    if (!(it.t0 >= prev)) v.push(`iteration ${it.n}: timestamps go backwards`);
    if (!/^\d+:\d+$/.test(it.check)) v.push(`iteration ${it.n}: malformed check "${it.check}"`);
    prev = it.t1;
    kernel += it.t1 - it.t0;
  });
  if (o.done) {
    if (o.done.iters !== o.iterations.length) v.push(`DONE says ${o.done.iters} iterations, ${o.iterations.length} were printed`);
    if (Math.abs(o.done.kernelNs - kernel) > 1000) v.push(`DONE kernel_ns ${o.done.kernelNs} differs from the sum of the iterations ${kernel}`);
  }
  const n = o.iterations.length;
  const limited = opts.maxIterations !== undefined && opts.maxIterations > 0;
  if (limited) {
    if (n !== opts.maxIterations) v.push(`ran ${n} iterations, LB_MAX_ITERS was ${opts.maxIterations}`);
  } else {
    if (n < opts.minIterations) v.push(`only ${n} iterations, minimum is ${opts.minIterations}`);
    if (kernel < opts.budgetSeconds * 1e9 && n >= opts.minIterations) v.push("stopped before the budget was used up");
    if (n > opts.minIterations && kernel - (o.iterations[n - 1]!.t1 - o.iterations[n - 1]!.t0) >= opts.budgetSeconds * 1e9) v.push("kept running after the budget was used up");
  }
  return v;
}

export interface MemorySample {
  wallNs: number;
  bytes: number;
}

/**
 * Memory during the timed regions: samples are a step function (a sample holds until the next one). The
 * regions are placed on the host's wall clock through the START line of the harness.
 */
export function alignMemory(o: HarnessOutput, samples: MemorySample[]): Kernel["memory"] | undefined {
  if (!samples.length || !o.iterations.length || !Number.isFinite(o.mono0)) return undefined;
  const s = [...samples].sort((a, b) => a.wallNs - b.wallNs);
  const toWall = (t: number) => o.wall0 + (t - o.mono0);
  const value = (t: number) => {
    // last sample at or before t (the first sample if t is earlier)
    let lo = 0, hi = s.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (s[mid]!.wallNs <= t) lo = mid;
      else hi = mid - 1;
    }
    return s[lo]!.bytes;
  };
  /** integral of the step function over [a, b] in byte-nanoseconds */
  const integral = (a: number, b: number) => {
    let lo = 0, hi = s.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (s[mid]!.wallNs <= a) lo = mid;
      else hi = mid - 1;
    }
    let i = lo, t = a, acc = 0;
    while (t < b) {
      const nextT = i + 1 < s.length ? s[i + 1]!.wallNs : Infinity;
      const end = Math.min(nextT, b);
      acc += s[i]!.bytes * (end - t);
      t = end;
      if (end === nextT) i++;
    }
    return acc;
  };
  let weighted = 0, total = 0;
  for (const it of o.iterations) {
    const a = toWall(it.t0), b = toWall(it.t1);
    if (b > a) { weighted += integral(a, b); total += b - a; }
    else { weighted += value(a); total += 1; }
  }
  const last = toWall(o.iterations[o.iterations.length - 1]!.t1);
  const during = s.filter((x) => x.wallNs >= o.wall0 && x.wallNs <= last);
  const run = during.length ? during : s;
  const runAvg = run.reduce((a, x) => a + x.bytes, 0) / run.length;
  return { avgBytes: total ? weighted / total : runAvg, peakBytes: Math.max(...run.map((x) => x.bytes)), runAvgBytes: runAvg, samples: samples.length };
}

/** Kernel times that count as warm: the iterations starting after the first `warmupSeconds` of kernel time. */
export function warmDurations(durations: number[], warmupSeconds: number): number[] {
  let cum = 0;
  const warm: number[] = [];
  for (const d of durations) {
    if (cum >= warmupSeconds) warm.push(d);
    cum += d;
  }
  if (warm.length === 0) throw new Error(`no iteration starts after the first ${warmupSeconds} s of kernel time (${durations.length} iterations, ${cum.toFixed(2)} s in total)`);
  return warm;
}

export const coldSeconds = (durations: number[]) => durations[0]!;
export const warmSeconds = (durations: number[], warmupSeconds: number) => median(warmDurations(durations, warmupSeconds));

/** Automatic flags: suspicious or incomplete kernel results. */
export function kernelFlags(k: Pick<Kernel, "durations" | "iterations" | "checked" | "matched">, warmupSeconds: number): string[] {
  const flags: string[] = [];
  if (k.matched < k.checked) flags.push("checksum-mismatch");
  if (k.iterations < 5) flags.push("few-iterations");
  const med = median(k.durations);
  if (med > 0 && Math.min(...k.durations) < 0.05 * med) flags.push("near-zero-iteration");
  const warm = warmDurations(k.durations, warmupSeconds);
  if (warm.length >= 8) {
    const h = warm.length >> 1;
    const a = median(warm.slice(0, h)), b = median(warm.slice(h));
    if (a > 0 && (b / a > 1.15 || b / a < 1 / 1.15)) flags.push("warmup-unstable");
  }
  return flags;
}

export const FLAG_TEXT: Record<string, string> = {
  "checksum-mismatch": "a result did not match the reference hash",
  "few-iterations": "fewer than 5 iterations fit the budget",
  "near-zero-iteration": "an iteration took far less time than the median (possible caching or skipped work)",
  "warmup-unstable": "the warm-up curve never settled (second half of the warm iterations differs by more than 15% from the first)",
  timeout: "the run hit the hard timeout and is incomplete",
};
