/** Small, dependency-free statistics. Everything the site shows is computed with these functions. */

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function quantile(xs: number[], q: number): number {
  const s = [...xs].sort((a, b) => a - b);
  if (s.length === 0) return NaN;
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo]! + (s[hi]! - s[lo]!) * (pos - lo);
}

export const median = (xs: number[]) => quantile(xs, 0.5);

export function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

/** Median absolute deviation (unscaled). */
export function mad(xs: number[]): number {
  const m = median(xs);
  return median(xs.map((x) => Math.abs(x - m)));
}

export function geoMean(xs: number[]): number {
  return Math.exp(mean(xs.map(Math.log)));
}

/** Deterministic PRNG so the published numbers are reproducible bit-for-bit. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface RepSummary {
  n: number;
  mean: number;
  median: number;
  stddev: number;
  mad: number;
  min: number;
  max: number;
  /** Indices of repetitions further than 3 scaled MADs from the median (flagged, never removed). */
  outliers: number[];
}

export function summarizeReps(xs: number[]): RepSummary {
  const med = median(xs);
  const m = mad(xs);
  const scaled = 1.4826 * m;
  const outliers: number[] = [];
  if (scaled > 0) xs.forEach((x, i) => Math.abs(x - med) > 3 * scaled && outliers.push(i));
  return {
    n: xs.length,
    mean: mean(xs),
    median: med,
    stddev: stddev(xs),
    mad: m,
    min: Math.min(...xs),
    max: Math.max(...xs),
    outliers,
  };
}

export interface SessionSample {
  /** raw repetitions of the benchmark in this session */
  reps: number[];
  /** raw repetitions of the hardware anchor in this session (all anchor runs pooled) */
  anchorReps: number[];
}

export function resample<T>(xs: T[], rnd: () => number): T[] {
  return xs.map(() => xs[Math.floor(rnd() * xs.length)]!);
}

/** Anchor-normalised ratio of one session: median(benchmark) / median(anchor) */
export const sessionRatio = (s: SessionSample) => median(s.reps) / median(s.anchorReps);

export interface Aggregate {
  /** geometric mean over sessions of anchor-normalised ratios (dimensionless, "anchor units") */
  score: number;
  ciLow: number;
  ciHigh: number;
  sessions: number;
  /** geometric std-dev factor between the sessions' ratios (1 = identical) */
  betweenSpread: number;
  /** Share of the variance that is between sessions (0..1): "how much is hardware / day, not noise" */
  icc: number;
  bootstrap: number[];
}

/**
 * Cluster bootstrap: the independent unit is the SESSION (one VM, one moment).
 * Each iteration resamples sessions with replacement, then resamples repetitions inside each
 * (benchmark and anchor), recomputes the ratio, and takes the geometric mean.
 */
export function aggregateSessions(
  samples: SessionSample[],
  seed: string,
  iterations = 1000,
): Aggregate {
  const ratios = samples.map(sessionRatio);
  const score = geoMean(ratios);
  const rnd = mulberry32(hashSeed(seed));
  const boots: number[] = [];
  if (samples.length > 0) {
    for (let i = 0; i < iterations; i++) {
      const picked = resample(samples, rnd);
      const rs = picked.map(
        (s) => median(resample(s.reps, rnd)) / median(resample(s.anchorReps, rnd)),
      );
      boots.push(geoMean(rs));
    }
  }
  const logs = ratios.map(Math.log);
  const between = stddev(logs);
  // Variance of a session's log-ratio attributable to repetition noise: sampling variance of a
  // median (~ pi/2 * var/n) for the benchmark plus the same for the anchor it is divided by.
  const medVar = (xs: number[]) =>
    xs.length > 1 ? ((Math.PI / 2) * stddev(xs.map(Math.log)) ** 2) / xs.length : 0;
  const within = mean(samples.map((s) => medVar(s.reps) + medVar(s.anchorReps)));
  const betweenVar = Math.max(0, between ** 2 - within);
  const icc = betweenVar + within > 0 ? betweenVar / (betweenVar + within) : 0;
  return {
    score,
    ciLow: boots.length ? quantile(boots, 0.025) : score,
    ciHigh: boots.length ? quantile(boots, 0.975) : score,
    sessions: samples.length,
    betweenSpread: Math.exp(between),
    icc,
    bootstrap: boots,
  };
}

/** 95% interval for A/B of two independently bootstrapped aggregates (paired by iteration index). */
export function ratioCI(a: number[], b: number[]): [number, number] {
  const n = Math.min(a.length, b.length);
  if (n === 0) return [NaN, NaN];
  const r: number[] = [];
  for (let i = 0; i < n; i++) r.push(a[i]! / b[i]!);
  return [quantile(r, 0.025), quantile(r, 0.975)];
}
