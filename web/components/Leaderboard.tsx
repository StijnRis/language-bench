"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useUrlState } from "@/lib/useUrlState";
import { colorOf } from "@/lib/fmt";
import { LangIcon } from "./Icons";
import ResultsTable, { type ResultMetric } from "./ResultsTable";

export interface LCell {
  id: string; language: string; version: string; variant: string; problem: string;
  t: { warm: number | null; cold: number | null; e2e: number | null }; index: number; indexLow: number; indexHigh: number; memoryMB: number;
  binarySize: number | null; sessions: number; provisional: boolean;
}
interface Props {
  cells: LCell[];
  languages: { id: string; name: string; version: string }[];
  problems: { id: string; title: string; scored: boolean }[];
}

const gm = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);

export default function Leaderboard({ cells, languages, problems }: Props) {
  const [taskRaw, setTask] = useUrlState("task", "all");
  const [metricRaw, setMetric] = useUrlState("metric", "time");
  const [basisRaw, setBasis] = useUrlState("basis", "warm");
  const basis = (["warm", "cold", "e2e"].includes(basisRaw) ? basisRaw : "warm") as "warm" | "cold" | "e2e";
  const task = taskRaw === "all" || problems.some((p) => p.id === taskRaw) ? taskRaw : "all";
  const metric = (["time", "memory", "size"].includes(metricRaw) ? metricRaw : "time") as ResultMetric;

  const rows = useMemo(() => {
    const scored = problems.filter((p) => p.scored);
    return languages.flatMap((l) => {
      const mine = cells.filter((c) => c.language === l.id);
      // a problem without data under this basis (the start-up task has no kernel time) is not ranked under it
      const pick = (task === "all" ? mine.filter((c) => scored.some((p) => p.id === c.problem)) : mine.filter((c) => c.problem === task)).filter((c) => c.t[basis] != null);
      if (!pick.length) return [];
      const sizes = pick.map((c) => c.binarySize).filter((x): x is number => x != null && x > 0);
      const single = pick.length === 1 ? pick[0]! : undefined;
      return [{
        id: l.id,
        name: l.name,
        color: colorOf(l.id),
        seconds: gm(pick.map((c) => c.t[basis]!)),
        memoryMB: gm(pick.map((c) => c.memoryMB || 1)),
        binarySize: sizes.length ? gm(sizes) : null,
        timeTitle: single && basis === "warm" ? `95% interval vs the fastest entry: ${single.indexLow.toFixed(2)}×–${single.indexHigh.toFixed(2)}× (${single.sessions} sessions)` : undefined,
        label: (
          <div className="langrow">
            <Link href={`/languages/${l.id}/`} className="langcell"><LangIcon id={l.id} size={26} /><span>{l.name}</span></Link>
            <span className="muted small">{l.version}</span>
            {pick.some((c) => c.provisional) && <span className="badge warn">provisional</span>}
          </div>
        ),
      }];
    });
  }, [cells, languages, problems, task, basis]);

  const basisText = basis === "warm" ? "Time is the kernel time of a warm iteration (the program's work on one instance, after the warm-up)" : basis === "cold" ? "Time is the kernel time of the first iteration (JIT, caches and lazy initialisation included)" : "Time is end-to-end: process start to exit for one iteration, including the runtime's start-up";
  const caption = basisText + ". " + (task === "all" ? "Geometric mean per task on an average machine" : "Single task on an average machine") +
    ", with how many times more than the best language in brackets (lower is better).";

  return (
    <ResultsTable
      rank
      rows={rows}
      metric={metric}
      onMetric={setMetric}
      csvName={`language-bench-${task}-${basis}`}
      caption={caption}
      controls={
        <>
          <label>Task
            <select value={task} onChange={(e) => setTask(e.target.value)}>
              <option value="all">All tasks (composite)</option>
              {problems.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
          <label>Time
            <select value={basis} onChange={(e) => setBasis(e.target.value)}>
              <option value="warm">Kernel, warm</option>
              <option value="cold">Kernel, cold (first iteration)</option>
              <option value="e2e">End-to-end (process)</option>
            </select>
          </label>
        </>
      }
    />
  );
}
