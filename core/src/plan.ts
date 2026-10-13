import { hashSeed, mulberry32 } from "./stats";
import type { Config } from "./schema";

/** Compares dotted numeric versions ("1.9" < "1.10"). */
export const cmpVersion = (a: string, b: string) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
};

export interface Candidate {
  key: string;
  language: string;
  version: string;
  variant: string;
  problem: string;
}

export interface Counts {
  /** sessions with a successful measurement */
  ok: number;
  /** failed attempts */
  failed: number;
}

export interface PlannedBenchmark extends Candidate {
  /** why the scheduler picked it */
  reason: "new" | "least-measured" | "overlap";
  /** successful sessions before this one */
  priorSessions: number;
}

export interface Plan {
  sessions: PlannedBenchmark[][];
  /** benchmarks still below the target (and still allowed to be attempted) */
  remaining: number;
  /** tracked benchmarks in total */
  total: number;
}

/**
 * How many parallel sessions (VMs) a round should use: enough that every benchmark that still
 * needs data gets a fresh slot in this round, within [minSessionsPerRound, maxSessionsPerRound].
 */
export function sessionsFor(remaining: number, cfg: Config): number {
  const overlap = Math.max(cfg.minOverlap, Math.round(cfg.overlapFraction * cfg.maxBenchmarksPerSession));
  const freshPerSession = Math.max(1, cfg.maxBenchmarksPerSession - overlap);
  return Math.min(cfg.maxSessionsPerRound, Math.max(cfg.minSessionsPerRound, Math.ceil(remaining / freshPerSession)));
}

export const isDone = (c: Counts | undefined, cfg: Config) =>
  (c?.ok ?? 0) >= cfg.targetSessionsPerBenchmark || (c?.failed ?? 0) >= cfg.maxAttempts;

/**
 * Chooses what the next sessions run.
 *  - Each session gets the benchmarks with the FEWEST successful runs that are not yet sufficient.
 *  - A benchmark is never chosen twice inside one session, and parallel sessions of the same round
 *    get disjoint "new" benchmarks.
 *  - A configurable share of every session re-runs already measured benchmarks (least measured
 *    first). Benchmarks that appear in several sessions are what lets the statistics separate
 *    machine speed from benchmark speed.
 */
export function planSessions(
  candidates: Candidate[],
  counts: Map<string, Counts>,
  cfg: Config,
  seed: string,
  sessionCount?: number,
): Plan {
  const rnd = mulberry32(hashSeed(seed));
  const virtual = new Map(candidates.map((c) => [c.key, counts.get(c.key)?.ok ?? 0]));
  const failed = (c: Candidate) => counts.get(c.key)?.failed ?? 0;
  const needy = (c: Candidate) =>
    (counts.get(c.key)?.ok ?? 0) < cfg.targetSessionsPerBenchmark && failed(c) < cfg.maxAttempts;
  const remaining = candidates.filter(needy).length;
  sessionCount ??= sessionsFor(remaining, cfg);
  const shuffle = <T>(xs: T[]) => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  };

  const used = new Set<string>(); // "new" picks are unique across the parallel sessions of a round
  const sessions: PlannedBenchmark[][] = [];
  for (let s = 0; s < sessionCount; s++) {
    const pool = shuffle(candidates.filter((c) => needy(c) && !used.has(c.key))).sort(
      (a, b) => virtual.get(a.key)! - virtual.get(b.key)!,
    );
    if (pool.length === 0) break;
    const measured = shuffle(candidates.filter((c) => virtual.get(c.key)! >= 1)).sort(
      (a, b) => virtual.get(a.key)! - virtual.get(b.key)!,
    );
    const N = cfg.maxBenchmarksPerSession;
    const wantOverlap = Math.max(cfg.minOverlap, Math.round(cfg.overlapFraction * N));
    const overlapCount = Math.min(wantOverlap, measured.length, Math.max(0, N - 1));
    const freshCount = Math.min(pool.length, N - overlapCount);

    const picks: PlannedBenchmark[] = [];
    const inSession = new Set<string>();
    for (const c of pool.slice(0, freshCount)) {
      picks.push({ ...c, reason: virtual.get(c.key)! === 0 ? "new" : "least-measured", priorSessions: virtual.get(c.key)! });
      inSession.add(c.key);
      used.add(c.key);
    }
    // overlap: measured benchmarks (fewest runs first) that are not already in this session
    let missing = overlapCount;
    for (const c of measured) {
      if (missing <= 0) break;
      if (inSession.has(c.key)) continue;
      picks.push({ ...c, reason: "overlap", priorSessions: virtual.get(c.key)! });
      inSession.add(c.key);
      missing--;
    }
    for (const p of picks) virtual.set(p.key, virtual.get(p.key)! + 1);
    sessions.push(picks);
  }
  return { sessions, remaining, total: candidates.length };
}
