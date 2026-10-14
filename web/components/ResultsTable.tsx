"use client";
import { useState, type ReactNode } from "react";
import { bytes, idx, mb, seconds } from "@/lib/fmt";
import ShareBar from "./ShareBar";

export interface ResultRow {
  id: string;
  label: ReactNode;
  /** plain-text name for CSV export */
  name?: string;
  seconds: number;
  memoryMB: number;
  binarySize: number | null;
  color: string;
  /** multiplier vs the fastest row; computed from `seconds` when omitted */
  timeMult?: number;
  /** tooltip for the time cell, e.g. the confidence interval */
  timeTitle?: string;
}

export type ResultMetric = "time" | "memory" | "size";
export const METRICS: { id: ResultMetric; label: string }[] = [
  { id: "time", label: "Time" },
  { id: "memory", label: "Memory" },
  { id: "size", label: "Binary size" },
];

const fmt: Record<ResultMetric, (r: ResultRow) => string> = {
  time: (r) => seconds(r.seconds),
  memory: (r) => (r.memoryMB > 0 ? mb(r.memoryMB) : "-"),
  size: (r) => bytes(r.binarySize),
};
const raw: Record<ResultMetric, (r: ResultRow) => number> = {
  time: (r) => r.seconds,
  memory: (r) => r.memoryMB,
  size: (r) => r.binarySize ?? NaN,
};

/**
 * One table for every "who is best" view. One metric at a time (time, memory or binary size),
 * chosen above the table; each row shows the value and how many times more than the best row.
 */
export default function ResultsTable({
  rows,
  nameHeader = "Language",
  caption,
  rank = false,
  controls,
  empty = "No measurements for this selection yet.",
  metric: metricProp,
  onMetric,
  csvName,
}: {
  rows: ResultRow[];
  nameHeader?: string;
  caption?: string;
  rank?: boolean;
  /** extra controls shown left of the metric buttons */
  controls?: ReactNode;
  empty?: string;
  /** controlled metric (e.g. mirrored into the URL); uncontrolled when omitted */
  metric?: ResultMetric;
  onMetric?: (m: ResultMetric) => void;
  /** adds copy-link and CSV download under the table */
  csvName?: string;
}) {
  const [local, setLocal] = useState<ResultMetric>("time");
  const metric = metricProp ?? local;
  const setMetric = (m: ResultMetric) => (onMetric ? onMetric(m) : setLocal(m));
  const valid = (x: number) => isFinite(x) && x > 0;
  const best = Math.min(...rows.map((r) => raw[metric](r)).filter(valid));
  const view = rows
    .map((r) => {
      const v = raw[metric](r);
      const mult = metric === "time" && r.timeMult != null ? r.timeMult : valid(v) ? v / best : NaN;
      return { r, v, mult };
    })
    .sort((a, b) => (isFinite(a.mult) ? a.mult : Infinity) - (isFinite(b.mult) ? b.mult : Infinity));
  const max = Math.max(...view.map((x) => x.mult).filter(isFinite), 1e-9);
  const label = METRICS.find((t) => t.id === metric)!.label;
  const missing = metric === "size" ? "no binary (interpreted)" : "-";
  return (
    <div>
      <div className="controls">
        {controls}
        <span role="group" aria-label="Metric">
          {METRICS.map((t) => (
            <button key={t.id} className="chip" aria-pressed={metric === t.id} onClick={() => setMetric(t.id)} style={{ marginRight: 6 }}>{t.label}</button>
          ))}
        </span>
      </div>
      <div className="tablewrap">
        <table>
          {caption && <caption className="small muted" style={{ textAlign: "left", padding: "8px 12px" }}>{caption} Showing {label.toLowerCase()}.</caption>}
          <thead>
            <tr>
              {rank && <th>#</th>}
              <th>{nameHeader}</th>
              <th className="num">{label} <span className="muted">(× vs best)</span></th>
              <th style={{ minWidth: 140, width: "34%" }}></th>
            </tr>
          </thead>
          <tbody>
            {view.map((x, i) => (
              <tr key={x.r.id}>
                {rank && <td>{i + 1}</td>}
                <td>{x.r.label}</td>
                <td className="num" title={metric === "time" ? x.r.timeTitle : undefined}>
                  {isFinite(x.mult) ? <><strong>{fmt[metric](x.r)}</strong> <span className="muted">({idx(x.mult)})</span></> : <span className="muted small">{missing}</span>}
                </td>
                <td>{isFinite(x.mult) && <div className="bar" style={{ width: `${Math.max(2, (x.mult / max) * 100)}%`, background: x.r.color }} />}</td>
              </tr>
            ))}
            {view.length === 0 && <tr><td colSpan={rank ? 4 : 3} className="empty">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
      {csvName && (
        <ShareBar csv={() => ({
          filename: `${csvName}-${metric}.csv`,
          header: ["rank", "name", label.toLowerCase(), "multiplier_vs_best"],
          rows: view.map((x, i) => [i + 1, x.r.name ?? x.r.id, isFinite(x.v) ? +x.v.toPrecision(6) : null, isFinite(x.mult) ? +x.mult.toFixed(4) : null]),
        })} />
      )}
    </div>
  );
}
