"use client";
import Link from "next/link";
import { useState } from "react";
import { bytes, mb, seconds } from "@/lib/fmt";
import { METRICS, type ResultMetric } from "./ResultsTable";

export interface ReleaseCell { href: string; seconds: number; memoryMB: number; binarySize: number | null }
export interface ReleaseRow { version: string; date?: string; cells: (ReleaseCell | null)[] }

/** Releases x problems for one metric (time, memory or binary size). */
export default function ReleaseTable({ problems, rows }: { problems: { id: string; title: string }[]; rows: ReleaseRow[] }) {
  const [metric, setMetric] = useState<ResultMetric>("time");
  const show = (c: ReleaseCell) => (metric === "time" ? seconds(c.seconds) : metric === "memory" ? (c.memoryMB > 0 ? mb(c.memoryMB) : "-") : bytes(c.binarySize));
  return (
    <div>
      <div className="controls">
        <span role="group" aria-label="Metric">
          {METRICS.map((t) => <button key={t.id} className="chip" aria-pressed={metric === t.id} onClick={() => setMetric(t.id)} style={{ marginRight: 6 }}>{t.label}</button>)}
        </span>
      </div>
      <div className="tablewrap"><table>
        <thead><tr><th>Release</th>{problems.map((p) => <th key={p.id} className="num"><Link href={`/problems/${p.id}/`}>{p.title}</Link></th>)}</tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.version}><td><strong>{r.version}</strong> <span className="muted small">{r.date}</span></td>
            {r.cells.map((c, i) => <td key={problems[i]!.id} className="num">{c ? <Link href={c.href}>{show(c)}</Link> : "-"}</td>)}</tr>))}</tbody></table></div>
    </div>
  );
}
