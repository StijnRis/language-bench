import {
  analyze,
  geoMean,
  indexVs,
  METRICS,
  MIN_SESSIONS_FOR_FINAL,
  type Analysis,
  type Metric,
  type Measurement,
  type Session,
  type BenchmarkResult,
} from "@lb/core";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import v8 from "node:v8";
import {
  dataDir,
  findRepoRoot,
  loadData,
  loadLanguages,
  loadProblems,
  readSource,
  type LoadedData,
  type LoadedLanguage,
  type LoadedProblem,
} from "@lb/core/discover";

export const RESOURCE_TAGS = ["cpu-bound", "memory-bound", "io-bound", "gc-heavy", "simd"];

export interface Cell {
  id: string;
  language: string;
  version: string;
  variant: string;
  problem: string;
  seconds: number;
  secondsLow: number;
  secondsHigh: number;
  index: number;
  indexLow: number;
  indexHigh: number;
  memoryMB: number;
  /** highest memory during the kernel loop of any session, MB (0 = not measured) */
  peakMB: number;
  binarySize: number | null;
  sessions: number;
  provisional: boolean;
  correct: boolean;
  /** the metric of seconds/index: warm kernel time when there is kernel data, else end-to-end */
  metric: Metric;
  /** seconds and index under every metric that has data (index: 1 = the fastest benchmark under that metric) */
  by: Partial<Record<Metric, { seconds: number; index: number; indexLow: number; indexHigh: number }>>;
  flags: string[];
}

export interface Model {
  root: string;
  languages: LoadedLanguage[];
  problems: LoadedProblem[];
  analysis: Analysis;
  sessions: Record<string, Session>;
  measurements: Measurement[];
  byId: Map<string, BenchmarkResult>;
  hasData: boolean;
}

export const benchId = (b: { language: string; version: string; variant: string; problem: string }) =>
  `${b.language}--${b.version}--${b.variant}--${b.problem}`;

/** URL path of a benchmark: problem first, then language--version--build. */
export const benchPath = (b: { language: string; version: string; variant: string; problem: string }) =>
  `/benchmarks/${b.problem}/${b.language}--${b.version}--${b.variant}/`;

export const sessionPath = (id: string) => `/sessions/${id}/`;

let cached: Model | undefined;

const ITERATIONS = 1000;

/**
 * The bootstrap statistics take tens of seconds, and `next build` evaluates this module in several
 * worker processes. The result is a pure function of the session files and the statistics code, so it
 * is computed once (see scripts/warm-cache.ts, run before `next build`) and shared through a file.
 */
function cachedAnalysis(root: string, data: LoadedData): Analysis {
  const hash = crypto.createHash("sha1").update(String(ITERATIONS));
  for (const f of ["stats.ts", "analysis.ts", "schema.ts"]) hash.update(fs.readFileSync(path.join(root, "core", "src", f)));
  const dir = path.join(dataDir(root), "sessions");
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).sort()) hash.update(f).update(fs.readFileSync(path.join(dir, f)));
  const file = path.join(root, "web", ".cache", `analysis-${hash.digest("hex").slice(0, 16)}.v8`);
  try {
    return v8.deserialize(fs.readFileSync(file)) as Analysis;
  } catch {
    const analysis = analyze(data.sessions, data.languages, ITERATIONS);
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      for (const old of fs.readdirSync(path.dirname(file))) if (old.startsWith("analysis-")) fs.rmSync(path.join(path.dirname(file), old), { force: true });
      const tmp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, v8.serialize(analysis));
      fs.renameSync(tmp, file);
    } catch {
      // the cache is an optimisation only
    }
    return analysis;
  }
}

export function getModel(): Model {
  if (cached) return cached;
  const root = findRepoRoot();
  const languages = loadLanguages(root);
  const problems = loadProblems(root);
  const data = loadData(root);
  const analysis = cachedAnalysis(root, data);
  const byId = new Map(analysis.benchmarks.map((b) => [benchId(b), b]));
  cached = { root, languages, problems, analysis, sessions: data.sessions, measurements: data.languages.flatMap((d) => d.measurements), byId, hasData: analysis.benchmarks.length > 0 };
  return cached;
}

/** Versions with data (or tracked), newest release first. */
export function versionsOf(m: Model, l: LoadedLanguage): string[] {
  const set = new Set([...l.spec.versions.map((v) => v.version), ...m.analysis.benchmarks.filter((b) => b.language === l.spec.id).map((b) => b.version)]);
  return [...set].sort((a, b) => (l.releases[b]?.date ?? "").localeCompare(l.releases[a]?.date ?? ""));
}

export const latestVersion = (l: LoadedLanguage) => l.spec.versions.find((v) => v.latest)!.version;
export const defaultVariant = (l: LoadedLanguage) => l.spec.variants.find((v) => v.default)!.id;

/** Reference for the index: the fastest (correct) benchmark on this problem under a metric, so the best entry is 1.0×. */
export function reference(m: Model, problem: string, metric: Metric = "warm"): BenchmarkResult | undefined {
  const all = m.analysis.benchmarks.filter((b) => b.problem === problem && b.byMetric[metric]);
  const pool = all.some((b) => b.correct) ? all.filter((b) => b.correct) : all;
  return pool.reduce<BenchmarkResult | undefined>((best, b) => (!best || b.byMetric[metric]!.score < best.byMetric[metric]!.score ? b : best), undefined);
}

const cellCache = new WeakMap<BenchmarkResult, Cell>();
const referenceCache = new Map<string, BenchmarkResult | undefined>();
let snapshot: Cell[] | undefined;

/** Memoised: every page (and the layout) asks for the same few hundred cells, and each needs a bootstrap interval. */
export function toCell(m: Model, b: BenchmarkResult): Cell {
  const hit = cellCache.get(b);
  if (hit) return hit;
  const cell = computeCell(m, b);
  cellCache.set(b, cell);
  return cell;
}

function cachedReference(m: Model, problem: string, metric: Metric) {
  const key = `${metric}|${problem}`;
  if (!referenceCache.has(key)) referenceCache.set(key, reference(m, problem, metric));
  return referenceCache.get(key);
}

function computeCell(m: Model, b: BenchmarkResult): Cell {
  const by: Cell["by"] = {};
  for (const metric of METRICS) {
    const agg = b.byMetric[metric];
    if (!agg) continue;
    const ref = cachedReference(m, b.problem, metric);
    const idx = ref ? indexVs(m.analysis, b, ref, metric) : { index: NaN, low: NaN, high: NaN };
    by[metric] = { seconds: agg.score, index: idx.index, indexLow: idx.low, indexHigh: idx.high };
  }
  const main = by[b.metric]!;
  return {
    id: benchId(b),
    language: b.language,
    version: b.version,
    variant: b.variant,
    problem: b.problem,
    seconds: b.refSeconds,
    secondsLow: b.refLow,
    secondsHigh: b.refHigh,
    index: main.index,
    indexLow: main.indexLow,
    indexHigh: main.indexHigh,
    memoryMB: b.memoryBytes / 1e6,
    peakMB: b.peakBytes / 1e6,
    binarySize: b.binarySize ?? null,
    sessions: b.agg.sessions,
    provisional: b.agg.sessions < MIN_SESSIONS_FOR_FINAL,
    correct: b.correct,
    metric: b.metric,
    by,
    flags: b.flags,
  };
}

/** Latest stable version, default variant, one cell per (language, problem). */
export function snapshotCells(m: Model): Cell[] {
  if (snapshot) return snapshot;
  const cells: Cell[] = [];
  for (const l of m.languages)
    for (const p of m.problems) {
      const b = m.byId.get(benchId({ language: l.spec.id, version: latestVersion(l), variant: defaultVariant(l), problem: p.spec.id }));
      if (b) cells.push(toCell(m, b));
    }
  snapshot = cells;
  return cells;
}

export const compositeIndex = (cells: Cell[]) => (cells.length ? geoMean(cells.map((c) => c.index)) : NaN);

export function allTags(m: Model): string[] {
  return [...new Set(m.problems.flatMap((p) => p.spec.tags))].sort();
}

export function sourceOf(m: Model, language: string, problem: string, version?: string): string | undefined {
  const l = m.languages.find((x) => x.spec.id === language);
  return l ? readSource(m.root, l.spec, problem, version) : undefined;
}

export const siteUrl = (process.env.SITE_URL || "https://stijnris.github.io/language-bench").replace(/\/$/, "");

export const repoUrl = "https://github.com/StijnRis/language-bench";

export function pairs(ids: string[]) {
  const s = [...ids].sort();
  return s.flatMap((a, i) => s.slice(i + 1).map((b) => `${a}-vs-${b}`));
}
