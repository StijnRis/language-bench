"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { bytes, colorOf, idx, mb, seconds } from "@/lib/fmt";
import { LangIcon } from "./Icons";

export interface LCell {
  id: string; language: string; version: string; variant: string; problem: string;
  seconds: number; index: number; indexLow: number; indexHigh: number; memoryMB: number;
  binarySize: number | null; sessions: number; provisional: boolean;
}
interface Props {
  cells: LCell[];
  languages: { id: string; name: string; version: string }[];
  problems: { id: string; title: string; scored: boolean }[];
}
type Metric = "time" | "memory" | "overhead";

const gm = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);

export default function Leaderboard({ cells, languages, problems }: Props) {
  const [task, setTask] = useState("all");
  const [metric, setMetric] = useState<Metric>("time");

  const rows = useMemo(() => {
    const scored = problems.filter((p) => p.scored);
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
        value = gm(pick.map((c) => c.seconds));
        if (pick.length === 1) { low = pick[0]!.indexLow; high = pick[0]!.indexHigh; }
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
    const best = ranked[0]?.value ?? 1;
    return ranked.map((r) => ({ ...r, multiplier: r.value / best }));
  }, [cells, languages, problems, task, metric]);

  const max = Math.max(...rows.map((r) => r.multiplier), 1e-9);
  const fmt = (v: number) => (metric === "memory" ? mb(v) : seconds(v));
  const label = metric === "time"
    ? (task === "all" ? "Geometric mean time per task on an average machine, and how many times slower than the fastest language (lower is faster)" : "Time on an average machine, and how many times slower than the fastest language (lower is faster)")
    : metric === "memory" ? "Average memory (mean peak RSS per run), and how many times more than the leanest language (lower is better)"
    : "Start-up time, and how many times slower than the fastest to start (lower is better)";

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
      <div className="tablewrap">
        <table>
          <caption className="small muted" style={{ textAlign: "left", padding: "8px 12px" }}>{label}</caption>
          <thead><tr><th>#</th><th>Language</th><th className="num">Value (× vs best)</th><th style={{ minWidth: 160, width: "40%" }}></th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.l.id}>
                <td>{i + 1}</td>
                <td><div className="langrow"><Link href={`/languages/${r.l.id}/`} className="langcell"><LangIcon id={r.l.id} size={26} /><span>{r.l.name}</span></Link><span className="muted small">{r.l.version}</span>{r.provisional && <span className="badge warn">provisional</span>}</div></td>
                <td className="num" title={isFinite(r.low) && r.sessions > 0 ? `95% interval vs the fastest entry: ${idx(r.low)}–${idx(r.high)} (${r.sessions} sessions)` : r.sub || undefined}><strong>{fmt(r.value)}</strong> <span className="muted">({idx(r.multiplier)})</span></td>
                <td><div className="bar" style={{ width: `${Math.max(2, (r.multiplier / max) * 100)}%`, background: colorOf(r.l.id) }} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="empty">No measurements for this selection yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
