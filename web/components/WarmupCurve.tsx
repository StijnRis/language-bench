import { seconds } from "@/lib/fmt";

export interface CurveRow { label: string; curve: number[]; iterations: number }

/**
 * Kernel time of every iteration in order (thinned to at most 120 evenly spaced points), one line per session,
 * on a log axis: the first point is the cold iteration, the curve shows how long the runtime needs to warm up.
 */
export default function WarmupCurve({ rows }: { rows: CurveRow[] }) {
  const W = 820, H = 260, M = { l: 70, r: 20, t: 12, b: 34 };
  const all = rows.flatMap((r) => r.curve).filter((v) => v > 0);
  if (all.length === 0) return null;
  const lo = Math.log(Math.min(...all)), hi = Math.log(Math.max(...all));
  const span = hi - lo || 1;
  const a = lo - span * 0.08, b = hi + span * 0.08;
  const Y = (v: number) => M.t + (1 - (Math.log(Math.max(v, 1e-12)) - a) / (b - a)) * (H - M.t - M.b);
  const maxN = Math.max(...rows.map((r) => r.curve.length - 1), 1);
  const X = (i: number, n: number) => M.l + (i / Math.max(n - 1, 1)) * (W - M.l - M.r);
  const ticks = Array.from({ length: 5 }, (_, i) => Math.exp(a + ((b - a) / 4) * i));
  return (
    <div className="chartwrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 600 }} role="img" aria-label="Kernel time per iteration, in order">
        {ticks.map((t) => (<g key={t}><line x1={M.l} x2={W - M.r} y1={Y(t)} y2={Y(t)} stroke="var(--line)" /><text x={M.l - 8} y={Y(t) + 4} textAnchor="end">{seconds(t)}</text></g>))}
        <text x={M.l} y={H - 8}>iteration 1 (cold)</text>
        <text x={W - M.r} y={H - 8} textAnchor="end">last iteration{maxN > 0 ? "" : ""}</text>
        {rows.map((r, k) => (
          <g key={k} opacity={0.75}>
            <polyline fill="none" stroke="var(--accent)" strokeWidth={1.5} points={r.curve.map((v, i) => `${X(i, r.curve.length).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")}>
              <title>{r.label}: {r.iterations} iterations</title>
            </polyline>
            <circle cx={X(0, r.curve.length)} cy={Y(r.curve[0]!)} r={3.5} fill="var(--warn)"><title>{r.label}: cold iteration {seconds(r.curve[0]!)}</title></circle>
          </g>
        ))}
      </svg>
    </div>
  );
}
