import {
  analyze,
  geoMean,
  indexVs,
  MIN_SESSIONS_FOR_FINAL,
  type Analysis,
  type BenchmarkResult,
} from "@lb/core";
import {
  findRepoRoot,
  loadData,
  loadLanguages,
  loadProblems,
  readSource,
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
  byId: Map<string, BenchmarkResult>;
  hasData: boolean;
}

export const benchId = (b: { language: string; version: string; variant: string; problem: string }) =>
  `${b.language}--${b.version}--${b.variant}--${b.problem}`;

let cached: Model | undefined;

export function getModel(): Model {
  if (cached) return cached;
  const root = findRepoRoot();
  const languages = loadLanguages(root);
  const problems = loadProblems(root);
  const analysis = analyze(loadData(root), 1000);
  const byId = new Map(analysis.benchmarks.map((b) => [benchId(b), b]));
  cached = { root, languages, problems, analysis, byId, hasData: analysis.benchmarks.length > 0 };
  return cached;
}

export const latestVersion = (l: LoadedLanguage) => l.spec.versions.find((v) => v.latest)!.version;
export const defaultVariant = (l: LoadedLanguage) => l.spec.variants.find((v) => v.default)!.id;

/** Reference for "index vs C": newest C, default variant. */
export function reference(m: Model, problem: string): BenchmarkResult | undefined {
  const c = m.languages.find((l) => l.spec.id === "c");
  if (!c) return undefined;
  return m.byId.get(benchId({ language: "c", version: latestVersion(c), variant: defaultVariant(c), problem }));
}

export function toCell(m: Model, b: BenchmarkResult, ref = reference(m, b.problem)): Cell {
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
  const cells: Cell[] = [];
  for (const l of m.languages)
    for (const p of m.problems) {
      const b = m.byId.get(benchId({ language: l.spec.id, version: latestVersion(l), variant: defaultVariant(l), problem: p.spec.id }));
      if (b) cells.push(toCell(m, b));
    }
  return cells;
}

export const compositeIndex = (cells: Cell[]) => (cells.length ? geoMean(cells.map((c) => c.index)) : NaN);

export function allTags(m: Model): string[] {
  return [...new Set(m.problems.flatMap((p) => p.spec.tags))].sort();
}

export function sourceOf(m: Model, language: string, problem: string): string | undefined {
  const l = m.languages.find((x) => x.spec.id === language);
  return l ? readSource(m.root, l.spec, problem) : undefined;
}

export const siteUrl = (process.env.SITE_URL || "https://stijnris.github.io/language-bench").replace(/\/$/, "");

export const repoUrl = "https://github.com/StijnRis/language-bench";

export function pairs(ids: string[]) {
  const s = [...ids].sort();
  return s.flatMap((a, i) => s.slice(i + 1).map((b) => `${a}-vs-${b}`));
}
