/** Server-rendered scatter: load per core (x) against deviation from the benchmark mean in percent (y). */
export default function LoadScatter({ points }: { points: { x: number; y: number }[] }) {
  const W = 760, H = 260, M = { l: 44, r: 12, t: 12, b: 40 };
  const xMax = 2; // rarer, higher loads are drawn at the right edge
  const yMax = 30;
  const X = (v: number) => M.l + (Math.min(v, xMax) / xMax) * (W - M.l - M.r);
  const Y = (v: number) => M.t + ((yMax - Math.max(-yMax, Math.min(yMax, v))) / (2 * yMax)) * (H - M.t - M.b);
  const xt = Array.from({ length: 5 }, (_, i) => (xMax / 4) * i);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 520 }} role="img" aria-label={`Scatter plot of ${points.length} measurements: load per core against deviation from the benchmark mean`}>
      {[-30, -15, 0, 15, 30].map((v) => (
        <g key={v}><line x1={M.l} x2={W - M.r} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? "var(--muted)" : "var(--line)"} /><text x={M.l - 6} y={Y(v) + 4} textAnchor="end">{v > 0 ? "+" : ""}{v}%</text></g>
      ))}
      {xt.map((v) => <text key={v} x={X(v)} y={H - M.b + 16} textAnchor="middle">{v.toFixed(2)}</text>)}
      {points.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={2.4} fill="var(--accent)" opacity={0.35} />)}
      <text x={(W + M.l) / 2} y={H - 6} textAnchor="middle">load per core when the benchmark started (readings above 2 drawn at the edge)</text>
    </svg>
  );
}
