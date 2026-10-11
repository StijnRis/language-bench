import type { TSeries } from "@/components/Timeline";
import { benchId, defaultVariant, toCell, type Model } from "./model";
import type { LoadedLanguage } from "@lb/core/discover";

function points(m: Model, l: LoadedLanguage, variant: string, problem: string) {
  return l.spec.versions.flatMap((v) => {
    const b = m.byId.get(benchId({ language: l.spec.id, version: v.version, variant, problem }));
    const rel = l.releases[v.version];
    if (!b || !rel) return [];
    const c = toCell(m, b);
    return [{ date: rel.date, version: v.version, index: c.index, seconds: c.seconds, sessions: c.sessions, highlights: rel.highlights }];
  }).sort((a, b) => a.date.localeCompare(b.date));
}

/** One series per variant of one language (per-language timeline). */
export function languageSeries(m: Model, l: LoadedLanguage): TSeries[] {
  return l.spec.variants.flatMap((v) =>
    m.problems.filter((p) => p.spec.scored).map((p) => ({ id: `${l.spec.id}-${v.id}`, label: v.name, problem: p.spec.id, points: points(m, l, v.id, p.spec.id) })),
  );
}

/** One series per language (default variant) for the overview timeline. */
export function overviewSeries(m: Model): TSeries[] {
  return m.languages.flatMap((l) =>
    m.problems.filter((p) => p.spec.scored).map((p) => ({ id: l.spec.id, label: l.spec.name, problem: p.spec.id, points: points(m, l, defaultVariant(l), p.spec.id) })),
  );
}
