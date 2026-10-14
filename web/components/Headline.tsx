import { indexVs } from "@lb/core";
import Link from "next/link";
import { benchId, defaultVariant, getModel, latestVersion } from "@/lib/model";
import { ranking } from "@/lib/text";

/** One-sentence conclusion computed from the data, with freshness and a "how sure are we" meter. */
export default function Headline() {
  const m = getModel();
  const order = ranking(m);
  if (order.length < 2) return null;
  const [a, b] = order as [(typeof order)[number], (typeof order)[number]];
  const last = order[order.length - 1]!;
  const get = (id: string, problem: string) => {
    const l = m.languages.find((x) => x.spec.id === id)!;
    return m.byId.get(benchId({ language: id, version: latestVersion(l), variant: defaultVariant(l), problem }));
  };
  const scored = m.problems.filter((p) => p.spec.scored);
  let clear = 0, compared = 0;
  for (const p of scored) {
    const ba = get(a.id, p.spec.id), bb = get(b.id, p.spec.id);
    if (!ba || !bb) continue;
    compared++;
    if (indexVs(m.analysis, ba, bb).high < 1) clear++; // <1: a faster
  }
  const tied = compared === 0 || clear < compared / 2;
  const updated = m.analysis.benchmarks.map((x) => x.lastDate).sort().pop()?.slice(0, 10);
  const times = (x: number) => x.toFixed(x >= 10 ? 0 : 1);
  const name = (id: string, text: string) => <Link href={`/languages/${id}/`}>{text}</Link>;
  return (
    <section className="headline" aria-label="Summary">
      <div className="big">
        {tied
          ? <>{name(a.id, a.name)} and {name(b.id, b.name)} are effectively tied for fastest overall; {name(last.id, last.name)} needs {times(last.value)}× the time of the leader.</>
          : <>{name(a.id, a.name)} is the fastest overall, {(b.value / a.value).toFixed(2)}× ahead of {name(b.id, b.name)}; {name(last.id, last.name)} is {times(last.value)}× slower than the leader.</>}
      </div>
      <div className="facts">
        {updated && <span>Last measured <time dateTime={updated}><strong>{updated}</strong></time></span>}
        <span><strong>{m.analysis.sessionCount}</strong> sessions · <strong>{m.analysis.benchmarks.length}</strong> benchmarks</span>
        <Link href="/pick/">Weigh the tasks yourself →</Link>
      </div>
    </section>
  );
}
