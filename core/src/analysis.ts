import {
  aggregateSessions,
  fitHardware,
  mean,
  median,
  ratioCI,
  summarizeReps,
  type Aggregate,
  type Obs,
  type RepSummary,
} from "./stats";
import { benchmarkKey, extractRuns, type LanguageData, type Session } from "./schema";

export interface SessionDetail {
  sessionId: string;
  date: string;
  cpuModel: string;
  cores: number;
  runUrl?: string;
  repoCommit: string;
  imageDigest?: string;
  hyperfineVersion?: string;
  reps: number[];
  memory: number[];
  summary: RepSummary;
  /** how much slower (>1) or faster (<1) this session's machine is than the average machine */
  machineFactor: number;
  /** session median divided by the machine factor */
  adjustedMedian: number;
  /** mean over repetitions of the peak resident memory (bytes) */
  meanMemory: number;
  correct: boolean;
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
  bootstraps: Map<string, number[]>;
}

export const MIN_SESSIONS_FOR_FINAL = 3;

export function analyze(sessions: Record<string, Session>, datas: LanguageData[], iterations = 1000): Analysis {
  type Row = { m: LanguageData["measurements"][number]; reps: ReturnType<typeof extractRuns> };
  const groups = new Map<string, Row[]>();
  for (const d of datas)
    for (const m of d.measurements) {
      if (m.status !== "ok" || !m.hyperfine || !sessions[m.sessionId]) continue;
      const reps = extractRuns(m.hyperfine);
      if (reps.times.length === 0) continue;
      const k = benchmarkKey(m);
      (groups.get(k) ?? groups.set(k, []).get(k)!).push({ m, reps });
    }

  const obs: Obs[] = [];
  for (const [k, rows] of groups) for (const r of rows) obs.push({ bench: k, session: r.m.sessionId, y: Math.log(median(r.reps.times)) });
  const fit = fitHardware(obs);
  // the main component = the one with the most sessions
  let main = -1;
  let best = 0;
  for (const [c, n] of fit.componentSizes) if (n > best) ((best = n), (main = c));

  const benchmarks: BenchmarkResult[] = [];
  const bootstraps = new Map<string, number[]>();
  for (const [k, rows] of groups) {
    const details: SessionDetail[] = rows
      .map(({ m, reps }) => {
        const s = sessions[m.sessionId]!;
        const factor = Math.exp(fit.h.get(m.sessionId) ?? 0);
        const summary = summarizeReps(reps.times);
        const image = s.containers?.[m.containerImage] ?? {};
        return {
          sessionId: m.sessionId,
          date: s.startedAt,
          cpuModel: s.host.cpu.model,
          cores: s.host.cpu.cores,
          runUrl: s.trigger?.runUrl,
          repoCommit: s.repoCommit,
          imageDigest: image.digest,
          hyperfineVersion: s.tooling?.hyperfineVersion,
          reps: reps.times,
          memory: reps.memory,
          summary,
          machineFactor: factor,
          adjustedMedian: summary.median / factor,
          meanMemory: reps.memory.length ? mean(reps.memory) : 0,
          correct: m.correct,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    const last = rows[rows.length - 1]!.m;
    const { bootstrap, ...agg } = aggregateSessions(
      details.map((d) => ({ reps: d.reps, logFactor: Math.log(d.machineFactor) })),
      k,
      iterations,
    );
    bootstraps.set(k, bootstrap);
    const mem = details.map((d) => d.meanMemory).filter((x) => x > 0);
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
      agg,
      refSeconds: agg.score,
      refLow: agg.ciLow,
      refHigh: agg.ciHigh,
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
    machineFactors: new Map([...fit.h].map(([s, v]) => [s, Math.exp(v)])),
    bootstraps,
  };
}

/** Time of `b` relative to `ref` (ref = 1.0). >1 means slower than the reference. */
export function indexVs(
  analysis: Analysis,
  b: BenchmarkResult,
  ref: BenchmarkResult,
): { index: number; low: number; high: number } {
  const [low, high] = ratioCI(analysis.bootstraps.get(b.key) ?? [], analysis.bootstraps.get(ref.key) ?? []);
  return { index: b.agg.score / ref.agg.score, low, high };
}
