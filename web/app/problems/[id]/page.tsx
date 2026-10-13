import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, NoData, Tags } from "@/components/Bits";
import { LangIcon, ProblemIcon } from "@/components/Icons";
import { bytes, colorOf, idx, mb, seconds } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { benchPath, defaultVariant, getModel, siteUrl, toCell } from "@/lib/model";

export function generateStaticParams() {
  return getModel().problems.map((p) => ({ id: p.spec.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getModel().problems.find((x) => x.spec.id === id);
  if (!p) return {};
  return meta(`${p.spec.title} benchmark: C vs Rust vs Go vs Node.js vs Python`, `${p.spec.summary} Results for every language and compiler setting, with confidence intervals.`, `/problems/${id}/`);
}

export default async function Problem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getModel();
  const p = m.problems.find((x) => x.spec.id === id);
  if (!p) notFound();
  const rows = m.analysis.benchmarks.filter((b) => b.problem === id).map((b) => toCell(m, b));
  // latest version of each language, all variants
  const latest = new Set(m.languages.map((l) => `${l.spec.id}|${l.spec.versions.find((v) => v.latest)!.version}`));
  const shown = rows.filter((r) => latest.has(`${r.language}|${r.version}`)).sort((a, b) => a.index - b.index);
  const max = Math.max(...shown.map((r) => r.index), 1);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "TechArticle", headline: `${p.spec.title} benchmark`, description: p.spec.summary }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Problems", item: `${siteUrl}/problems/` },
        { "@type": "ListItem", position: 2, name: p.spec.title, item: `${siteUrl}/problems/${id}/` },
      ] }} />
      <h1 className="with-icons"><ProblemIcon id={id} size={64} /><span>{p.spec.title}</span></h1>
      <p className="lead">{p.spec.summary}</p>
      <p><Tags tags={p.spec.tags} /></p>
      <h2>What is measured</h2>
      <p>{p.spec.description}</p>
      {p.spec.pseudocode && (<><h2>Pseudocode</h2><pre className="pseudo"><code>{p.spec.pseudocode}</code></pre></>)}
      <p><strong>Reveals:</strong> {p.spec.reveals}</p>
      <p><strong>Caveat:</strong> {p.spec.caveat}</p>
      <h2>Results (newest release of each language)</h2>
      {!shown.length ? <NoData /> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Language / build</th><th className="num">Index vs fastest</th><th></th><th className="num">Time (average machine)</th><th className="num">Avg. memory</th><th className="num">Binary</th><th>Sessions</th></tr></thead>
          <tbody>{shown.map((r) => {
            const l = m.languages.find((x) => x.spec.id === r.language)!;
            return (<tr key={r.id}>
              <td><LangIcon id={r.language} size={22} /><Link href={benchPath(r)}>{l.spec.name} {r.version} · {l.spec.variants.find((v) => v.id === r.variant)!.name}</Link>{r.variant === defaultVariant(l) && <span className="badge" style={{ marginLeft: 6 }}>default</span>}</td>
              <td className="num"><strong>{idx(r.index)}</strong> <span className="muted small">({idx(r.indexLow)}–{idx(r.indexHigh)})</span></td>
              <td style={{ minWidth: 160, width: "30%" }}><div className="bar" style={{ width: `${Math.max(2, (r.index / max) * 100)}%`, background: colorOf(r.language) }} /></td>
              <td className="num">{seconds(r.seconds)}</td><td className="num">{mb(r.memoryMB)}</td><td className="num">{bytes(r.binarySize)}</td>
              <td>{r.sessions} {r.provisional && <span className="badge warn">provisional</span>}</td></tr>);
          })}</tbody></table></div>
      )}
      <p className="small muted">Click a row to see the source code, build flags, every session and how the number was computed.</p>
    </>
  );
}
