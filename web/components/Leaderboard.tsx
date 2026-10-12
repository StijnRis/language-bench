"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { bytes, colorOf, idx, mb, seconds } from "@/lib/fmt";

export interface LCell {
  id: string; language: string; version: string; variant: string; problem: string;
  seconds: number; index: number; indexLow: number; indexHigh: number; memoryMB: number;
  binarySize: number | null; sessions: number; provisional: boolean;
}
interface Props {
  cells: LCell[];
  languages: { id: string; name: string; version: string }[];
  problems: { id: string; title: string; tags: string[]; scored: boolean }[];
  tags: string[];
}
type Metric = "time" | "memory" | "overhead";

const gm = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);

export default function Leaderboard({ cells, languages, problems, tags }: Props) {
  const [task, setTask] = useState("all");
  const [metric, setMetric] = useState<Metric>("time");
  const [sel, setSel] = useState<string[]>([]);

  const rows = useMemo(() => {
    const scored = problems.filter((p) => p.scored && (sel.length === 0 || sel.some((t) => p.tags.includes(t))));
    const out = languages.map((l) => {
      const mine = cells.filter((c) => c.language === l.id);
      const pick = task === "all" ? mine.filter((c) => scored.some((p) => p.id === c.problem)) : mine.filter((c) => c.problem === task);
      const startup = mine.find((c) => c.problem === "startup");
      let value = NaN, sub = "", sessions = 0, low = NaN, high = NaN, provisional = false;
      if (pick.length) {
        sessions = Math.min(...pick.map((c) => c.sessions));
        provisional = pick.some((c) => c.provisional);
      }
      if (metric === "time" && pick.length) {
        value = gm(pick.map((c) => c.index));
        if (pick.length === 1) { low = pick[0]!.indexLow; high = pick[0]!.indexHigh; sub = `${seconds(pick[0]!.seconds)} on the average machine`; }
        else sub = `geometric mean over ${pick.length} problems`;
      } else if (metric === "memory" && pick.length) {
        value = gm(pick.map((c) => c.memoryMB || 1));
        sub = pick.length === 1 ? "average memory" : `geometric mean over ${pick.length} problems`;
      } else if (metric === "overhead" && startup) {
        value = startup.seconds;
        sub = `binary size ${bytes(startup.binarySize)}`;
        sessions = startup.sessions; provisional = startup.provisional;
      }
      return { l, value, sub, low, high, sessions, provisional };
    });
    const ranked = out.filter((r) => isFinite(r.value)).sort((a, b) => a.value - b.value);
    // composite speed index: rescale so the best language is exactly 1.0x
    if (metric === "time" && task === "all" && ranked.length) { const best = ranked[0]!.value; for (const r of ranked) r.value /= best; }
    return ranked;
  }, [cells, languages, problems, task, metric, sel]);

  const max = Math.max(...rows.map((r) => r.value), 1e-9);
  const fmt = (v: number) => (metric === "time" ? idx(v) : metric === "memory" ? mb(v) : seconds(v));
  const label = metric === "time" ? "Speed index (fastest language = 1.0×, lower is faster)" : metric === "memory" ? "Average memory (mean peak RSS per run, lower is better)" : "Start-up time";

  return (
    <div>
      <div className="controls">
        <label>Task
          <select value={task} onChange={(e) => setTask(e.target.value)}>
            <option value="all">All tasks (composite)</option>
            {problems.filter((p) => p.scored || metric === "overhead").map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </label>
        <span role="group" aria-label="Metric">
          {([["time", "Wall-clock time"], ["memory", "Average memory"], ["overhead", "Start-up overhead"]] as const).map(([k, t]) => (
            <button key={k} className="chip" aria-pressed={metric === k} onClick={() => setMetric(k)} style={{ marginRight: 6 }}>{t}</button>
          ))}
        </span>
      </div>
      {task === "all" && metric !== "overhead" && (
        <div className="controls" role="group" aria-label="Filter by tag">
          <span className="small muted">Tags:</span>
          {tags.filter((t) => t !== "startup").map((t) => (
            <button key={t} className="chip" aria-pressed={sel.includes(t)} onClick={() => setSel(sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t])}>{t}</button>
          ))}
          {sel.length > 0 && <button className="chip" onClick={() => setSel([])}>clear</button>}
        </div>
      )}
      <div className="tablewrap">
        <table>
          <caption className="small muted" style={{ textAlign: "left", padding: "8px 12px" }}>{label}</caption>
          <thead><tr><th>#</th><th>Language</th><th className="num">Value</th><th style={{ minWidth: 160, width: "40%" }}></th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.l.id}>
                <td>{i + 1}</td>
                <td><span className="dot" style={{ background: colorOf(r.l.id) }} /><Link href={`/languages/${r.l.id}/`}>{r.l.name}</Link> <span className="muted small">{r.l.version}</span></td>
                <td className="num"><strong>{fmt(r.value)}</strong>{isFinite(r.low) && r.sessions > 0 && <span className="muted small"> ({idx(r.low)}–{idx(r.high)})</span>}</td>
                <td><div className="bar" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: colorOf(r.l.id) }} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="empty">No measurements for this selection yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {task === "all" && sel.length > 0 && (
        <p className="small muted">Composite over problems tagged {sel.map((t) => `“${t}”`).join(" or ")}: {problems.filter((p) => p.scored && sel.some((t) => p.tags.includes(t))).map((p) => p.title).join(", ")}.</p>
      )}
    </div>
  );
}
