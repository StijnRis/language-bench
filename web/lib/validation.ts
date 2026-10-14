import { geoMean } from "@lb/core";
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
  cpus: { model: string; sessions: number; factor: number; min: number; max: number }[];
  environments: { name: string; sessions: number }[];
  /** the single worst remaining deviation, to be honest about outliers */
  worst?: { key: string; percent: number };
}

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
    cpus: [...byCpu].map(([model, e]) => ({ model, sessions: e.sessions.size, factor: geoMean(e.factors), min: Math.min(...e.factors), max: Math.max(...e.factors) })).sort((a, b) => a.factor - b.factor),
    environments: [...envs].map(([name, sessions]) => ({ name, sessions })).sort((a, b) => b.sessions - a.sessions),
    worst,
  };
}
