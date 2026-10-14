"use client";
import { useMemo, useState } from "react";
import { bytes, colorOf, mb } from "@/lib/fmt";

export interface TPoint { date: string; version: string; seconds: number; memoryMB: number; binarySize: number | null; sessions: number; highlights: string[] }
export interface TSeries { id: string; label: string; color?: string; problem: string; points: TPoint[] }
interface Props { series: TSeries[]; problems: { id: string; title: string }[]; releases?: { date: string; version: string; highlights: string[]; id?: string }[]; note?: boolean }

type Metric = "time" | "memory" | "size";
const METRICS: { id: Metric; label: string }[] = [{ id: "time", label: "Time" }, { id: "memory", label: "Memory" }, { id: "size", label: "Binary size" }];

const ms = (s: number) => {
  const v = s * 1000;
  return `${v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString("en-US")} ms`;
};
const valueOf = (p: TPoint, m: Metric): number | null =>
  m === "time" ? p.seconds : m === "memory" ? (p.memoryMB > 0 ? p.memoryMB : null) : p.binarySize && p.binarySize > 0 ? p.binarySize : null;
const format = (v: number, m: Metric) => (m === "time" ? ms(v) : m === "memory" ? mb(v) : bytes(v));

const W = 900, H0 = 400, M = { l: 76, r: 170, t: 24, b: 56 };
/** vertical room of one end label: name line + value line */
const GAP = 30;
const clip = (t: string, n = 22) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

export default function Timeline({ series, problems, releases = [], note = true }: Props) {
  const [problem, setProblem] = useState(problems[0]?.id ?? "");
  const [metric, setMetric] = useState<Metric>("time");
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; p: TPoint; s: TSeries } | null>(null);

  // only points that have a value for the chosen metric (binary size does not exist for interpreters)
  const shown = useMemo(
    () => series.filter((s) => s.problem === problem).map((s) => ({ ...s, points: s.points.filter((p) => valueOf(p, metric) != null) })).filter((s) => s.points.length),
    [series, problem, metric],
  );
  const controls = (
    <div className="controls">
      <label>Problem
        <select value={problem} onChange={(e) => setProblem(e.target.value)}>{problems.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
      </label>
      <span role="group" aria-label="Metric">
        {METRICS.map((t) => <button key={t.id} className="chip" aria-pressed={metric === t.id} onClick={() => setMetric(t.id)} style={{ marginRight: 6 }}>{t.label}</button>)}
      </span>
    </div>
  );
  const pts = shown.flatMap((s) => s.points);
  if (!pts.length) return <div>{controls}<div className="empty card">No data for this selection yet.</div></div>;

  // taller chart when many lines end close together, so their labels never overlap
  const H = Math.max(H0, M.t + M.b + shown.length * GAP + 8);
  const xs = [...pts.map((p) => +new Date(p.date)), ...releases.map((r) => +new Date(r.date))];
  // pad the date range so points at either end stay inside the plot, even when only one release is measured
  const span = Math.max(Math.max(...xs) - Math.min(...xs), 90 * 864e5), pad = span * 0.04;
  const x0 = Math.min(...xs) - pad, x1 = Math.min(...xs) + span + pad;
  const measured = new Set(pts.map((p) => p.version));
  const unmeasured = releases.filter((r) => !measured.has(r.version));
  const y1 = Math.max(...pts.map((p) => valueOf(p, metric)!)) * 1.1, y0 = 0;
  const X = (t: number) => M.l + ((t - x0) / Math.max(1, x1 - x0)) * (W - M.l - M.r);
  const Y = (v: number) => H - M.b - ((v - y0) / (y1 - y0)) * (H - M.t - M.b);
  const yticks = Array.from({ length: 5 }, (_, i) => (y1 / 4) * i);
  const years = [...new Set(xs.map((t) => new Date(t).getUTCFullYear()))];
  const colorFor = (s: TSeries, i: number) => s.color ?? colorOf(s.id, i);

  // direct labels at the end of every line, pushed apart so they never overlap
  const ends = shown
    .map((s, i) => { const last = s.points[s.points.length - 1]!; return { s, i, y: Y(valueOf(last, metric)!), last }; })
    .sort((a, b) => a.y - b.y);
  const labelY: number[] = [];
  ends.forEach((e, k) => labelY.push(k === 0 ? e.y : Math.max(e.y, labelY[k - 1]! + GAP)));
  const bottom = H - M.b + 4;
  for (let k = labelY.length - 1; k >= 0; k--) labelY[k] = Math.min(labelY[k]!, bottom - (labelY.length - 1 - k) * GAP);
  const active = (id: string) => focus === null || focus === id;

  return (
    <div>
      {controls}
      <div className="chartwrap card" style={{ position: "relative", padding: 8 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${METRICS.find((t) => t.id === metric)!.label} per release over time`} style={{ minWidth: 640 }} onMouseLeave={() => setFocus(null)}>
          {yticks.map((v) => (<g key={v}><line x1={M.l} x2={W - M.r} y1={Y(v)} y2={Y(v)} stroke="var(--line)" /><text x={M.l - 8} y={Y(v) + 4} textAnchor="end">{format(v, metric)}</text></g>))}
          {years.map((y) => { const t = Date.UTC(y, 0, 1); return t >= x0 && t <= x1 ? (<g key={y}><line x1={X(t)} x2={X(t)} y1={M.t} y2={H - M.b} stroke="var(--line)" strokeDasharray="3 4" /><text x={X(t) + 3} y={H - M.b + 40}>{y}</text></g>) : null; })}
          {releases.map((r) => (<g key={r.id ?? r.version}>
            <line x1={X(+new Date(r.date))} x2={X(+new Date(r.date))} y1={H - M.b} y2={H - M.b + 6} stroke="var(--muted)" />
            {releases.length <= 16 && <text x={X(+new Date(r.date))} y={H - M.b + 18} textAnchor="middle" opacity={measured.has(r.version) ? 1 : 0.55}>{r.version}</text>}</g>))}
          {shown.map((s, si) => {
            const c = colorFor(s, si);
            const d = s.points.map((p, i) => `${i ? "L" : "M"}${X(+new Date(p.date))},${Y(valueOf(p, metric)!)}`).join(" ");
            return (<g key={s.id} opacity={active(s.id) ? 1 : 0.12} style={{ transition: "opacity .15s" }}>
              <path d={d} fill="none" stroke={c} strokeWidth={focus === s.id ? 3.5 : 2.2} strokeLinejoin="round" />
              <path d={d} fill="none" stroke="transparent" strokeWidth={14} onMouseEnter={() => setFocus(s.id)} style={{ cursor: "pointer" }} />
              {s.points.map((p) => {
                const px = X(+new Date(p.date)), py = Y(valueOf(p, metric)!);
                return <circle key={p.version} cx={px} cy={py} r={focus === s.id ? 6 : 4.5} fill={c} stroke="var(--card)" strokeWidth={1.5} tabIndex={0}
                  onMouseEnter={() => { setFocus(s.id); setHover({ x: px, y: py, p, s }); }} onFocus={() => { setFocus(s.id); setHover({ x: px, y: py, p, s }); }}
                  onMouseLeave={() => setHover(null)} onBlur={() => { setHover(null); setFocus(null); }} />;
              })}</g>);
          })}
          {ends.map((e, k) => {
            const c = colorFor(e.s, e.i), ex = X(+new Date(e.last.date));
            return (<g key={e.s.id} opacity={active(e.s.id) ? 1 : 0.2} style={{ cursor: "pointer", transition: "opacity .15s" }} onMouseEnter={() => setFocus(e.s.id)}>
              <line x1={ex + 6} y1={e.y} x2={W - M.r + 8} y2={labelY[k]! - 1} stroke={c} strokeWidth={1} opacity={0.6} />
              <text x={W - M.r + 12} y={labelY[k]! + 2} style={{ fill: c, fontWeight: 700 }}><title>{e.s.label}</title>{clip(e.s.label)}</text>
              <text x={W - M.r + 12} y={labelY[k]! + 14} style={{ fill: "var(--muted)", fontSize: 11 }}>{format(valueOf(e.last, metric)!, metric)}</text>
            </g>);
          })}
        </svg>
        {hover && (
          <div className="tip" style={{ left: `calc(${(hover.x / W) * 100}% + 8px)`, top: `${(hover.y / H) * 100}%` }}>
            <strong>{hover.s.label} {hover.p.version}</strong><br />
            <span className="muted">released {hover.p.date}</span><br />
            {format(valueOf(hover.p, metric)!, metric)} · {hover.p.sessions} sessions
            {hover.p.highlights.length > 0 && <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{hover.p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>}
          </div>
        )}
      </div>
      {shown.length > 1 && (
        <p className="small" role="group" aria-label="Highlight a line">
          {shown.map((s, i) => (
            <button key={s.id} className="chip" aria-pressed={focus === s.id} onMouseEnter={() => setFocus(s.id)} onFocus={() => setFocus(s.id)} onClick={() => setFocus(focus === s.id ? null : s.id)} style={{ marginRight: 6, marginBottom: 6 }}>
              <span className="dot" style={{ background: colorFor(s, i) }} />{s.label}
            </button>
          ))}
        </p>
      )}
      {note && unmeasured.length > 0 && <p className="small muted">{unmeasured.length} tracked release{unmeasured.length === 1 ? " has" : "s have"} not been measured for this problem yet ({unmeasured.map((r) => r.version).join(", ")}, shown faded on the axis). Lines appear as soon as a second release has data.</p>}
      <p className="small muted">Each point is one language release on its official release date, measured on an average machine. Hover a line, its label or a legend button to highlight it; hover a point for release highlights.
        {problem === "all" && " “All problems” is the geometric mean over every scored problem; releases not yet measured on all of them are left out."}
        {metric === "size" && " Interpreted languages have no binary and do not appear."}</p>
    </div>
  );
}
