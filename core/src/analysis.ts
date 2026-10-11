import { aggregateSessions, geoMean, median, ratioCI, summarizeReps, type Aggregate, type RepSummary } from "./stats";
import { benchmarkKey, type LanguageData } from "./schema";

export interface SessionDetail {
  sessionId: string;
  date: string;
  cpuModel: string;
  cores: number;
  actionsRunUrl?: string;
  repoCommit: string;
  imageDigest?: string;
  reps: number[];
  memory: number[];
  summary: RepSummary;
  anchorMedian: number;
  /** median(benchmark) / median(anchor) in this session */
  ratio: number;
  medianMemory: number;
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
  /** anchor-normalised score converted to seconds on the "reference machine" (see methodology) */
  refSeconds: number;
  refLow: number;
  refHigh: number;
  /** geometric mean over sessions of the median peak RSS in bytes */
  memoryBytes: number;
  firstDate: string;
  lastDate: string;
  cpuModels: string[];
}

export interface Analysis {
  benchmarks: BenchmarkResult[];
  /** median of all anchor medians = the "reference machine" speed for the anchor workload */
  referenceAnchorSeconds: number;
  sessionCount: number;
  cpuModels: string[];
  /** bootstrap replicates per benchmark key, kept out of the serialisable results */
  bootstraps: Map<string, number[]>;
}

export const MIN_SESSIONS_FOR_FINAL = 3;

export function analyze(datas: LanguageData[], iterations = 1000): Analysis {
  const anchorMedians: number[] = [];
  const cpuSet = new Set<string>();
  let sessionCount = 0;
  for (const d of datas)
    for (const s of Object.values(d.sessions)) {
      sessionCount++;
      cpuSet.add(s.hardware.cpuModel);
      const pooled = s.anchors.flatMap((a) => a.hyperfine.times);
      if (pooled.length) anchorMedians.push(median(pooled));
    }
  const referenceAnchorSeconds = anchorMedians.length ? median(anchorMedians) : 1;

  const benchmarks: BenchmarkResult[] = [];
  const bootstraps = new Map<string, number[]>();
  for (const d of datas) {
    const groups = new Map<string, LanguageData["measurements"]>();
    for (const m of d.measurements) {
      const k = benchmarkKey(m);
      (groups.get(k) ?? groups.set(k, []).get(k)!).push(m);
    }
    for (const [k, ms] of groups) {
      const sessions: SessionDetail[] = [];
      for (const m of ms) {
        const s = d.sessions[m.sessionId];
        if (!s || m.hyperfine.times.length === 0) continue;
        const anchorReps = s.anchors.flatMap((a) => a.hyperfine.times);
        if (anchorReps.length === 0) continue;
        const summary = summarizeReps(m.hyperfine.times);
        const anchorMedian = median(anchorReps);
        sessions.push({
          sessionId: m.sessionId,
          date: s.date,
          cpuModel: s.hardware.cpuModel,
          cores: s.hardware.cores,
          actionsRunUrl: s.actionsRunUrl,
          repoCommit: s.repoCommit,
          imageDigest: s.imageDigest,
          reps: m.hyperfine.times,
          memory: m.hyperfine.memory,
          summary,
          anchorMedian,
          ratio: summary.median / anchorMedian,
          medianMemory: m.hyperfine.memory.length ? median(m.hyperfine.memory) : 0,
          correct: m.correct,
        });
      }
      if (sessions.length === 0) continue;
      sessions.sort((a, b) => a.date.localeCompare(b.date));
      const last = ms[ms.length - 1]!;
      const samples = sessions.map((s) => ({
        reps: s.reps,
        anchorReps: d.sessions[s.sessionId]!.anchors.flatMap((a) => a.hyperfine.times),
      }));
      const { bootstrap, ...agg } = aggregateSessions(samples, `${d.language}|${k}`, iterations);
      bootstraps.set(`${d.language}|${k}`, bootstrap);
      const mem = sessions.map((s) => s.medianMemory).filter((x) => x > 0);
      benchmarks.push({
        key: `${d.language}|${k}`,
        language: d.language,
        version: last.version,
        toolVersion: last.toolVersion,
        variant: last.variant,
        problem: last.problem,
        buildCommand: last.buildCommand,
        runCommand: last.runCommand,
        sourceHash: last.sourceHash,
        binarySize: last.binarySize,
        correct: sessions.every((s) => s.correct),
        sessions,
        agg,
        refSeconds: agg.score * referenceAnchorSeconds,
        refLow: agg.ciLow * referenceAnchorSeconds,
        refHigh: agg.ciHigh * referenceAnchorSeconds,
        memoryBytes: mem.length ? geoMean(mem) : 0,
        firstDate: sessions[0]!.date,
        lastDate: sessions[sessions.length - 1]!.date,
        cpuModels: [...new Set(sessions.map((s) => s.cpuModel))],
      });
    }
  }
  return { benchmarks, referenceAnchorSeconds, sessionCount, cpuModels: [...cpuSet], bootstraps };
}

/** Speed index of `b` relative to `ref` (ref = 1.0). >1 means slower than the reference. */
export function indexVs(
  analysis: Analysis,
  b: BenchmarkResult,
  ref: BenchmarkResult,
): { index: number; low: number; high: number } {
  const [low, high] = ratioCI(
    analysis.bootstraps.get(b.key) ?? [],
    analysis.bootstraps.get(ref.key) ?? [],
  );
  return { index: b.agg.score / ref.agg.score, low, high };
}
