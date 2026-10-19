export function seconds(s: number): string {
  if (!isFinite(s)) return "-";
  if (s >= 100) return `${s.toFixed(0)} s`;
  if (s >= 1) return `${s.toFixed(2)} s`;
  if (s >= 0.001) return `${(s * 1000).toFixed(s >= 0.1 ? 0 : 1)} ms`;
  return `${(s * 1e6).toFixed(0)} µs`;
}
export const mb = (x: number) => (isFinite(x) ? `${x >= 100 ? x.toFixed(0) : x.toFixed(1)} MB` : "-");
export const idx = (x: number) => (isFinite(x) ? `${x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)}×` : "-");
export const bytes = (n?: number | null) => (n == null ? "-" : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${(n / 1e3).toFixed(0)} kB`);
export const day = (iso: string) => iso.slice(0, 10);
/** Language colours are CSS variables --c-<id> generated from languages/<id>/language.json (see layout). */
export const colorOf = (id: string, i = 0) => `var(--c-${id}, hsl(${(i * 67 + 200) % 360} 55% 50%))`;

/** Bar length (percent) on a log scale: 1x is a short stub, the largest multiple fills the cell. */
export const logBar = (x: number, max: number) => Math.max(2, ((Math.log(x) + 0.25) / (Math.log(Math.max(max, 1.01)) + 0.25)) * 100);
