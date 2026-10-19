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

export function resample<T>(xs: T[], rnd: () => number): T[] {
  return xs.map(() => xs[Math.floor(rnd() * xs.length)]!);
}

/* ------------------------------------------------------------------ */
/* Hardware correction without a calibration program                   */
/* ------------------------------------------------------------------ */

export interface Obs {
  bench: string;
  session: string;
  /** natural log of the session median of the benchmark */
  y: number;
  /** Software environment of the session (OS image); sessions with the same value share an effect. */
  env?: string;
  /** Kind of workload (e.g. the problem): the environment effect is estimated per group. */
  group?: string;
}

export interface HardwareFit {
  /** log machine factor per session (mean 0 inside each connected component) */
  h: Map<string, number>;
  /** log "typical machine" time per benchmark */
  mu: Map<string, number>;
  /** connected component id per session; sessions of different components are not comparable */
  component: Map<string, number>;
  /** log environment effect, keyed by {@link envKey}(env, group); 0 when only one environment exists */
  envEffect: Map<string, number>;
  /** residual standard deviation of the model (log units) */
  residualSd: number;
  componentSizes: Map<number, number>;
}

export const envKey = (env: string, group: string) => `${env}|${group}`;

/**
 * Additive model  log(time[b,s]) = mu[b] + h[s] + d[env(s), group(b)] + noise.
 * d is the effect of the software environment (e.g. an Ubuntu 24 vs Ubuntu 26 runner image) on a
 * kind of workload. All sessions with the same environment share it, so it is learned from every
 * one of them at once. It is shrunk towards 0 (ridge) and centred per group, so a general speed
 * shift of an environment is carried by the machine factors and only the workload-specific
 * deviation lands in d.
 * Base model  log(time[b,s]) = mu[b] + h[s] + noise.
 * Sessions run many benchmarks and share benchmarks with other sessions; a benchmark measured in
 * two sessions reveals the speed difference of the two machines. Fitted by alternating least
 * squares. Within each connected component of the (benchmark, session) graph the mean of h is 0,
 * i.e. times are expressed on the "average machine" of that component.
 */
export function fitHardware(obs: Obs[], iterations = 400, envShrinkage = 3): HardwareFit {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while ((parent.get(r) ?? r) !== r) r = parent.get(r)!;
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));
  for (const o of obs) union(`s:${o.session}`, `b:${o.bench}`);

  const compId = new Map<string, number>();
  const compOf = new Map<string, number>();
  for (const o of obs) {
    const root = find(`s:${o.session}`);
    if (!compId.has(root)) compId.set(root, compId.size);
    compOf.set(o.session, compId.get(root)!);
  }

  const bySession = new Map<string, Obs[]>();
  const byBench = new Map<string, Obs[]>();
  for (const o of obs) {
    (bySession.get(o.session) ?? bySession.set(o.session, []).get(o.session)!).push(o);
    (byBench.get(o.bench) ?? byBench.set(o.bench, []).get(o.bench)!).push(o);
  }
  const h = new Map<string, number>([...bySession.keys()].map((s) => [s, 0]));
  const mu = new Map<string, number>();
  const d = new Map<string, number>();
  const dOf = (o: Obs) => (o.env !== undefined && o.group !== undefined ? (d.get(envKey(o.env, o.group)) ?? 0) : 0);
  const byEnv = new Map<string, Obs[]>();
  for (const o of obs) if (o.env !== undefined && o.group !== undefined) (byEnv.get(envKey(o.env, o.group)) ?? byEnv.set(envKey(o.env, o.group), []).get(envKey(o.env, o.group))!).push(o);

  const updateMu = () => {
    for (const [b, os] of byBench) mu.set(b, mean(os.map((o) => o.y - h.get(o.session)! - dOf(o))));
  };
  const updateEnv = () => {
    for (const [k, os] of byEnv) d.set(k, os.reduce((a, o) => a + o.y - mu.get(o.bench)! - h.get(o.session)!, 0) / (os.length + envShrinkage));
    // centre per group (weighted by observations) so the environments' average effect stays in h
    const acc = new Map<string, { sum: number; n: number }>();
    for (const [k, os] of byEnv) {
      const g = os[0]!.group!;
      const e = acc.get(g) ?? acc.set(g, { sum: 0, n: 0 }).get(g)!;
      e.sum += d.get(k)! * os.length;
      e.n += os.length;
    }
    for (const [k, os] of byEnv) {
      const e = acc.get(os[0]!.group!)!;
      d.set(k, d.get(k)! - e.sum / e.n);
    }
  };
  updateMu();
  for (let it = 0; it < iterations; it++) {
    let delta = 0;
    for (const [s, os] of bySession) {
      const v = mean(os.map((o) => o.y - mu.get(o.bench)! - dOf(o)));
      delta = Math.max(delta, Math.abs(v - h.get(s)!));
      h.set(s, v);
    }
    // re-centre per component so the solution is unique
    const sums = new Map<number, { sum: number; n: number }>();
    for (const [s, v] of h) {
      const c = compOf.get(s)!;
      const e = sums.get(c) ?? sums.set(c, { sum: 0, n: 0 }).get(c)!;
      e.sum += v;
      e.n++;
    }
    for (const [s, v] of h) {
      const e = sums.get(compOf.get(s)!)!;
      h.set(s, v - e.sum / e.n);
    }
    updateMu();
    updateEnv();
    if (delta < 1e-12) break;
  }
  const res = obs.map((o) => o.y - mu.get(o.bench)! - h.get(o.session)! - dOf(o));
  const dof = Math.max(1, obs.length - byBench.size - bySession.size + compId.size);
  const residualSd = Math.sqrt(res.reduce((a, r) => a + r * r, 0) / dof);
  const componentSizes = new Map<number, number>();
  for (const c of compOf.values()) componentSizes.set(c, (componentSizes.get(c) ?? 0) + 1);
  return { h, mu, component: compOf, envEffect: d, residualSd, componentSizes };
}

export interface SessionSample {
  /** raw repetitions of the benchmark in this session (seconds) */
  reps: number[];
  /** natural log of this session's machine factor from {@link fitHardware} */
  logFactor: number;
}

export interface Aggregate {
  /** seconds on the average machine: exp(mean over sessions of log(median / machine factor)) */
  score: number;
  ciLow: number;
  ciHigh: number;
  sessions: number;
  /** geometric std-dev factor of the raw session medians (includes hardware differences) */
  rawSpread: number;
  /** geometric std-dev factor after dividing out the machine factors */
  adjustedSpread: number;
  bootstrap: number[];
}

/**
 * Cluster bootstrap: the independent unit is the SESSION. Each iteration resamples sessions with
 * replacement, then repetitions inside each, recomputes the hardware-corrected median and averages
 * in log space. (Machine factors are treated as known; with many overlapping benchmarks their
 * estimation error is small.)
 */
export function aggregateSessions(samples: SessionSample[], seed: string, iterations = 1000): Aggregate {
  const z = samples.map((s) => Math.log(median(s.reps)) - s.logFactor);
  const raw = samples.map((s) => Math.log(median(s.reps)));
  const score = Math.exp(mean(z));
  const rnd = mulberry32(hashSeed(seed));
  const boots: number[] = [];
  if (samples.length > 0) {
    // Same draws in the same order as resample() + median(), but into reused typed arrays instead of
    // a fresh array and a comparator sort per resample: this loop dominates the build time of the site.
    const n = samples.length;
    const bufs = samples.map((s) => new Float64Array(s.reps.length));
    const picked = new Array<number>(n);
    for (let i = 0; i < iterations; i++) {
      for (let k = 0; k < n; k++) picked[k] = Math.floor(rnd() * n);
      let sum = 0;
      for (let k = 0; k < n; k++) {
        const idx = picked[k]!;
        const reps = samples[idx]!.reps;
        const buf = bufs[idx]!;
        const len = buf.length;
        for (let j = 0; j < len; j++) buf[j] = reps[Math.floor(rnd() * len)]!;
        if (len > 48) buf.sort();
        else
          for (let a = 1; a < len; a++) {
            const v = buf[a]!;
            let c = a - 1;
            while (c >= 0 && buf[c]! > v) ((buf[c + 1] = buf[c]!), c--);
            buf[c + 1] = v;
          }
        const pos = (len - 1) * 0.5;
        const lo = Math.floor(pos);
        const hi = Math.ceil(pos);
        sum += Math.log(buf[lo]! + (buf[hi]! - buf[lo]!) * (pos - lo)) - samples[idx]!.logFactor;
      }
      boots.push(Math.exp(sum / n));
    }
  }
  return {
    score,
    ciLow: boots.length ? quantile(boots, 0.025) : score,
    ciHigh: boots.length ? quantile(boots, 0.975) : score,
    sessions: samples.length,
    rawSpread: Math.exp(stddev(raw)),
    adjustedSpread: Math.exp(stddev(z)),
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
