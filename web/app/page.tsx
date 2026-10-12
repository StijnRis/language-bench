import Link from "next/link";
import { JsonLd, NoData, Tags } from "@/components/Bits";
import Leaderboard from "@/components/Leaderboard";
import { meta } from "@/lib/meta";
import { allTags, getModel, latestVersion, snapshotCells } from "@/lib/model";

export const metadata = meta(
  "Programming language speed benchmarks: C vs Rust vs Go vs Node.js vs Python",
  "Which language is fastest? Compare C, Rust, Go, Node.js and CPython on N-body, binary trees, JSON, hash maps, sorting and more, with confidence intervals from repeated GitHub Actions runs.",
  "/",
);

export default function Home() {
  const m = getModel();
  const cells = snapshotCells(m);
  const tags = allTags(m);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: "language-bench", description: metadata.description }} />
      <section className="hero">
        <div>
          <h1>How fast is each programming language, really?</h1>
          <p className="lead">
            C, Rust, Go, Node.js and CPython measured on {m.problems.filter((p) => p.spec.scored).length} workloads. Each benchmark is re-run on
            different days and different hardware; the numbers below combine {m.analysis.sessionCount} independent sessions
            {m.analysis.cpuModels.length > 0 && <> across {m.analysis.cpuModels.length} CPU model{m.analysis.cpuModels.length === 1 ? "" : "s"}</>}.
            Click through to see exactly how any number came about.
          </p>
        </div>
        {m.hasData && (
          <figure className="share">
            <a href="share.png"><img src="share.png" alt="Bar chart: speed index of C, Rust, Go, Node.js and CPython" width={1200} height={630} /></a>
            <figcaption className="small muted">Right-click to copy or save. Regenerated from the data on every deploy.</figcaption>
          </figure>
        )}
      </section>
      {!m.hasData ? <NoData /> : (
        <Leaderboard
          cells={cells}
          languages={m.languages.map((l) => ({ id: l.spec.id, name: l.spec.name, version: latestVersion(l) }))}
          problems={m.problems.map((p) => ({ id: p.spec.id, title: p.spec.title, tags: p.spec.tags, scored: p.spec.scored }))}
          tags={tags}
        />
      )}
      <h2>Browse by what is being tested</h2>
      <p><Tags tags={tags.filter((t) => t !== "startup")} /></p>
      <div className="grid">
        {m.problems.filter((p) => p.spec.scored).map((p) => (
          <div className="card" key={p.spec.id}>
            <h3 style={{ margin: "0 0 6px" }}><Link href={`/problems/${p.spec.id}/`}>{p.spec.title}</Link></h3>
            <div className="small muted">{p.spec.summary}</div>
          </div>
        ))}
      </div>
      <h2>How to read these numbers</h2>
      <p className="muted">
        Times are normalised against a fixed calibration program run on every machine, so sessions on different hardware can be combined.
        The index is relative to the fastest entry on each problem (1.0×). Ranges are 95% confidence intervals across sessions. See the <Link href="/methodology/">methodology</Link>.
      </p>
    </>
  );
}
