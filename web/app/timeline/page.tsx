import { NoData } from "@/components/Bits";
import Timeline from "@/components/Timeline";
import { meta } from "@/lib/meta";
import { getModel, versionsOf } from "@/lib/model";
import { overviewSeries } from "@/lib/timeline";

export const metadata = meta("Language speed over time", "How C, Rust, Go, Node.js and Python performance changed from release to release.", "/timeline/");

export default function TimelinePage() {
  const m = getModel();
  return (
    <>
      <h1>Language evolution</h1>
      <p className="lead">Speed of every benchmarked release of every language, by release date. Lower is faster. Choose a problem and compare languages over time.</p>
      {!m.hasData ? <NoData /> : (
        <Timeline series={overviewSeries(m)} problems={m.problems.filter((p) => p.spec.scored).map((p) => ({ id: p.spec.id, title: p.spec.title }))}
          releases={m.languages.flatMap((l) => versionsOf(m, l).flatMap((v) => (l.releases[v] ? [{ id: `${l.spec.id}-${v}`, version: v, ...l.releases[v]! }] : [])))} note={false} />
      )}
    </>
  );
}
