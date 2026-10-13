import Link from "next/link";
import { notFound } from "next/navigation";
import { NoData } from "@/components/Bits";
import { geoMean } from "@lb/core";
import { LangIcon } from "@/components/Icons";
import ResultsTable from "@/components/ResultsTable";
import { colorOf } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { allTags, getModel, latestVersion, snapshotCells } from "@/lib/model";
import { languageList } from "@/lib/text";

export function generateStaticParams() {
  return allTags(getModel()).map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return meta(`${tag} benchmarks: which language is fastest?`, `Aggregate performance of ${languageList()} on ${tag} workloads.`, `/tags/${tag}/`);
}

export default async function Tag({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const m = getModel();
  if (!allTags(m).includes(tag)) notFound();
  const problems = m.problems.filter((p) => p.spec.tags.includes(tag) && p.spec.scored);
  const cells = snapshotCells(m).filter((c) => problems.some((p) => p.spec.id === c.problem));
  const rows = m.languages.map((l) => {
    const mine = cells.filter((c) => c.language === l.spec.id);
    const sizes = mine.map((c) => c.binarySize).filter((x): x is number => x != null && x > 0);
    return {
      id: l.spec.id, color: colorOf(l.spec.id), n: mine.length,
      seconds: mine.length ? geoMean(mine.map((c) => c.seconds)) : NaN,
      memoryMB: mine.length ? geoMean(mine.map((c) => c.memoryMB || 1)) : 0,
      binarySize: sizes.length ? geoMean(sizes) : null,
      label: <span className="langrow"><LangIcon id={l.spec.id} size={22} /><Link href={`/languages/${l.spec.id}/`}>{l.spec.name}</Link><span className="muted small">{latestVersion(l)}</span></span>,
    };
  }).filter((r) => r.n > 0);
  return (
    <>
      <h1>“{tag}” workloads</h1>
      <p className="lead">Speed, memory and binary size (geometric means) over the problems tagged <code>{tag}</code>: {problems.map((p, i) => <span key={p.spec.id}>{i > 0 && ", "}<Link href={`/problems/${p.spec.id}/`}>{p.spec.title}</Link></span>)}.</p>
      {!rows.length ? <NoData /> : (
        <ResultsTable rank rows={rows} caption="Geometric mean over the problems of this tag, newest release and default build of each language. Multipliers compare with the best language (lower is better)." />
      )}
    </>
  );
}
