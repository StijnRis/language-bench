import {
  analyze,
  geoMean,
  indexVs,
  MIN_SESSIONS_FOR_FINAL,
  type Analysis,
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
  binarySize: number | null;
  sessions: number;
  provisional: boolean;
  correct: boolean;
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

/** Reference for the index: the fastest (correct) benchmark on this problem, so the best entry is 1.0×. */
export function reference(m: Model, problem: string): BenchmarkResult | undefined {
  const all = m.analysis.benchmarks.filter((b) => b.problem === problem);
  const pool = all.some((b) => b.correct) ? all.filter((b) => b.correct) : all;
  return pool.reduce<BenchmarkResult | undefined>((best, b) => (!best || b.agg.score < best.agg.score ? b : best), undefined);
}

const cellCache = new WeakMap<BenchmarkResult, Cell>();
const referenceCache = new Map<string, BenchmarkResult | undefined>();
let snapshot: Cell[] | undefined;

/** Memoised: every page (and the layout) asks for the same few hundred cells, and each needs a bootstrap interval. */
export function toCell(m: Model, b: BenchmarkResult, ref?: BenchmarkResult): Cell {
  const useCache = ref === undefined;
  const hit = useCache ? cellCache.get(b) : undefined;
  if (hit) return hit;
  const cell = computeCell(m, b, ref ?? cachedReference(m, b.problem));
  if (useCache) cellCache.set(b, cell);
  return cell;
}

function cachedReference(m: Model, problem: string) {
  if (!referenceCache.has(problem)) referenceCache.set(problem, reference(m, problem));
  return referenceCache.get(problem);
}

function computeCell(m: Model, b: BenchmarkResult, ref: BenchmarkResult | undefined): Cell {
  const idx = ref ? indexVs(m.analysis, b, ref) : { index: NaN, low: NaN, high: NaN };
  return {
    id: benchId(b),
    language: b.language,
    version: b.version,
    variant: b.variant,
    problem: b.problem,
    seconds: b.refSeconds,
    secondsLow: b.refLow,
    secondsHigh: b.refHigh,
    index: idx.index,
    indexLow: idx.low,
    indexHigh: idx.high,
    memoryMB: b.memoryBytes / 1e6,
    binarySize: b.binarySize ?? null,
    sessions: b.agg.sessions,
    provisional: b.agg.sessions < MIN_SESSIONS_FOR_FINAL,
    correct: b.correct,
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
