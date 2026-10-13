import Link from "next/link";
import { JsonLd, NoData } from "@/components/Bits";
import { LangIcon, ProblemIcon } from "@/components/Icons";
import Leaderboard from "@/components/Leaderboard";
import { meta } from "@/lib/meta";
import { languageList, languageVs, ranking } from "@/lib/text";
import { getModel, latestVersion, siteUrl, snapshotCells } from "@/lib/model";

export const metadata = meta(
  `Programming language speed benchmarks: ${languageVs()}`,
  `Which language is fastest? Compare ${languageList()} on N-body, binary trees, JSON, hash maps, sorting and more, with confidence intervals from repeated GitHub Actions runs.`,
  "/",
);

export default function Home() {
  const m = getModel();
  const cells = snapshotCells(m);
  const scored = m.problems.filter((p) => p.spec.scored);
  const order = ranking(m);
  const fastestAnswer = order.length >= 2
    ? `Across the benchmark workloads, ${order[0]!.name} is currently the fastest overall, followed by ${order.slice(1, 4).map((r) => r.name).join(", ")}${order.length > 4 ? ` and ${order.length - 4} more` : ""}. The leaderboard above shows the exact multipliers, per task and overall.`
    : "The leaderboard above shows the exact multipliers per task and overall as soon as measurements are available.";
  const faq = [
    { q: "Which programming language is the fastest?", a: fastestAnswer },
    { q: "How are the benchmarks measured?", a: `Each benchmark is a language version, a build setting and a problem. It runs on GitHub Actions in a pinned Docker image with many repetitions. Results from ${m.analysis.sessionCount} sessions on different days and hardware are combined statistically, with machine speed factored out.` },
    { q: "Can I trust these numbers?", a: "Every number links to its source code, build flags, raw repetitions and CI run. Ranges are 95% confidence intervals computed across independent sessions, and all raw data is open in the repository." },
  ];
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: "language-bench", url: siteUrl, description: metadata.description, inLanguage: "en" }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <section className="hero">
        <div>
          <h1>How fast is each programming language, really?</h1>
          <p className="lead">
            {m.languages.map((l, i) => <span key={l.spec.id} className="inline-lang"><LangIcon id={l.spec.id} size={20} />{l.spec.name}{i < m.languages.length - 2 ? ", " : i === m.languages.length - 2 ? " and " : ""}</span>)} measured on {scored.length} workloads. Each benchmark is re-run on
            different days and different hardware; the numbers below combine {m.analysis.sessionCount} independent sessions
            {m.analysis.cpuModels.length > 0 && <> across {m.analysis.cpuModels.length} CPU model{m.analysis.cpuModels.length === 1 ? "" : "s"}{m.analysis.environments.length > 1 && <> and {m.analysis.environments.length} operating-system images</>}</>}.
            Click through to see exactly how any number came about.
          </p>
        </div>
        {m.hasData && (
          <figure className="share">
            <a href="share.png"><img src="share.png" alt={`Bar chart: speed index of ${languageList(m)}`} width={1200} height={630} /></a>
            <figcaption className="small muted">Right-click to copy or save. Regenerated from the data on every deploy.</figcaption>
          </figure>
        )}
      </section>
      {!m.hasData ? <NoData /> : (
        <Leaderboard
          cells={cells}
          languages={m.languages.map((l) => ({ id: l.spec.id, name: l.spec.name, version: latestVersion(l) }))}
          problems={m.problems.map((p) => ({ id: p.spec.id, title: p.spec.title, scored: p.spec.scored }))}
        />
      )}
      <h2>What is being tested</h2>
      <div className="grid">
        {scored.map((p) => (
          <Link className="card problem-card" key={p.spec.id} href={`/problems/${p.spec.id}/`}>
            <ProblemIcon id={p.spec.id} size={52} />
            <div>
              <h3>{p.spec.title}</h3>
              <div className="small muted">{p.spec.summary}</div>
            </div>
          </Link>
        ))}
      </div>
      <h2>How to read these numbers</h2>
      <p className="muted">
        Times are corrected for the speed of the machine (and the OS image) each session happened to run on, so sessions on different hardware can be combined.
        The number in brackets says how many times slower (or heavier) a language is than the best one in that table (1.0×). Hover a single-task value for its 95% confidence interval across sessions. See the <Link href="/methodology/">methodology</Link>.
      </p>
    <h2>Frequently asked questions</h2>
      {faq.map((f) => (
        <details className="faq" key={f.q}><summary>{f.q}</summary><p className="muted">{f.a}</p></details>
      ))}
    </>
  );
}
