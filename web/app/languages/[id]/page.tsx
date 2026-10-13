import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, NoData } from "@/components/Bits";
import { LangIcon } from "@/components/Icons";
import { meta } from "@/lib/meta";
import ReleaseTable from "@/components/ReleaseTable";
import Timeline from "@/components/Timeline";
import { languageSeries, timelineProblems } from "@/lib/timeline";
import { benchId, benchPath, defaultVariant, getModel, latestVersion, toCell, versionsOf } from "@/lib/model";

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
      <h1 className="with-icons"><LangIcon id={id} size={56} /><span>{l.spec.name}</span></h1>
      <p className="lead">{l.spec.description}</p>
      <p><a href={l.spec.website}>{l.spec.website}</a></p>
      <h2>Build settings</h2>
      <ul>{l.spec.variants.map((v) => <li key={v.id}><strong>{v.name}</strong>{v.default && " (default)"} – {v.description}<br /><code>{v.build ?? v.run}</code></li>)}</ul>
      <h2>Every release (default build)</h2>
      {!has ? <NoData /> : (
        <ReleaseTable
          problems={scored.map((p) => ({ id: p.spec.id, title: p.spec.title }))}
          rows={versionsOf(m, l).map((version) => ({
            version, date: l.releases[version]?.date,
            cells: scored.map((p) => {
              const b = m.byId.get(benchId({ language: id, version, variant: defaultVariant(l), problem: p.spec.id }));
              if (!b) return null;
              const c = toCell(m, b);
              return { href: benchPath(b), seconds: c.seconds, memoryMB: c.memoryMB, binarySize: c.binarySize };
            }),
          }))}
        />
      )}
      <h2>Speed across releases</h2>
      <p className="muted">Did {l.spec.name} get faster? Every tracked release plotted at its release date, one line per build setting. Shows time, memory or binary size over all problems by default.</p>
      {!has ? <NoData /> : (
        <Timeline series={languageSeries(m, l)} problems={timelineProblems(m)}
          releases={versionsOf(m, l).flatMap((v) => (l.releases[v] ? [{ version: v, ...l.releases[v]! }] : []))} />
      )}
      <h2>Release highlights</h2>
      <ul>{versionsOf(m, l).map((v) => <li key={v}><strong>{l.spec.name} {v}</strong> ({l.releases[v]?.date}){l.releases[v]?.highlights.length ? `: ${l.releases[v]!.highlights.join("; ")}` : ""}</li>)}</ul>
      <p className="small muted">Latest release: {latestVersion(l)}. Other build settings are listed on each problem page.</p>
    </>
  );
}
