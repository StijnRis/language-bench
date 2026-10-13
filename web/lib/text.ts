import { compositeIndex, getModel, snapshotCells, type Model } from "./model";

/** Everything on the site that names languages derives its text from here, i.e. from languages/<id>/language.json. */

export const joinNames = (names: string[]) =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export const languageList = (m: Model = getModel()) => joinNames(m.languages.map((l) => l.spec.name));
export const languageVs = (m: Model = getModel()) => m.languages.map((l) => l.spec.name).join(" vs ");

/** Languages with data, fastest first; value is the speed index relative to the fastest (1 = fastest). */
export function ranking(m: Model = getModel()) {
  const cells = snapshotCells(m);
  const scored = new Set(m.problems.filter((p) => p.spec.scored).map((p) => p.spec.id));
  const rows = m.languages
    .map((l) => ({ id: l.spec.id, name: l.spec.name, value: compositeIndex(cells.filter((c) => c.language === l.spec.id && scored.has(c.problem))) }))
    .filter((r) => isFinite(r.value))
    .sort((a, b) => a.value - b.value);
  const best = rows[0]?.value ?? 1;
  return rows.map((r) => ({ ...r, value: r.value / best }));
}

/** CSS custom properties --c-<id> for every language, for both colour schemes. */
export function languageCss(m: Model = getModel()): string {
  const fallback = (i: number, dark: boolean) => `hsl(${(i * 67 + 200) % 360} 55% ${dark ? 62 : 45}%)`;
  const vars = (dark: boolean) => m.languages.map((l, i) => `--c-${l.spec.id}:${l.spec.color?.[dark ? "dark" : "light"] ?? fallback(i, dark)};`).join("");
  return `:root{${vars(false)}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${vars(true)}}}:root[data-theme="dark"]{${vars(true)}}`;
}
