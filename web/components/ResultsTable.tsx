import type { ReactNode } from "react";
import { bytes, idx, mb, seconds } from "@/lib/fmt";

export interface ResultRow {
  id: string;
  label: ReactNode;
  seconds: number;
  memoryMB: number;
  binarySize: number | null;
  color: string;
  /** multiplier vs the fastest row; computed from `seconds` when omitted */
  timeMult?: number;
  /** tooltip for the time cell, e.g. the confidence interval */
  timeTitle?: string;
}

export type ResultMetric = "time" | "memory";

/**
 * One table for every "who is fastest" view: time, memory and binary size, each with its value
 * (and, for time and memory, how many times more than the best row). The bar shows the chosen metric.
 */
export default function ResultsTable({
  rows,
  nameHeader = "Language",
  metric = "time",
  caption,
  rank = false,
  empty = "No measurements for this selection yet.",
}: {
  rows: ResultRow[];
  nameHeader?: string;
  metric?: ResultMetric;
  caption?: string;
  rank?: boolean;
  empty?: string;
}) {
  const finite = (xs: number[]) => xs.filter((x) => isFinite(x) && x > 0);
  const bestTime = Math.min(...finite(rows.map((r) => r.seconds)));
  const bestMem = Math.min(...finite(rows.map((r) => r.memoryMB)));
  const view = rows.map((r) => ({
    r,
    tm: r.timeMult ?? r.seconds / bestTime,
    mm: r.memoryMB > 0 ? r.memoryMB / bestMem : NaN,
  }));
  const barOf = (v: (typeof view)[number]) => (metric === "time" ? v.tm : v.mm);
  const sorted = [...view].sort((a, b) => (isFinite(barOf(a)) ? barOf(a) : Infinity) - (isFinite(barOf(b)) ? barOf(b) : Infinity));
  const max = Math.max(...sorted.map(barOf).filter(isFinite), 1e-9);
  const cols = 5 + (rank ? 1 : 0);
  return (
    <div className="tablewrap">
      <table>
        {caption && <caption className="small muted" style={{ textAlign: "left", padding: "8px 12px" }}>{caption}</caption>}
        <thead>
          <tr>
            {rank && <th>#</th>}
            <th>{nameHeader}</th>
            <th className="num">Time <span className="muted">(× vs best)</span></th>
            <th className="num">Memory <span className="muted">(× vs best)</span></th>
            <th className="num">Binary size</th>
            <th style={{ minWidth: 140, width: "28%" }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((v, i) => (
            <tr key={v.r.id}>
              {rank && <td>{i + 1}</td>}
              <td>{v.r.label}</td>
              <td className="num" title={v.r.timeTitle}><strong>{seconds(v.r.seconds)}</strong> <span className="muted">({idx(v.tm)})</span></td>
              <td className="num">{v.r.memoryMB > 0 ? <><strong>{mb(v.r.memoryMB)}</strong> <span className="muted">({idx(v.mm)})</span></> : "-"}</td>
              <td className="num">{bytes(v.r.binarySize)}</td>
              <td>{isFinite(barOf(v)) && <div className="bar" style={{ width: `${Math.max(2, (barOf(v) / max) * 100)}%`, background: v.r.color }} />}</td>
            </tr>
          ))}
          {sorted.length === 0 && <tr><td colSpan={cols} className="empty">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
