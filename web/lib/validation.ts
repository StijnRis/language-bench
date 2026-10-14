import { geoMean } from "@lb/core";
import { parseLoad, sessionLoad } from "./load";
import type { Model } from "./model";

export interface Validation {
  /** benchmarks measured in 2+ sessions, and the number of session observations they contribute */
  benchmarks: number;
  observations: number;
  /** residual spread (geometric factor, e.g. 1.05 = +-5%) across sessions of the same benchmark, before and after correction */
  rawSpread: number;
  correctedSpread: number;
  /** share of the cross-session variance that the machine/OS correction explains */
  explained: number;
  /** histogram of deviations from the benchmark mean, in percent, before and after correction */
  bins: { lo: number; hi: number; raw: number; corrected: number }[];
  cpus: { model: string; sessions: number; factor: number; min: number; max: number; load?: number }[];
  load: LoadAnalysis;
  environments: { name: string; sessions: number }[];
  /** the single worst remaining deviation, to be honest about outliers */
  worst?: { key: string; percent: number };
}

export interface LoadAnalysis {
  /** measurements (of multi-session benchmarks) that have a load reading */
  n: number;
  /** Pearson correlation between load per core and the corrected deviation (log scale) */
  correlation: number;
  /** corrected spread over measurements taken at low load only vs all, as geometric factors */
  spreadLow: number;
  spreadAll: number;
  threshold: number;
  buckets: { label: string; lo: number; hi: number; n: number; rms: number; mean: number }[];
  /** scatter: load per core (x) vs deviation in percent (y) */
  points: { x: number; y: number }[];
}

const LOAD_EDGES = [0, 0.25, 0.5, 1, 1.5, Infinity];

/**
 * How well does the machine correction work? For every benchmark that was measured in several sessions
 * (on different VMs) compare how much its session results differ from each other before and after
 * dividing out the fitted machine and OS factors. If the model is right the corrected spread is much smaller.
 */
export function validate(m: Model): Validation {
  const raw: number[] = [];
  const cor: number[] = [];
  let benchmarks = 0;
  let dfRaw = 0;
  let worst: Validation["worst"];
  for (const b of m.analysis.benchmarks) {
    if (b.sessions.length < 2) continue;
    benchmarks++;
    const lr = b.sessions.map((s) => Math.log(s.summary.median));
    const lc = b.sessions.map((s) => Math.log(s.adjustedMedian));
    const mr = lr.reduce((a, x) => a + x, 0) / lr.length;
    const mc = lc.reduce((a, x) => a + x, 0) / lc.length;
    lr.forEach((x) => raw.push(x - mr));
    lc.forEach((x, i) => {
      cor.push(x - mc);
      const pct = (Math.exp(Math.abs(x - mc)) - 1) * 100;
      if (!worst || pct > worst.percent) worst = { key: b.key, percent: pct };
    });
    dfRaw += b.sessions.length - 1;
  }
  const ss = (xs: number[]) => xs.reduce((a, x) => a + x * x, 0);
  const sd = (xs: number[]) => (dfRaw > 0 ? Math.sqrt(ss(xs) / dfRaw) : 0);
  const rawSd = sd(raw), corSd = sd(cor);

  const edges = [-30, -20, -15, -10, -7, -5, -3, -1.5, 0, 1.5, 3, 5, 7, 10, 15, 20, 30];
  const bins = edges.slice(0, -1).map((lo, i) => ({ lo, hi: edges[i + 1]!, raw: 0, corrected: 0 }));
  const place = (xs: number[], key: "raw" | "corrected") =>
    xs.forEach((x) => {
      const pct = (Math.exp(x) - 1) * 100;
      const bin = bins.find((b) => pct >= b.lo && pct < b.hi) ?? (pct < 0 ? bins[0]! : bins[bins.length - 1]!);
      bin[key]++;
    });
  place(raw, "raw");
  place(cor, "corrected");

  // load: the 1-minute load average read just before each benchmark, per core
  const loadOf = new Map<string, number>();
  for (const x of m.measurements) {
    const v = parseLoad(x.loadAvgBefore);
    if (v !== undefined) loadOf.set(`${x.sessionId}|${x.language}|${x.version}|${x.variant}|${x.problem}`, v);
  }
  const lp: { load: number; dev: number }[] = [];
  for (const b of m.analysis.benchmarks) {
    if (b.sessions.length < 2) continue;
    const lc = b.sessions.map((s) => Math.log(s.adjustedMedian));
    const mc = lc.reduce((a, x) => a + x, 0) / lc.length;
    b.sessions.forEach((s, i) => {
      const v = loadOf.get(`${s.sessionId}|${b.key}`);
      if (v !== undefined && s.cores > 0) lp.push({ load: v / s.cores, dev: lc[i]! - mc });
    });
  }
  const rms = (xs: number[]) => (xs.length ? Math.sqrt(xs.reduce((a, x) => a + x * x, 0) / xs.length) : 0);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);
  const mx = avg(lp.map((p) => p.load)), my = avg(lp.map((p) => p.dev));
  const sxy = lp.reduce((a, p) => a + (p.load - mx) * (p.dev - my), 0);
  const sxx = lp.reduce((a, p) => a + (p.load - mx) ** 2, 0), syy = lp.reduce((a, p) => a + (p.dev - my) ** 2, 0);
  const threshold = 1;
  const load: LoadAnalysis = {
    n: lp.length,
    correlation: sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0,
    spreadAll: Math.exp(rms(lp.map((p) => p.dev))),
    spreadLow: Math.exp(rms(lp.filter((p) => p.load < threshold).map((p) => p.dev))),
    threshold,
    buckets: LOAD_EDGES.slice(0, -1).map((lo, i) => {
      const hi = LOAD_EDGES[i + 1]!;
      const xs = lp.filter((p) => p.load >= lo && p.load < hi).map((p) => p.dev);
      return { label: hi === Infinity ? `≥ ${lo}` : `${lo} – ${hi}`, lo, hi, n: xs.length, rms: (Math.exp(rms(xs)) - 1) * 100, mean: (Math.exp(avg(xs)) - 1) * 100 };
    }),
    points: lp.map((p) => ({ x: p.load, y: (Math.exp(p.dev) - 1) * 100 })),
  };

  const byCpu = new Map<string, { sessions: Set<string>; factors: number[] }>();
  const sessionInfo = new Map<string, { cpu: string; env: string }>();
  for (const b of m.analysis.benchmarks) for (const s of b.sessions) sessionInfo.set(s.sessionId, { cpu: s.cpuModel, env: s.environment });
  for (const [id, f] of m.analysis.machineFactors) {
    const cpu = sessionInfo.get(id)?.cpu ?? "unknown";
    const e = byCpu.get(cpu) ?? { sessions: new Set<string>(), factors: [] };
    e.sessions.add(id);
    e.factors.push(f);
    byCpu.set(cpu, e);
  }
  const envs = new Map<string, number>();
  for (const { env } of sessionInfo.values()) envs.set(env, (envs.get(env) ?? 0) + 1);

  return {
    benchmarks,
    observations: raw.length,
    rawSpread: Math.exp(rawSd),
    correctedSpread: Math.exp(corSd),
    explained: rawSd > 0 ? Math.max(0, 1 - (corSd * corSd) / (rawSd * rawSd)) : 0,
    bins,
    cpus: [...byCpu].map(([model, e]) => {
      const loads = [...e.sessions].map((id) => sessionLoad(m.measurements.filter((x) => x.sessionId === id), m.sessions[id]?.host.cpu.cores ?? 0)).filter((x): x is number => x !== undefined);
      return { model, sessions: e.sessions.size, factor: geoMean(e.factors), min: Math.min(...e.factors), max: Math.max(...e.factors), load: loads.length ? avg(loads) : undefined };
    }).sort((a, b) => a.factor - b.factor),
    environments: [...envs].map(([name, sessions]) => ({ name, sessions })).sort((a, b) => b.sessions - a.sessions),
    load,
    worst,
  };
}
