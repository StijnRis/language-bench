"use client";
import Link from "next/link";
import { useMemo } from "react";
import { colorOf } from "@/lib/fmt";
import { useUrlState } from "@/lib/useUrlState";
import { LangIcon } from "./Icons";
import ShareBar from "./ShareBar";

type Cell = { language: string; problem: string; idx: { warm: number | null; cold: number | null; e2e: number | null }; memoryMB: number };
type Problem = { id: string; title: string; tags: string[] };
interface Props {
  cells: Cell[];
  languages: { id: string; name: string; version: string }[];
  problems: Problem[];
}

const MAX = 5;
const gm = (xs: number[], w: number[]) => Math.exp(xs.reduce((a, x, i) => a + w[i]! * Math.log(x), 0) / w.reduce((a, b) => a + b, 0));

/** weights are encoded as "id:w,id:w" (only non-default entries); memory importance as 0..100 */
function parseWeights(raw: string, problems: Problem[]) {
  const w: Record<string, number> = Object.fromEntries(problems.map((p) => [p.id, 1]));
  for (const part of raw.split(",")) {
    const [id, v] = part.split(":");
    if (id && id in w && v != null && isFinite(+v)) w[id] = Math.max(0, Math.min(MAX, Math.round(+v)));
  }
  return w;
}
const encodeWeights = (w: Record<string, number>) => Object.entries(w).filter(([, v]) => v !== 1).map(([k, v]) => `${k}:${v}`).join(",");

export default function Picker({ cells, languages, problems }: Props) {
  const [raw, setRaw] = useUrlState("w", "");
  const [memRaw, setMem] = useUrlState("mem", "0");
  const [basisRaw, setBasis] = useUrlState("basis", "warm");
  const basis = basisRaw === "cold" || basisRaw === "e2e" ? basisRaw : "warm";
  const speedOf = (c: Cell) => c.idx[basis];
  const w = useMemo(() => parseWeights(raw, problems), [raw, problems]);
  const mem = Math.max(0, Math.min(100, Math.round(+memRaw || 0))) / 100;
  const setW = (next: Record<string, number>) => setRaw(encodeWeights(next));

  const presets = [
    { label: "Everything equal", set: {} as Record<string, number> },
    ...[...new Set(problems.flatMap((p) => p.tags))].sort().map((t) => ({
      label: t, set: Object.fromEntries(problems.map((p) => [p.id, p.tags.includes(t) ? 3 : 0])),
    })),
  ];

  const minMem = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of cells) if (c.memoryMB > 0) out[c.problem] = Math.min(out[c.problem] ?? Infinity, c.memoryMB);
    return out;
  }, [cells]);

  const rows = useMemo(() => {
    // a task nobody has data for yet cannot be ranked, so it neither counts nor makes languages "partial"
    const measured = new Set(cells.map((c) => c.problem));
    const active = problems.filter((p) => w[p.id]! > 0 && measured.has(p.id));
    const list = languages.flatMap((l) => {
      const mine = active.flatMap((p) => {
        const c = cells.find((x) => x.language === l.id && x.problem === p.id);
        return c && speedOf(c) != null ? [{ p, c }] : [];
      });
      if (!mine.length) return [];
      const weights = mine.map((x) => w[x.p.id]!);
      const time = gm(mine.map((x) => speedOf(x.c)!), weights);
      const memory = gm(mine.map((x) => (x.c.memoryMB > 0 ? x.c.memoryMB / minMem[x.p.id]! : 1)), weights);
      return [{ l, time, memory, score: Math.pow(time, 1 - mem) * Math.pow(memory, mem), covered: mine.length, total: active.length }];
    });
    list.sort((a, b) => a.score - b.score);
    const best = list[0]?.score ?? 1;
    return list.map((r) => ({ ...r, mult: r.score / best }));
  }, [cells, languages, problems, w, mem, minMem, basis]);
  const max = Math.max(...rows.map((r) => r.mult), 1);
  const none = problems.every((p) => w[p.id] === 0);

  return (
    <div>
      <div className="presets" role="group" aria-label="Presets">
        {presets.map((p) => <button key={p.label} type="button" className="chip" onClick={() => setW(p.set)}>{p.label}</button>)}
      </div>
      <h2 style={{ marginTop: 20 }}>How much does each task matter?</h2>
      <div className="weights">
        {problems.map((p) => (
          <label key={p.id}>
            <span>{p.title}</span>
            <input type="range" min={0} max={MAX} step={1} value={w[p.id]} onChange={(e) => setW({ ...w, [p.id]: +e.target.value })} aria-label={`Importance of ${p.title}`} />
            <output>{w[p.id]}</output>
          </label>
        ))}
        <label>
          <span><strong>Memory</strong> vs speed</span>
          <input type="range" min={0} max={100} step={10} value={Math.round(mem * 100)} onChange={(e) => setMem(e.target.value)} aria-label="Importance of memory compared with speed, percent" />
          <output style={{ width: "4ch" }}>{Math.round(mem * 100)}%</output>
        </label>
        <label>
          <span><strong>Speed</strong> means</span>
          <select value={basis} onChange={(e) => setBasis(e.target.value)} aria-label="Which time counts as speed">
            <option value="warm">kernel time, warm</option>
            <option value="cold">kernel time, first iteration (cold)</option>
            <option value="e2e">end-to-end, whole process</option>
          </select>
        </label>
      </div>
      {none && <p className="muted">Give at least one task a weight above 0.</p>}
      <div className="tablewrap">
        <table>
          <caption className="small muted" style={{ textAlign: "left", padding: "8px 12px" }}>
            Weighted geometric mean of each language&apos;s speed index{mem > 0 ? " and memory index" : ""} (latest release, default build), relative to the best language for your mix (lower is better).
          </caption>
          <thead><tr><th>#</th><th>Language</th><th className="num">Score <span className="muted">(× vs best)</span></th><th className="num">Speed</th><th className="num">Memory</th><th style={{ width: "28%", minWidth: 120 }}></th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.l.id}>
                <td>{i + 1}</td>
                <td><div className="langrow"><Link href={`/languages/${r.l.id}/`} className="langcell"><LangIcon id={r.l.id} size={26} /><span>{r.l.name}</span></Link><span className="muted small">{r.l.version}</span>{r.covered < r.total && <span className="badge warn" title="Not every weighted task has data for this language">partial</span>}</div></td>
                <td className="num"><strong>{r.mult.toFixed(2)}×</strong></td>
                <td className="num muted">{r.time.toFixed(2)}×</td>
                <td className="num muted">{r.memory.toFixed(2)}×</td>
                <td><div className="bar" style={{ width: `${Math.max(2, (r.mult / max) * 100)}%`, background: colorOf(r.l.id) }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ShareBar csv={() => ({ filename: "language-bench-pick.csv", header: ["rank", "language", "score_vs_best", "speed_index", "memory_index"], rows: rows.map((r, i) => [i + 1, r.l.name, +r.mult.toFixed(4), +r.time.toFixed(4), +r.memory.toFixed(4)]) })} />
      <p className="small muted">Speed and memory indices are relative to the best language on each task. This is a guide, not a verdict: see the <Link href="/methodology/">methodology</Link> for what the workloads do and do not represent.</p>
    </div>
  );
}
