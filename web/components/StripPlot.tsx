import { seconds } from "@/lib/fmt";

export interface StripRow { label: string; sub: string; reps: number[]; median: number; outliers: number[] }

/** Every raw repetition of every session as a dot (server-rendered SVG, no JS). */
export default function StripPlot({ rows }: { rows: StripRow[] }) {
  const W = 820, rowH = 30, M = { l: 230, r: 20, t: 8, b: 28 };
  const all = rows.flatMap((r) => r.reps);
  const lo = Math.min(...all), hi = Math.max(...all);
  const pad = (hi - lo) * 0.05 || hi * 0.05 || 1e-6;
  const a = lo - pad, b = hi + pad;
  const X = (v: number) => M.l + ((v - a) / (b - a)) * (W - M.l - M.r);
  const H = M.t + rows.length * rowH + M.b;
  const ticks = Array.from({ length: 5 }, (_, i) => a + ((b - a) / 4) * i);
  return (
    <div className="chartwrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 600 }} role="img" aria-label="Every repetition of every session">
        {ticks.map((t) => (<g key={t}><line x1={X(t)} x2={X(t)} y1={M.t} y2={H - M.b} stroke="var(--line)" /><text x={X(t)} y={H - 10} textAnchor="middle">{seconds(t)}</text></g>))}
        {rows.map((r, i) => {
          const y = M.t + i * rowH + rowH / 2;
          return (<g key={i}>
            <text x={M.l - 10} y={y - 2} textAnchor="end" style={{ fill: "var(--fg)" }}>{r.label}</text>
            <text x={M.l - 10} y={y + 10} textAnchor="end">{r.sub}</text>
            {r.reps.map((v, k) => (<circle key={k} cx={X(v)} cy={y + ((k * 7) % 9) - 4} r={2.6} fill={r.outliers.includes(k) ? "var(--warn)" : "var(--accent)"} opacity={0.65} />))}
            <line x1={X(r.median)} x2={X(r.median)} y1={y - 12} y2={y + 12} stroke="var(--fg)" strokeWidth={2} />
          </g>);
        })}
      </svg>
    </div>
  );
}
