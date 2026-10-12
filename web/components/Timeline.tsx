"use client";
import { useMemo, useState } from "react";
import { colorOf, idx, seconds } from "@/lib/fmt";

export interface TPoint { date: string; version: string; index: number; seconds: number; sessions: number; highlights: string[] }
export interface TSeries { id: string; label: string; color?: string; problem: string; points: TPoint[] }
interface Props { series: TSeries[]; problems: { id: string; title: string }[]; releases?: { date: string; version: string; highlights: string[] }[] }

const W = 860, H = 380, M = { l: 64, r: 20, t: 16, b: 40 };

export default function Timeline({ series, problems, releases = [] }: Props) {
  const [problem, setProblem] = useState(problems[0]?.id ?? "");
  const [metric, setMetric] = useState<"index" | "seconds">("index");
  const [hover, setHover] = useState<{ x: number; y: number; p: TPoint; s: TSeries } | null>(null);

  const shown = useMemo(() => series.filter((s) => s.problem === problem && s.points.length), [series, problem]);
  const pts = shown.flatMap((s) => s.points);
  if (!pts.length) return <div className="empty card">No data for this problem yet.</div>;

  const xs = [...pts.map((p) => +new Date(p.date)), ...releases.map((r) => +new Date(r.date))];
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const ys = pts.map((p) => p[metric]);
  const y1 = Math.max(...ys) * 1.1, y0 = 0;
  const X = (t: number) => M.l + ((t - x0) / Math.max(1, x1 - x0)) * (W - M.l - M.r);
  const Y = (v: number) => H - M.b - ((v - y0) / (y1 - y0)) * (H - M.t - M.b);
  const fmt = (v: number) => (metric === "index" ? idx(v) : seconds(v));
  const yticks = Array.from({ length: 5 }, (_, i) => (y1 / 4) * i);
  const years = [...new Set(xs.map((t) => new Date(t).getUTCFullYear()))];

  return (
    <div>
      <div className="controls">
        <label>Problem
          <select value={problem} onChange={(e) => setProblem(e.target.value)}>{problems.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        </label>
        <span>
          <button className="chip" aria-pressed={metric === "index"} onClick={() => setMetric("index")} style={{ marginRight: 6 }}>Relative to fastest</button>
          <button className="chip" aria-pressed={metric === "seconds"} onClick={() => setMetric("seconds")}>Seconds (average machine)</button>
        </span>
      </div>
      <div className="chartwrap card" style={{ position: "relative", padding: 8 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Execution ${metric === "index" ? "index relative to the fastest" : "time"} per release over time`} style={{ minWidth: 560 }}>
          {yticks.map((v) => (<g key={v}><line x1={M.l} x2={W - M.r} y1={Y(v)} y2={Y(v)} stroke="var(--line)" /><text x={M.l - 8} y={Y(v) + 4} textAnchor="end">{fmt(v)}</text></g>))}
          {years.map((y) => { const t = Date.UTC(y, 0, 1); return t >= x0 && t <= x1 ? (<g key={y}><line x1={X(t)} x2={X(t)} y1={M.t} y2={H - M.b} stroke="var(--line)" strokeDasharray="3 4" /><text x={X(t) + 3} y={H - M.b + 16}>{y}</text></g>) : null; })}
          {releases.map((r) => (<line key={r.version} x1={X(+new Date(r.date))} x2={X(+new Date(r.date))} y1={H - M.b} y2={H - M.b + 6} stroke="var(--muted)" />))}
          {shown.map((s, si) => {
            const c = s.color ?? colorOf(s.id, si);
            const d = s.points.map((p, i) => `${i ? "L" : "M"}${X(+new Date(p.date))},${Y(p[metric])}`).join(" ");
            return (<g key={s.id}><path d={d} fill="none" stroke={c} strokeWidth={2} />
              {s.points.map((p) => (<g key={p.version}>
                <circle cx={X(+new Date(p.date))} cy={Y(p[metric])} r={5} fill={c} stroke="var(--card)" strokeWidth={1.5} tabIndex={0}
                  onMouseEnter={() => setHover({ x: X(+new Date(p.date)), y: Y(p[metric]), p, s })} onFocus={() => setHover({ x: X(+new Date(p.date)), y: Y(p[metric]), p, s })}
                  onMouseLeave={() => setHover(null)} onBlur={() => setHover(null)} />
                <text x={X(+new Date(p.date))} y={Y(p[metric]) - 9} textAnchor="middle">{p.version}</text></g>))}</g>);
          })}
        </svg>
        {hover && (
          <div className="tip" style={{ left: `calc(${(hover.x / W) * 100}% + 8px)`, top: `${(hover.y / H) * 100}%` }}>
            <strong>{hover.s.label} {hover.p.version}</strong><br />
            <span className="muted">released {hover.p.date}</span><br />
            {fmt(hover.p[metric])} · {hover.p.sessions} sessions
            {hover.p.highlights.length > 0 && <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{hover.p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>}
          </div>
        )}
      </div>
      <p className="small muted">Each point is one language release, placed on its official release date. Markers on the axis are releases; hover or focus a point for release highlights.
        {shown.length > 1 && <> Lines: {shown.map((s, i) => <span key={s.id}><span className="dot" style={{ background: s.color ?? colorOf(s.id, i), marginLeft: 8 }} />{s.label}</span>)}</>}</p>
    </div>
  );
}
