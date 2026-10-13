import { NoData } from "@/components/Bits";
import Timeline from "@/components/Timeline";
import { meta } from "@/lib/meta";
import { getModel, versionsOf } from "@/lib/model";
import { overviewSeries, timelineProblems } from "@/lib/timeline";
import { languageList } from "@/lib/text";

export const metadata = meta("Language speed over time", `How ${languageList()} performance changed from release to release.`, "/timeline/");

export default function TimelinePage() {
  const m = getModel();
  return (
    <>
      <h1>Language evolution</h1>
      <p className="lead">Time, memory and binary size of every benchmarked release of every language, by release date. Lower is better. Shows all problems combined by default; pick a single problem or metric above the chart.</p>
      {!m.hasData ? <NoData /> : (
        <Timeline series={overviewSeries(m)} problems={timelineProblems(m)}
          releases={m.languages.flatMap((l) => versionsOf(m, l).flatMap((v) => (l.releases[v] ? [{ id: `${l.spec.id}-${v}`, version: v, ...l.releases[v]! }] : [])))} note={false} />
      )}
    </>
  );
}
