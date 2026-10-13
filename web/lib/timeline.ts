import type { TPoint, TSeries } from "@/components/Timeline";
import { benchId, defaultVariant, toCell, versionsOf, type Model } from "./model";
import type { LoadedLanguage } from "@lb/core/discover";

export const ALL_PROBLEMS = "all";

const geo = (xs: number[]) => Math.exp(xs.reduce((s, x) => s + Math.log(x), 0) / xs.length);

function points(m: Model, l: LoadedLanguage, variant: string, problem: string): TPoint[] {
  return versionsOf(m, l).flatMap((version) => {
    const b = m.byId.get(benchId({ language: l.spec.id, version, variant, problem }));
    const rel = l.releases[version];
    if (!b || !rel) return [];
    const c = toCell(m, b);
    return [{ date: rel.date, version, seconds: c.seconds, memoryMB: c.memoryMB, binarySize: c.binarySize, sessions: c.sessions, highlights: rel.highlights }];
  }).sort((a, b) => a.date.localeCompare(b.date));
}

/** Geometric mean over all scored problems. Releases measured on fewer problems than the best-covered release are dropped, so the line never jumps because of missing data. */
function allPoints(m: Model, l: LoadedLanguage, variant: string): TPoint[] {
  const scored = m.problems.filter((p) => p.spec.scored).map((p) => points(m, l, variant, p.spec.id));
  const byVersion = new Map<string, TPoint[]>();
  for (const pts of scored) for (const p of pts) byVersion.set(p.version, [...(byVersion.get(p.version) ?? []), p]);
  const full = Math.max(0, ...[...byVersion.values()].map((v) => v.length));
  return [...byVersion.values()].filter((v) => v.length === full).map((v) => {
    const sizes = v.map((p) => p.binarySize).filter((x): x is number => x != null && x > 0);
    return {
      date: v[0]!.date, version: v[0]!.version, highlights: v[0]!.highlights,
      seconds: geo(v.map((p) => p.seconds)),
      memoryMB: geo(v.map((p) => p.memoryMB || 1)),
      binarySize: sizes.length === v.length ? geo(sizes) : null,
      sessions: Math.min(...v.map((p) => p.sessions)),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export const timelineProblems = (m: Model) => [
  { id: ALL_PROBLEMS, title: "All problems (geometric mean)" },
  ...m.problems.filter((p) => p.spec.scored).map((p) => ({ id: p.spec.id, title: p.spec.title })),
];

function seriesFor(m: Model, id: string, label: string, l: LoadedLanguage, variant: string): TSeries[] {
  return [
    { id, label, problem: ALL_PROBLEMS, points: allPoints(m, l, variant) },
    ...m.problems.filter((p) => p.spec.scored).map((p) => ({ id, label, problem: p.spec.id, points: points(m, l, variant, p.spec.id) })),
  ];
}

/** One series per variant of one language (per-language timeline). */
export function languageSeries(m: Model, l: LoadedLanguage): TSeries[] {
  return l.spec.variants.flatMap((v) => seriesFor(m, `${l.spec.id}-${v.id}`, v.name, l, v.id));
}

/** One series per language (default variant) for the overview timeline. */
export function overviewSeries(m: Model): TSeries[] {
  return m.languages.flatMap((l) => seriesFor(m, l.spec.id, l.spec.name, l, defaultVariant(l)));
}
