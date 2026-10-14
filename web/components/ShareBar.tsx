"use client";
import { useState } from "react";

export interface CsvTable { filename: string; header: string[]; rows: (string | number | null)[][] }

const esc = (v: string | number | null) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (t: CsvTable) => [t.header, ...t.rows].map((r) => r.map(esc).join(",")).join("\n") + "\n";

/** "Copy link" (the current URL, which carries the view state) and an optional CSV download of what is on screen. */
export default function ShareBar({ csv }: { csv?: () => CsvTable }) {
  const [msg, setMsg] = useState("");
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); flash("Link copied"); }
    catch { flash("Copy failed: use the address bar"); }
  };
  const download = () => {
    const t = csv!();
    const url = URL.createObjectURL(new Blob([toCsv(t)], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: t.filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="sharebar">
      <button type="button" className="chip" onClick={copy}>Copy link to this view</button>
      {csv && <button type="button" className="chip" onClick={download}>Download CSV</button>}
      <span className="status" role="status" aria-live="polite">{msg}</span>
    </div>
  );
}
