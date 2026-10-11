import { geoMean, median } from "@lb/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock, JsonLd, NoData } from "@/components/Bits";
import StripPlot from "@/components/StripPlot";
import { bytes, day, idx, mb, seconds } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { getModel, repoUrl, reference, sourceOf, toCell } from "@/lib/model";

export function generateStaticParams() {
  const ids = [...getModel().byId.keys()];
  // output: export rejects an empty list; render a placeholder page until the first data exists
  return (ids.length ? ids : ["none"]).map((id) => ({ id }));
}

function lookup(id: string) {
  const m = getModel();
  const b = m.byId.get(id);
  if (!b) return undefined;
  const l = m.languages.find((x) => x.spec.id === b.language)!;
  const p = m.problems.find((x) => x.spec.id === b.problem)!;
  const v = l.spec.variants.find((x) => x.id === b.variant)!;
  return { m, b, l, p, v };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = lookup(id);
  if (!r) return {};
  const c = toCell(r.m, r.b);
  return meta(`${r.l.spec.name} ${r.b.version} ${r.p.spec.title} benchmark (${r.v.name})`,
    `${r.l.spec.name} ${r.b.version} compiled/run with ${r.v.name}: ${idx(c.index)} the time of C on ${r.p.spec.title}, from ${c.sessions} independent sessions. Source, flags and raw repetitions included.`, `/benchmarks/${id}/`);
}

export default async function Benchmark({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = lookup(id);
  if (!r && id === "none") return <NoData />;
  if (!r) notFound();
  const { m, b, l, p, v } = r;
  const c = toCell(m, b);
  const ref = reference(m, b.problem);
  const src = sourceOf(m, b.language, b.problem);
  const ratios = b.sessions.map((s) => s.ratio);
  const args = p.spec.args.join(" ");
  const firstSession = b.sessions[0]!;
  const cmd = `pnpm lb bench ${b.language} ${b.version} --problems ${b.problem} --variant ${b.variant}`;
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Dataset", name: `${l.spec.name} ${b.version} ${p.spec.title} benchmark`, description: `Raw repetitions and statistics of ${b.sessions.length} benchmark sessions`, url: `${repoUrl}/blob/main/data/${b.language}.json` }} />
      <p className="small muted"><Link href={`/languages/${b.language}/`}>{l.spec.name}</Link> › <Link href={`/problems/${b.problem}/`}>{p.spec.title}</Link></p>
      <h1>{l.spec.name} {b.version} · {p.spec.title}</h1>
      <p className="lead">{v.name}. Index <strong>{idx(c.index)}</strong> vs C ({idx(c.indexLow)}–{idx(c.indexHigh)}), {seconds(c.seconds)} on the reference machine, {mb(c.memoryMB)} peak memory.
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
            <dt>measured with</dt><dd><code>hyperfine --runs N --warmup 1 --export-json …</code> (hyperfine {">="} 2.0 records wall-clock time and peak resident memory of every run)</dd>
            <dt>binary size</dt><dd>{bytes(b.binarySize)}</dd></dl></li>
        <li><strong>Many sessions, many repetitions.</strong> The benchmark was measured in {b.sessions.length} independent session{b.sessions.length === 1 ? "" : "s"} between {day(b.firstDate)} and {day(b.lastDate)}, on {b.cpuModels.length} CPU model{b.cpuModels.length === 1 ? "" : "s"}. Within a session the execution order of all benchmarks was randomised. Each dot below is one repetition; the black bar is the session median; orange dots are flagged outliers (kept in the data).</li>
      </ol>
      <StripPlot rows={b.sessions.map((s) => ({ label: `${day(s.date)} · ${s.cpuModel.replace(/\(R\)|\(TM\)|CPU|Processor/g, "").replace(/\s+/g, " ").trim().slice(0, 28)}`, sub: `${s.summary.n} reps · median ${seconds(s.summary.median)}`, reps: s.reps, median: s.summary.median, outliers: s.summary.outliers }))} />
      <div className="tablewrap" style={{ marginTop: 12 }}><table>
        <thead><tr><th>Session</th><th>CPU</th><th className="num">Reps</th><th className="num">Median</th><th className="num">MAD</th><th className="num">Anchor median</th><th className="num">Ratio = median ÷ anchor</th><th>Memory</th><th>Source</th></tr></thead>
        <tbody>{b.sessions.map((s) => (<tr key={s.sessionId}>
          <td>{day(s.date)}</td><td className="small">{s.cpuModel} ({s.cores} cores)</td><td className="num">{s.summary.n}</td><td className="num">{seconds(s.summary.median)}</td><td className="num">{seconds(s.summary.mad)}</td>
          <td className="num">{seconds(s.anchorMedian)}</td><td className="num">{s.ratio.toFixed(3)}</td><td>{mb(s.medianMemory / 1e6)}</td>
          <td className="small">{s.actionsRunUrl ? <a href={s.actionsRunUrl}>Actions run</a> : "local"} · <a href={`${repoUrl}/blob/main/data/${b.language}.json`}>raw data</a> · <a href={`${repoUrl}/tree/${s.repoCommit}`}>commit</a></td></tr>))}</tbody></table></div>
      <ol className="steps" start={6} style={{ counterReset: "s 5", marginTop: 16 }}>
        <li><strong>Cancelling out the hardware.</strong> In every session a fixed calibration program (the “anchor”) ran on the same VM. Dividing the benchmark median by the anchor median in the same session gives a hardware-independent ratio (column above): {ratios.map((x) => x.toFixed(3)).join(", ")}.</li>
        <li><strong>Combining sessions.</strong> Sessions, not repetitions, are the independent samples. Score = geometric mean of the ratios = <strong>{b.agg.score.toFixed(3)}</strong> anchor units; the 95% interval {b.agg.ciLow.toFixed(3)}–{b.agg.ciHigh.toFixed(3)} comes from a cluster bootstrap that resamples sessions, then repetitions within each. (Geometric mean check: {geoMean(ratios).toFixed(3)}.)</li>
        <li><strong>Back to seconds.</strong> Score × median anchor time over all sessions ({seconds(m.analysis.referenceAnchorSeconds)}) = <strong>{seconds(b.refSeconds)}</strong> on the “reference machine” ({seconds(b.refLow)}–{seconds(b.refHigh)}).</li>
        <li><strong>Index vs C.</strong> {ref ? <>{idx(c.index)} = this score ÷ the score of {ref.language} {ref.version} {ref.variant} on the same problem ({ref.agg.score.toFixed(3)}); interval {idx(c.indexLow)}–{idx(c.indexHigh)}.</> : "No C reference available."}</li>
        <li><strong>How much is hardware, how much noise?</strong> Ratios differ between sessions by a factor of {b.agg.betweenSpread.toFixed(3)} (geometric std. dev.); an estimated {(b.agg.icc * 100).toFixed(0)}% of the variance is between sessions (day, host, neighbours) rather than repetition noise. Median of the session ratios: {median(ratios).toFixed(3)}.</li>
        <li><strong>Memory.</strong> Peak resident set size per repetition, median per session, then geometric mean over sessions: {mb(c.memoryMB)}.</li>
      </ol>

      <h2>Environment per session</h2>
      <ul className="small">{b.sessions.map((s) => <li key={s.sessionId}><code>{s.sessionId}</code>: {s.cpuModel}, {s.cores} cores, image {s.imageDigest ?? "?"}</li>)}</ul>

      <h2>Reproduce it</h2>
      <pre className="code"><code>git clone {repoUrl}.git && cd language-bench{"\n"}pnpm install{"\n"}{cmd} --dry-run</code></pre>
      <p className="small muted">Needs Docker. The command builds the pinned image, builds and verifies the program, and runs hyperfine exactly like the CI does. The input args are <code>{args || "none"}</code>.</p>
    </>
  );
}
