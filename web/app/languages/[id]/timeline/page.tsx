import { notFound } from "next/navigation";
import { NoData } from "@/components/Bits";
import Timeline from "@/components/Timeline";
import { meta } from "@/lib/meta";
import { getModel } from "@/lib/model";
import { languageSeries } from "@/lib/timeline";

export function generateStaticParams() {
  return getModel().languages.map((l) => ({ id: l.spec.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = getModel().languages.find((x) => x.spec.id === id);
  if (!l) return {};
  return meta(`${l.spec.name} speed across versions`, `Did ${l.spec.name} get faster? Execution time of every release on every benchmark, with release notes.`, `/languages/${id}/timeline/`);
}

export default async function LanguageTimeline({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getModel();
  const l = m.languages.find((x) => x.spec.id === id);
  if (!l) notFound();
  return (
    <>
      <h1>{l.spec.name} over time</h1>
      <p className="lead">Speed of every benchmarked {l.spec.name} release, plotted at its release date. One line per build setting.</p>
      {!m.hasData ? <NoData /> : (
        <Timeline series={languageSeries(m, l)} problems={m.problems.filter((p) => p.spec.scored).map((p) => ({ id: p.spec.id, title: p.spec.title }))}
          releases={l.spec.versions.flatMap((v) => (l.releases[v.version] ? [{ version: v.version, ...l.releases[v.version]! }] : []))} />
      )}
      <h2>Release highlights</h2>
      <ul>{[...l.spec.versions].reverse().map((v) => <li key={v.version}><strong>{l.spec.name} {v.version}</strong> ({l.releases[v.version]?.date}): {l.releases[v.version]?.highlights.join("; ")}</li>)}</ul>
    </>
  );
}
