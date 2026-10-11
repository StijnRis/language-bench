import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, NoData } from "@/components/Bits";
import { idx } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { benchId, defaultVariant, getModel, latestVersion, toCell, versionsOf } from "@/lib/model";

export function generateStaticParams() {
  return getModel().languages.map((l) => ({ id: l.spec.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = getModel().languages.find((x) => x.spec.id === id);
  if (!l) return {};
  return meta(`${l.spec.name} performance benchmarks`, `How fast is ${l.spec.name}? Results on every benchmark problem, across releases and build settings.`, `/languages/${id}/`);
}

export default async function Language({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getModel();
  const l = m.languages.find((x) => x.spec.id === id);
  if (!l) notFound();
  const scored = m.problems.filter((p) => p.spec.scored);
  const has = m.analysis.benchmarks.some((b) => b.language === id);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "TechArticle", headline: `${l.spec.name} performance benchmarks` }} />
      <h1>{l.spec.name}</h1>
      <p className="lead">{l.spec.description}</p>
      <p><a href={l.spec.website}>{l.spec.website}</a> · <Link href={`/languages/${id}/timeline/`}>Performance over releases →</Link></p>
      <h2>Build settings</h2>
      <ul>{l.spec.variants.map((v) => <li key={v.id}><strong>{v.name}</strong>{v.default && " (default)"} – {v.description}<br /><code>{v.build ?? v.run}</code></li>)}</ul>
      <h2>Index vs C, per release (default build, lower = faster)</h2>
      {!has ? <NoData /> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Release</th>{scored.map((p) => <th key={p.spec.id} className="num"><Link href={`/problems/${p.spec.id}/`}>{p.spec.title}</Link></th>)}</tr></thead>
          <tbody>{versionsOf(m, l).map((version) => (
            <tr key={version}><td><strong>{version}</strong> <span className="muted small">{l.releases[version]?.date}</span></td>
              {scored.map((p) => {
                const b = m.byId.get(benchId({ language: id, version, variant: defaultVariant(l), problem: p.spec.id }));
                return <td key={p.spec.id} className="num">{b ? <Link href={`/benchmarks/${benchId(b)}/`}>{idx(toCell(m, b).index)}</Link> : "-"}</td>;
              })}</tr>))}</tbody></table></div>
      )}
      <p className="small muted">Latest release: {latestVersion(l)}. Other build settings are listed on each problem page.</p>
    </>
  );
}
