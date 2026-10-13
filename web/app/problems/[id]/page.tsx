import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, NoData, Tags } from "@/components/Bits";
import { LangIcon, ProblemIcon } from "@/components/Icons";
import ResultsTable from "@/components/ResultsTable";
import { colorOf, idx } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { benchPath, defaultVariant, getModel, siteUrl, toCell } from "@/lib/model";
import { languageVs } from "@/lib/text";

export function generateStaticParams() {
  return getModel().problems.map((p) => ({ id: p.spec.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getModel().problems.find((x) => x.spec.id === id);
  if (!p) return {};
  return meta(`${p.spec.title} benchmark: ${languageVs()}`, `${p.spec.summary} Results for every language and compiler setting, with confidence intervals.`, `/problems/${id}/`);
}

export default async function Problem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getModel();
  const p = m.problems.find((x) => x.spec.id === id);
  if (!p) notFound();
  const rows = m.analysis.benchmarks.filter((b) => b.problem === id).map((b) => toCell(m, b));
  // latest version of each language, all variants
  const latest = new Set(m.languages.map((l) => `${l.spec.id}|${l.spec.versions.find((v) => v.latest)!.version}`));
  const shown = rows.filter((r) => latest.has(`${r.language}|${r.version}`));
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
        <ResultsTable
          nameHeader="Language / build"
          rows={shown.map((r) => {
            const l = m.languages.find((x) => x.spec.id === r.language)!;
            return {
              id: r.id, seconds: r.seconds, memoryMB: r.memoryMB, binarySize: r.binarySize, color: colorOf(r.language), timeMult: r.index,
              timeTitle: `95% interval vs the fastest entry: ${idx(r.indexLow)}–${idx(r.indexHigh)} (${r.sessions} sessions)`,
              label: <span className="langrow"><LangIcon id={r.language} size={22} /><Link href={benchPath(r)}>{l.spec.name} {r.version} · {l.spec.variants.find((v) => v.id === r.variant)!.name}</Link>{r.variant === defaultVariant(l) && <span className="badge">default</span>}{r.provisional && <span className="badge warn">provisional</span>}</span>,
            };
          })}
        />
      )}
      <p className="small muted">Click a language to see the source code, build flags, every session and how the number was computed.</p>
    </>
  );
}
