import { geoMean, median } from "@lb/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock, JsonLd, NoData } from "@/components/Bits";
import StripPlot from "@/components/StripPlot";
import { bytes, day, idx, mb, seconds } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { LangIcon, ProblemIcon } from "@/components/Icons";
import { benchPath, getModel, repoUrl, reference, siteUrl, sourceOf, toCell } from "@/lib/model";

export function generateStaticParams() {
  const bs = [...getModel().byId.values()];
  // output: export rejects an empty list; render a placeholder page until the first data exists
  return bs.length ? bs.map((b) => ({ problem: b.problem, config: `${b.language}--${b.version}--${b.variant}` })) : [{ problem: "none", config: "none" }];
}

function lookup(problem: string, config: string) {
  const m = getModel();
  const b = m.byId.get(`${config}--${problem}`);
  if (!b) return undefined;
  const l = m.languages.find((x) => x.spec.id === b.language)!;
  const p = m.problems.find((x) => x.spec.id === b.problem)!;
  const v = l.spec.variants.find((x) => x.id === b.variant)!;
  return { m, b, l, p, v };
}

export async function generateMetadata({ params }: { params: Promise<{ problem: string; config: string }> }) {
  const { problem, config } = await params;
  const r = lookup(problem, config);
  if (!r) return {};
  const c = toCell(r.m, r.b);
  return meta(`${r.l.spec.name} ${r.b.version} ${r.p.spec.title} benchmark (${r.v.name})`,
    `${r.l.spec.name} ${r.b.version} compiled/run with ${r.v.name}: ${idx(c.index)} the time of the fastest implementation on ${r.p.spec.title}, from ${c.sessions} independent sessions. Source, flags and raw repetitions included.`, benchPath(r.b));
}

export default async function Benchmark({ params }: { params: Promise<{ problem: string; config: string }> }) {
  const { problem, config } = await params;
  const r = lookup(problem, config);
  if (!r && problem === "none") return <NoData />;
  if (!r) notFound();
  const { m, b, l, p, v } = r;
  const c = toCell(m, b);
  const ref = reference(m, b.problem);
  const src = sourceOf(m, b.language, b.problem);
  const factors = b.sessions.map((s) => s.machineFactor);
  const adjusted = b.sessions.map((s) => s.adjustedMedian);
  const args = p.spec.args.join(" ");
  const firstSession = b.sessions[0]!;
  const nSessionsTotal = m.analysis.sessionCount;
  const cmd = `pnpm lb verify ${b.language} --version ${b.version} --variant ${b.variant} --problems ${b.problem}`;
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Dataset", name: `${l.spec.name} ${b.version} ${p.spec.title} benchmark`, description: `Raw repetitions and statistics of ${b.sessions.length} benchmark sessions`, url: `${siteUrl}${benchPath(b)}`, isBasedOn: `${repoUrl}/tree/main/data/sessions` }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Problems", item: `${siteUrl}/problems/` },
        { "@type": "ListItem", position: 2, name: p.spec.title, item: `${siteUrl}/problems/${b.problem}/` },
        { "@type": "ListItem", position: 3, name: `${l.spec.name} ${b.version}`, item: `${siteUrl}${benchPath(b)}` },
      ] }} />
      <p className="small muted"><Link href={`/problems/${b.problem}/`}>{p.spec.title}</Link> › <Link href={`/languages/${b.language}/`}>{l.spec.name}</Link></p>
      <h1 className="with-icons"><ProblemIcon id={b.problem} size={52} /><span>{p.spec.title}<small><LangIcon id={b.language} size={20} /> {l.spec.name} {b.version}</small></span></h1>
      <p className="lead">{v.name}. Index <strong>{idx(c.index)}</strong> vs the fastest ({idx(c.indexLow)}–{idx(c.indexHigh)}), {seconds(c.seconds)} on the average machine, {mb(c.memoryMB)} average memory.
        {c.provisional && <> <span className="badge warn">provisional: fewer than 3 sessions</span></>} {c.correct ? <span className="badge good">output verified</span> : <span className="badge warn">output differs from expected!</span>}</p>

      <h2>How this number came about</h2>
      <ol className="steps">
        <li><strong>The task.</strong> {p.spec.description} The program is started as <code>{b.runCommand}</code>. Its output must equal <a href={`${repoUrl}/blob/main/problems/${b.problem}/expected.txt`}>expected.txt</a> exactly; this was {c.correct ? "the case in every session" : "NOT the case in at least one session"}.</li>
        <li><strong>The environment.</strong> A fresh GitHub-hosted VM per session runs the pinned Docker image <code>{firstSession.imageDigest ?? "(digest not recorded)"}</code> containing <code>{b.toolVersion}</code>. Hardware, kernel and glibc of every session are listed below.</li>
        <li><strong>The source.</strong> Exactly this code (hash <code>{b.sourceHash}</code>, in git at the commit of each session) was compiled and run:</li>
      </ol>
      {src && <CodeBlock code={src} lang={l.spec.highlight} />}
      <ol className="steps" start={4} style={{ counterReset: "s 3", marginTop: 16 }}>
        <li><strong>Build and run.</strong>
          <dl className="kv" style={{ marginTop: 6 }}>
            {b.buildCommand && <><dt>build</dt><dd><code>{b.buildCommand}</code></dd></>}
            <dt>run</dt><dd><code>{b.runCommand}</code></dd>
            <dt>measured with</dt><dd><code>hyperfine --runs N --warmup 1 --export-json …</code> (hyperfine {">="} 2.0 records wall-clock time, CPU time and peak resident memory of every run; the full export is stored in the data file)</dd>
            <dt>binary size</dt><dd>{bytes(b.binarySize)}</dd></dl></li>
        <li><strong>Many sessions, many repetitions.</strong> The benchmark was measured in {b.sessions.length} independent session{b.sessions.length === 1 ? "" : "s"} between {day(b.firstDate)} and {day(b.lastDate)}, on {b.cpuModels.length} CPU model{b.cpuModels.length === 1 ? "" : "s"}. Within a session the execution order of all benchmarks was randomised. Each dot below is one repetition; the black bar is the session median; orange dots are flagged outliers (kept in the data).</li>
      </ol>
      <StripPlot rows={b.sessions.map((s) => ({ label: `${day(s.date)} · ${s.cpuModel.replace(/\(R\)|\(TM\)|CPU|Processor/g, "").replace(/\s+/g, " ").trim().slice(0, 28)}`, sub: `${s.summary.n} reps · median ${seconds(s.summary.median)}`, reps: s.reps, median: s.summary.median, outliers: s.summary.outliers }))} />
      <div className="tablewrap" style={{ marginTop: 12 }}><table>
        <thead><tr><th>Session</th><th>CPU</th><th className="num">Reps</th><th className="num">Median</th><th className="num">MAD</th><th className="num">Machine factor</th><th className="num">Median ÷ factor</th><th>Avg. memory</th><th>Source</th></tr></thead>
        <tbody>{b.sessions.map((s) => (<tr key={s.sessionId}>
          <td>{day(s.date)}</td><td className="small">{s.cpuModel} ({s.cores} cores)</td><td className="num">{s.summary.n}</td><td className="num">{seconds(s.summary.median)}</td><td className="num">{seconds(s.summary.mad)}</td>
          <td className="num">{s.machineFactor.toFixed(3)}×</td><td className="num">{seconds(s.adjustedMedian)}</td><td>{mb(s.meanMemory / 1e6)}</td>
          <td className="small">{s.runUrl ? <a href={s.runUrl}>Actions run</a> : "local"} · <a href={`${repoUrl}/blob/main/data/sessions/${s.sessionId}.json`}>raw data</a> · <a href={`${repoUrl}/tree/${s.repoCommit}`}>commit</a></td></tr>))}</tbody></table></div>
      <ol className="steps" start={6} style={{ counterReset: "s 5", marginTop: 16 }}>
        <li><strong>Cancelling out the hardware.</strong> Every session ran many different benchmarks, and benchmarks are repeated in later sessions. A benchmark measured on two machines shows how much faster one machine is than the other. From all {nSessionsTotal} sessions at once we fit <code>log(time) = benchmark + machine</code>; the “machine factor” column is how much slower (&gt;1) or faster (&lt;1) each session&apos;s machine is than the average machine: {factors.map((x) => x.toFixed(3)).join(", ")}. {b.linked ? "" : "This benchmark is not yet linked to the main group of sessions by shared benchmarks, so treat it as provisional."}</li>
        <li><strong>Combining sessions.</strong> Sessions, not repetitions, are the independent samples. Each session&apos;s median divided by its machine factor ({adjusted.map((x) => seconds(x)).join(", ")}) is averaged geometrically: <strong>{seconds(b.refSeconds)}</strong> on the average machine. The 95% interval {seconds(b.refLow)}–{seconds(b.refHigh)} comes from a cluster bootstrap that resamples sessions, then repetitions within each.</li>
        <li><strong>Index vs fastest.</strong> {ref ? <>{idx(c.index)} = this time ÷ the time of the fastest entry on the same problem, {ref.language} {ref.version} {ref.variant} ({seconds(ref.refSeconds)}); interval {idx(c.indexLow)}–{idx(c.indexHigh)}.</> : "No reference available."}</li>
        <li><strong>How much was hardware?</strong> Raw session medians differ by a geometric factor of {b.agg.rawSpread.toFixed(3)}; after dividing out the machine factors they differ by {b.agg.adjustedSpread.toFixed(3)}. The overall model leaves {m.analysis.residualSpread.toFixed(3)}× of unexplained noise.</li>
        <li><strong>Memory.</strong> Hyperfine records the peak resident set size of every repetition. We report the average over the repetitions of a session, then over sessions: {mb(c.memoryMB)}.</li>
      </ol>

      <h2>Environment per session</h2>
      <ul className="small">{b.sessions.map((s) => <li key={s.sessionId}><code>{s.sessionId}</code>: {s.cpuModel}, {s.cores} cores, image {s.imageDigest ?? "?"}</li>)}</ul>

      <h2>Reproduce it</h2>
      <pre className="code"><code>git clone {repoUrl}.git && cd language-bench{"\n"}pnpm install{"\n"}{cmd}</code></pre>
      <p className="small muted">Needs Docker. The command builds the program in the pinned image and checks its output; time it with hyperfine inside the same image as CI does. The input args are <code>{args || "none"}</code>.</p>
    </>
  );
}
