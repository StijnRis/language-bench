import Link from "next/link";
import { notFound } from "next/navigation";
import { NoData } from "@/components/Bits";
import { colorOf, idx } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { allTags, compositeIndex, getModel, latestVersion, snapshotCells } from "@/lib/model";

export function generateStaticParams() {
  return allTags(getModel()).map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return meta(`${tag} benchmarks: which language is fastest?`, `Aggregate performance of C, Rust, Go, Node.js and Python on ${tag} workloads.`, `/tags/${tag}/`);
}

export default async function Tag({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const m = getModel();
  if (!allTags(m).includes(tag)) notFound();
  const problems = m.problems.filter((p) => p.spec.tags.includes(tag) && p.spec.scored);
  const cells = snapshotCells(m).filter((c) => problems.some((p) => p.spec.id === c.problem));
  const rows = m.languages.map((l) => {
    const mine = cells.filter((c) => c.language === l.spec.id);
    return { l, idx: compositeIndex(mine), n: mine.length };
  }).filter((r) => r.n > 0).sort((a, b) => a.idx - b.idx);
  return (
    <>
      <h1>“{tag}” workloads</h1>
      <p className="lead">Composite speed (geometric mean of the index vs the fastest) over the problems tagged <code>{tag}</code>: {problems.map((p, i) => <span key={p.spec.id}>{i > 0 && ", "}<Link href={`/problems/${p.spec.id}/`}>{p.spec.title}</Link></span>)}.</p>
      {!rows.length ? <NoData /> : (
        <div className="tablewrap"><table><thead><tr><th>#</th><th>Language</th><th className="num">Composite index (fastest = 1.0×)</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={r.l.spec.id}><td>{i + 1}</td><td><span className="dot" style={{ background: colorOf(r.l.spec.id) }} />{r.l.spec.name} <span className="muted small">{latestVersion(r.l)}</span></td><td className="num"><strong>{idx(r.idx)}</strong></td></tr>)}</tbody></table></div>
      )}
      <p className="small muted">Combine several tags interactively on the <Link href="/">leaderboard</Link>.</p>
    </>
  );
}
