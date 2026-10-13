"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { colorOf } from "@/lib/fmt";
import { LangIcon } from "./Icons";
import ResultsTable from "./ResultsTable";

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

const gm = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);

export default function Leaderboard({ cells, languages, problems }: Props) {
  const [task, setTask] = useState("all");

  const rows = useMemo(() => {
    const scored = problems.filter((p) => p.scored);
    return languages.flatMap((l) => {
      const mine = cells.filter((c) => c.language === l.id);
      const pick = task === "all" ? mine.filter((c) => scored.some((p) => p.id === c.problem)) : mine.filter((c) => c.problem === task);
      if (!pick.length) return [];
      const sizes = pick.map((c) => c.binarySize).filter((x): x is number => x != null && x > 0);
      const single = pick.length === 1 ? pick[0]! : undefined;
      return [{
        id: l.id,
        color: colorOf(l.id),
        seconds: gm(pick.map((c) => c.seconds)),
        memoryMB: gm(pick.map((c) => c.memoryMB || 1)),
        binarySize: sizes.length ? gm(sizes) : null,
        timeTitle: single ? `95% interval vs the fastest entry: ${single.indexLow.toFixed(2)}×–${single.indexHigh.toFixed(2)}× (${single.sessions} sessions)` : undefined,
        label: (
          <div className="langrow">
            <Link href={`/languages/${l.id}/`} className="langcell"><LangIcon id={l.id} size={26} /><span>{l.name}</span></Link>
            <span className="muted small">{l.version}</span>
            {pick.some((c) => c.provisional) && <span className="badge warn">provisional</span>}
          </div>
        ),
      }];
    });
  }, [cells, languages, problems, task]);

  const caption = (task === "all" ? "Geometric mean per task on an average machine" : "Single task on an average machine") +
    ", with how many times more than the best language in brackets (lower is better).";

  return (
    <ResultsTable
      rank
      rows={rows}
      caption={caption}
      controls={
        <label>Task
          <select value={task} onChange={(e) => setTask(e.target.value)}>
            <option value="all">All tasks (composite)</option>
            {problems.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </label>
      }
    />
  );
}
