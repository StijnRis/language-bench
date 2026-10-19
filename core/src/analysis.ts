import {
  aggregateSessions,
  envKey,
  fitHardware,
  mean,
  median,
  ratioCI,
  summarizeReps,
  type Aggregate,
  type Obs,
  type RepSummary,
} from "./stats";
import { benchmarkKey, extractRuns, type LanguageData, type Measurement, type Session } from "./schema";
import { coldSeconds, warmDurations } from "./kernel";

/**
 * What a benchmark's time is.
 *  - warm: the kernel time of an iteration after the warm-up (median over the iterations of a session), the default
 *  - cold: the kernel time of the first iteration (JIT, caches, lazy initialisation included)
 *  - e2e: process start to exit of one iteration, as hyperfine measures it
 */
export type Metric = "warm" | "cold" | "e2e";
export const METRICS: Metric[] = ["warm", "cold", "e2e"];
export const METRIC_LABEL: Record<Metric, string> = { warm: "kernel (warm)", cold: "kernel (cold)", e2e: "end-to-end" };

/** At most this many repetitions per session enter the bootstrap and are kept for display (evenly spaced). */
const MAX_REPS = 100;
const CURVE_POINTS = 120;

function thin(xs: number[], max: number): number[] {
  if (xs.length <= max) return xs;
  const out: number[] = [];
  for (let i = 0; i < max; i++) out.push(xs[Math.floor((i * (xs.length - 1)) / (max - 1))]!);
  return out;
}

export function warmupSecondsOf(s: Session): number {
  const w = (s.config as { kernel?: { warmupSeconds?: unknown } }).kernel?.warmupSeconds;
  if (typeof w !== "number") throw new Error(`session ${s.id}: config.kernel.warmupSeconds is missing; the session file is not in the current format`);
  return w;
}

const where = (m: Measurement) => `${m.language} ${m.version} ${m.variant} ${m.problem} (session ${m.sessionId})`;

/** The metrics a measurement has: kernel problems have all three, the start-up problem only end-to-end. */
export const metricsOf = (m: Pick<Measurement, "kind">): Metric[] => (m.kind === "kernel" ? METRICS : ["e2e"]);

/** Iteration times of one measurement under a metric. Throws when the measurement lacks the data its kind requires. */
export function repsOf(m: Measurement, metric: Metric, warmupSeconds: number): number[] {
  if (metric === "e2e") {
    if (!m.runs || m.runs.wall.length === 0) throw new Error(`${where(m)}: no end-to-end runs`);
    return extractRuns(m.runs).times;
  }
  if (m.kind !== "kernel") throw new Error(`${where(m)}: a ${m.kind} problem has no ${metric} time`);
  const d = m.kernel?.durations;
  if (!d || d.length === 0) throw new Error(`${where(m)}: no kernel iterations recorded`);
  return metric === "cold" ? [coldSeconds(d)] : warmDurations(d, warmupSeconds);
}

/** Software environment of a session: the OS image of the runner. Sessions sharing it share its effect. */
export function environmentOf(s: Session): string {
  const r = s.runner as Record<string, string | undefined>;
  const arch = r.RUNNER_ARCH ?? (s.host as Record<string, any>).arch ?? "";
  return `${r.ImageOS ?? r.RUNNER_OS ?? "unknown"} ${arch}`.trim();
}

export interface SessionDetail {
  sessionId: string;
  date: string;
  cpuModel: string;
  cores: number;
  runUrl?: string;
  repoCommit: string;
  imageDigest?: string;
  hyperfineVersion?: string;
  /** repetition times under the benchmark's primary metric (thinned to at most 100 evenly spaced values) */
  reps: number[];
  /** peak resident memory of every end-to-end run (bytes) */
  memory: number[];
  summary: RepSummary;
  /** kernel loop of this session: iteration count, cold time, warm median (seconds) */
  iterations?: number;
  cold?: number;
  warm?: number;
  /** median end-to-end time (seconds) */
  e2e: number;
  /** kernel time of the iterations in order (thinned to 120 points), for the warm-up curve */
  curve?: number[];
  /** peak memory during the kernel loop (bytes) */
  peakMemory?: number;
  flags: string[];
  /** how much slower (>1) or faster (<1) this session's machine is than the average machine */
  machineFactor: number;
  /** software environment (OS image) of the session */
  environment: string;
  /** workload-specific effect of that environment on this problem (multiplier, 1 = none) */
  envFactor: number;
  /** session median divided by machine factor and environment factor */
  adjustedMedian: number;
  /** average memory in bytes: kernel regions of the loop (kernel metrics) or mean peak resident memory of the runs (end-to-end) */
  meanMemory: number;
  correct: boolean;
}

export interface MetricAggregate {
  score: number;
  low: number;
  high: number;
  sessions: number;
}

export interface BenchmarkResult {
  key: string;
  language: string;
  version: string;
  toolVersion: string;
  variant: string;
  problem: string;
  buildCommand?: string;
  runCommand: string;
  sourceHash: string;
  binarySize?: number;
  correct: boolean;
  sessions: SessionDetail[];
  agg: Omit<Aggregate, "bootstrap">;
  /** the metric of agg/refSeconds: warm when the benchmark has kernel data, else end-to-end */
  metric: Metric;
  /** the same aggregate under every metric that has data (seconds on the average machine) */
  byMetric: Partial<Record<Metric, MetricAggregate>>;
  /** automatic flags raised in any session (see kernelFlags) */
  flags: string[];
  /** highest memory seen during the kernel loop of any session (bytes, 0 = not measured) */
  peakBytes: number;
  /** seconds on the average machine, with 95% interval */
  refSeconds: number;
  refLow: number;
  refHigh: number;
  /** average (over sessions) of the average (over repetitions) peak resident memory, bytes */
  memoryBytes: number;
  /** false when this benchmark's sessions are not (yet) linked to the main group via shared benchmarks */
  linked: boolean;
  firstDate: string;
  lastDate: string;
  cpuModels: string[];
}

export interface Analysis {
  benchmarks: BenchmarkResult[];
  sessionCount: number;
  cpuModels: string[];
  /** residual noise (geometric factor) of the hardware model, i.e. what remains unexplained */
  residualSpread: number;
  /** machine factor per session id */
  machineFactors: Map<string, number>;
  /** distinct software environments (OS images) seen in the sessions */
  environments: string[];
  bootstraps: Map<string, number[]>;
}

export const MIN_SESSIONS_FOR_FINAL = 3;

/** Bootstrap key of a benchmark under a metric. */
export const bootKey = (metric: Metric, key: string) => `${metric}|${key}`;

export function analyze(sessions: Record<string, Session>, datas: LanguageData[], iterations = 1000): Analysis {
  type Row = { m: Measurement; warmup: number };
  const groups = new Map<string, Row[]>();
  for (const d of datas)
    for (const m of d.measurements) {
      if (m.status !== "ok" || !sessions[m.sessionId]) continue;
      const warmup = warmupSecondsOf(sessions[m.sessionId]!);
      for (const metric of metricsOf(m)) repsOf(m, metric, warmup); // validates the data
      const k = benchmarkKey(m);
      (groups.get(k) ?? groups.set(k, []).get(k)!).push({ m, warmup });
    }
  /** warm kernel time for kernel problems, end-to-end for the start-up problem */
  const primaryOf = (rows: Row[]): Metric => (rows[0]!.m.kind === "kernel" ? "warm" : "e2e");

  const obs: Obs[] = [];
  for (const [k, rows] of groups) {
    const metric = primaryOf(rows);
    for (const r of rows) obs.push({ bench: k, session: r.m.sessionId, y: Math.log(median(repsOf(r.m, metric, r.warmup))), env: environmentOf(sessions[r.m.sessionId]!), group: r.m.problem });
  }
  const fit = fitHardware(obs);
  // the main component = the one with the most sessions
  let main = -1;
  let best = 0;
  for (const [c, n] of fit.componentSizes) if (n > best) ((best = n), (main = c));

  const benchmarks: BenchmarkResult[] = [];
  const bootstraps = new Map<string, number[]>();
  for (const [k, rows] of groups) {
    const metric = primaryOf(rows);
    const details: SessionDetail[] = rows
      .map(({ m, warmup }) => {
        const s = sessions[m.sessionId]!;
        const environment = environmentOf(s);
        const factor = Math.exp(fit.h.get(m.sessionId) ?? 0);
        const envFactor = Math.exp(fit.envEffect.get(envKey(environment, m.problem)) ?? 0);
        const reps = repsOf(m, metric, warmup);
        const summary = summarizeReps(reps);
        const image = s.containers?.[m.containerImage] ?? {};
        const kd = m.kernel?.durations;
        const e2e = repsOf(m, "e2e", warmup);
        const mem = m.kernel?.memory;
        if (m.kind === "kernel" && !mem) throw new Error(`${where(m)}: no memory samples`);
        const runMemory = m.runs ? extractRuns(m.runs).memory : [];
        return {
          sessionId: m.sessionId,
          date: s.startedAt,
          cpuModel: s.host.cpu.model,
          cores: s.host.cpu.cores,
          runUrl: s.trigger?.runUrl,
          repoCommit: s.repoCommit,
          imageDigest: image.digest,
          hyperfineVersion: s.tooling?.hyperfineVersion,
          reps: thin(reps, MAX_REPS),
          memory: runMemory,
          summary,
          iterations: kd?.length,
          cold: kd?.length ? coldSeconds(kd) : undefined,
          warm: kd?.length ? median(warmDurations(kd, warmup)) : undefined,
          e2e: median(e2e),
          curve: kd?.length ? thin(kd, CURVE_POINTS) : undefined,
          peakMemory: mem?.peakBytes,
          flags: m.kernel?.flags ?? [],
          machineFactor: factor,
          environment,
          envFactor,
          adjustedMedian: summary.median / (factor * envFactor),
          meanMemory: mem ? mem.avgBytes : mean(runMemory),
          correct: m.correct,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    const last = rows[rows.length - 1]!.m;
    const byMetric: BenchmarkResult["byMetric"] = {};
    let primary!: Omit<Aggregate, "bootstrap">;
    for (const metricName of METRICS) {
      if (!metricsOf(last).includes(metricName)) continue;
      const samples = rows.map(({ m, warmup }) => {
        const d = details.find((x) => x.sessionId === m.sessionId)!;
        return { reps: thin(repsOf(m, metricName, warmup), MAX_REPS), logFactor: Math.log(d.machineFactor * d.envFactor) };
      });
      const { bootstrap, ...agg } = aggregateSessions(samples, metricName === metric ? k : `${metricName}|${k}`, iterations);
      bootstraps.set(bootKey(metricName, k), bootstrap);
      byMetric[metricName] = { score: agg.score, low: agg.ciLow, high: agg.ciHigh, sessions: agg.sessions };
      if (metricName === metric) primary = agg;
    }
    const mem = details.map((d) => d.meanMemory).filter((x) => x > 0);
    const peaks = details.map((d) => d.peakMemory ?? 0);
    benchmarks.push({
      key: k,
      language: last.language,
      version: last.version,
      toolVersion: last.toolVersion,
      variant: last.variant,
      problem: last.problem,
      buildCommand: last.buildCommand,
      runCommand: last.runCommand,
      sourceHash: last.sourceHash,
      binarySize: last.binarySize,
      correct: details.every((d) => d.correct),
      sessions: details,
      agg: primary,
      metric,
      byMetric,
      flags: [...new Set(details.flatMap((d) => d.flags))],
      peakBytes: Math.max(0, ...peaks),
      refSeconds: primary.score,
      refLow: primary.ciLow,
      refHigh: primary.ciHigh,
      memoryBytes: mem.length ? mean(mem) : 0,
      linked: fit.component.get(details[0]!.sessionId) === main,
      firstDate: details[0]!.date,
      lastDate: details[details.length - 1]!.date,
      cpuModels: [...new Set(details.map((d) => d.cpuModel))],
    });
  }
  return {
    benchmarks,
    sessionCount: Object.keys(sessions).length,
    cpuModels: [...new Set(Object.values(sessions).map((s) => s.host.cpu.model))],
    residualSpread: Math.exp(fit.residualSd),
    environments: [...new Set(Object.values(sessions).map(environmentOf))].sort(),
    machineFactors: new Map([...fit.h].map(([s, v]) => [s, Math.exp(v)])),
    bootstraps,
  };
}

/** Time of `b` relative to `ref` (ref = 1.0) under a metric (default: the benchmark's own). >1 means slower. */
export function indexVs(
  analysis: Analysis,
  b: BenchmarkResult,
  ref: BenchmarkResult,
  metric: Metric = b.metric,
): { index: number; low: number; high: number } {
  const [low, high] = ratioCI(analysis.bootstraps.get(bootKey(metric, b.key)) ?? [], analysis.bootstraps.get(bootKey(metric, ref.key)) ?? []);
  const x = b.byMetric[metric]?.score ?? NaN;
  const y = ref.byMetric[metric]?.score ?? NaN;
  return { index: x / y, low, high };
}
