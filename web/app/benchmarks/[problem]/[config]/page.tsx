import { FLAG_TEXT, METRIC_LABEL, MIN_SESSIONS_FOR_FINAL } from "@lb/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock, JsonLd, NoData } from "@/components/Bits";
import StripPlot from "@/components/StripPlot";
import WarmupCurve from "@/components/WarmupCurve";
import { bytes, day, idx, mb, seconds } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { LangIcon, ProblemIcon } from "@/components/Icons";
import { benchPath, sessionPath, getModel, repoUrl, reference, siteUrl, sourceOf, toCell } from "@/lib/model";

export function generateStaticParams() {
  const bs = [...getModel().byId.values()];
  // output: export rejects an empty list; render a placeholder page until the first data exists
  return bs.length ? bs.map((b) => ({ problem: b.problem, config: `${b.language}--${b.version}--${b.variant}` })) : [{ problem: "none", config: "none" }];
}

const firstSessionId = (b: { sessions: { sessionId: string }[] }) => b.sessions[0]!.sessionId;

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
  const ref = reference(m, b.problem, b.metric);
  const kernel = b.metric === "warm";
  const metricName = METRIC_LABEL[b.metric];
  const refSeconds = ref?.byMetric[b.metric]?.score;
  const kernelCfg = (m.sessions[firstSessionId(b)]!.config as { kernel: { budgetSeconds: number; minIterations: number; warmupSeconds: number; checkedIterations: number } }).kernel;
  const warmupSeconds = kernelCfg.warmupSeconds;
  const src = sourceOf(m, b.language, b.problem, b.version);
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
      <p className="lead">{v.name}. {kernel ? "Kernel time" : "End-to-end time"} <strong>{seconds(c.seconds)}</strong> on the average machine, index <strong>{idx(c.index)}</strong> vs the fastest ({idx(c.indexLow)}–{idx(c.indexHigh)}), {mb(c.memoryMB)} average memory{c.peakMB > 0 && <>, {mb(c.peakMB)} peak</>}.
        {kernel && c.by.cold && c.by.e2e && <> Cold first iteration {seconds(c.by.cold.seconds)}, whole process {seconds(c.by.e2e.seconds)}.</>}
        {c.provisional && <> <span className="badge warn">provisional: fewer than {MIN_SESSIONS_FOR_FINAL} sessions</span></>}</p>

      <h2>How this number came about</h2>
      <ol className="steps">
        <li><strong>The task.</strong> {p.spec.description} {kernel
          ? <>Every iteration gets a new, never reused instance from the deterministic generator <a href={`${repoUrl}/blob/main/tools/lbgen.c`}>lbgen</a>{p.spec.instance === "none" ? " (this task has no instance: every iteration runs the same workload)" : p.spec.instance === "file" ? " (written to tmpfs as a CSV file before each iteration)" : " (streamed to the program on standard input)"}. A separate check compares an order-sensitive hash of the complete result of {kernelCfg.checkedIterations} iterations with the generator&apos;s reference; this was {c.correct ? "the case in every session" : "NOT the case in at least one session"}.</>
          : <>The program is started as <code>{b.runCommand}</code>. Its output must equal <a href={`${repoUrl}/blob/main/problems/${b.problem}/expected.txt`}>expected.txt</a> exactly; this was {c.correct ? "the case in every session" : "NOT the case in at least one session"}.</>}</li>
        <li><strong>The environment.</strong> A fresh GitHub-hosted VM per session runs the pinned Docker image <code>{firstSession.imageDigest ?? "(digest not recorded)"}</code> containing <code>{b.toolVersion}</code>. Hardware, kernel and glibc of every session are listed below.</li>
        <li><strong>The source.</strong> Exactly this code (hash <code>{b.sourceHash}</code>, in git at the commit of each session) is the kernel: it only decodes the instance and solves it. It is built together with the language&apos;s one <a href={`${repoUrl}/tree/main/languages/${b.language}/harness`}>harness</a>, which owns the clock, the loop and the output:</li>
      </ol>
      {src && <CodeBlock code={src} lang={l.spec.highlight} />}
      <ol className="steps" start={4} style={{ counterReset: "s 3", marginTop: 16 }}>
        <li><strong>Build and run.</strong>
          <dl className="kv" style={{ marginTop: 6 }}>
            {b.buildCommand && <><dt>build</dt><dd><code>{b.buildCommand}</code></dd></>}
            <dt>run</dt><dd><code>{b.runCommand}</code></dd>
            {kernel && <><dt>kernel loop</dt><dd>The harness reads and decodes an instance (untimed), times only <code>solve</code> with the language&apos;s monotonic clock, and repeats until the summed kernel time reaches {kernelCfg.budgetSeconds} s (at least {kernelCfg.minIterations} iterations, no other cap). The first iteration is the <em>cold</em> time; the <em>warm</em> time is the median of the iterations after the first {warmupSeconds} s of kernel time. Memory is read from the container&apos;s cgroup by a sampler outside the process.</dd></>}
            <dt>end-to-end</dt><dd><code>hyperfine</code> runs the same binary for exactly one iteration (process start to exit, with the instance read from a file) and records wall-clock time and peak resident memory{kernel ? "; reported next to the kernel time" : ""}.</dd>
            <dt>binary size</dt><dd>{bytes(b.binarySize)}</dd></dl></li>
        <li><strong>Many sessions, many iterations.</strong> The benchmark was measured in {b.sessions.length} independent session{b.sessions.length === 1 ? "" : "s"} between {day(b.firstDate)} and {day(b.lastDate)}, on {b.cpuModels.length} CPU model{b.cpuModels.length === 1 ? "" : "s"}. Within a session the execution order of all benchmarks was randomised. Each dot below is one {kernel ? "warm kernel iteration (at most 100 evenly spaced ones per session are shown)" : "repetition"}; the black bar is the session median; orange dots are flagged outliers (kept in the data).</li>
      </ol>
      <StripPlot rows={b.sessions.map((s) => ({ label: `${day(s.date)} · ${s.cpuModel.replace(/\(R\)|\(TM\)|CPU|Processor/g, "").replace(/\s+/g, " ").trim().slice(0, 28)}`, sub: `${kernel ? `${s.iterations} iterations` : `${s.summary.n} reps`} · median ${seconds(s.summary.median)}`, reps: s.reps, median: s.summary.median, outliers: s.summary.outliers }))} />
      {kernel && b.sessions.some((s) => s.curve) && (<>
        <h3 style={{ marginTop: 20 }}>Warm-up curve</h3>
        <p className="small muted">Kernel time of every iteration in order, one line per session (log axis; orange dot: the cold first iteration). Just-in-time and garbage-collected runtimes need a while to settle; compiled languages are flat from the start.</p>
        <WarmupCurve rows={b.sessions.flatMap((s) => (s.curve ? [{ label: day(s.date), curve: s.curve, iterations: s.iterations! }] : []))} />
      </>)}
      <div className="tablewrap" style={{ marginTop: 12 }}><table>
        <thead><tr><th>Session</th><th>CPU</th>{kernel ? <><th className="num">Iterations</th><th className="num">Cold</th><th className="num">Warm median</th><th className="num">End-to-end</th></> : <><th className="num">Reps</th><th className="num">Median</th><th className="num">MAD</th></>}<th className="num">Machine factor</th><th className="num">{kernel ? "Warm" : "Median"} ÷ factor</th><th>Avg. / peak memory</th><th>Source</th></tr></thead>
        <tbody>{b.sessions.map((s) => (<tr key={s.sessionId}>
          <td><Link href={sessionPath(s.sessionId)}>{day(s.date)}</Link></td><td className="small">{s.cpuModel} ({s.cores} cores)</td>
          {kernel ? <><td className="num">{s.iterations}</td><td className="num">{seconds(s.cold ?? NaN)}</td><td className="num">{seconds(s.warm ?? NaN)}</td><td className="num">{seconds(s.e2e ?? NaN)}</td></> : <><td className="num">{s.summary.n}</td><td className="num">{seconds(s.summary.median)}</td><td className="num">{seconds(s.summary.mad)}</td></>}
          <td className="num">{s.machineFactor.toFixed(3)}×</td><td className="num">{seconds(s.adjustedMedian)}</td><td>{mb(s.meanMemory / 1e6)}{s.peakMemory ? ` / ${mb(s.peakMemory / 1e6)}` : ""}</td>
          <td className="small">{s.runUrl ? <a href={s.runUrl}>Actions run</a> : "local"} · <a href={`${repoUrl}/blob/main/data/sessions/${s.sessionId}.json`}>raw data</a> · <a href={`${repoUrl}/tree/${s.repoCommit}`}>commit</a></td></tr>))}</tbody></table></div>
      <p className="small muted" style={{ marginTop: 8 }}>The table is computed from the raw values: <a href="raw.csv">download every iteration and repetition of this benchmark (CSV)</a>, or the complete session files linked above. Each “Warm median” is the median of the kernel iterations after the first {kernelCfg.warmupSeconds} s; “÷ factor” divides it by the machine factor.</p>
      {b.flags.length > 0 && (
        <div className="callout" role="note" style={{ marginTop: 12 }}>
          <strong>Flags.</strong> This benchmark was flagged automatically; treat it with care:
          <ul>{b.flags.map((f) => <li key={f}><code>{f}</code>: {FLAG_TEXT[f] ?? f}</li>)}</ul>
        </div>
      )}
      <ol className="steps" start={6} style={{ counterReset: "s 5", marginTop: 16 }}>
        <li><strong>Cancelling out the hardware.</strong> GitHub gives every session a different computer, and some are faster than others, so raw times from different sessions cannot be compared directly. To fix that, every session gets a <em>machine factor</em>: how many times longer programs take on that machine than on the average machine. A factor of 1.2 means “20% slower than average”. We find these factors by looking at benchmarks that ran in several sessions: if the same programs are consistently 20% slower in one session, that machine is 1.2× slower. The factors for this benchmark&apos;s sessions are {factors.map((x) => `${x.toFixed(3)}×`).join(", ")} (click a date in the table above for the session&apos;s details). {b.linked ? "" : "This benchmark is not yet linked to the main group of sessions by shared benchmarks, so treat it as provisional."} <span className="muted">Technically: we fit <code>log(time) = benchmark + machine</code> across all {nSessionsTotal} sessions at once; see the <Link href="/methodology/">methodology</Link>.</span></li>
        <li><strong>Combining sessions.</strong> Sessions, not iterations, are the independent samples. Each session&apos;s {kernel ? "warm median" : "median"} divided by its machine factor ({adjusted.map((x) => seconds(x)).join(", ")}) is averaged geometrically: <strong>{seconds(b.refSeconds)}</strong> on the average machine ({metricName}). The 95% interval {seconds(b.refLow)}–{seconds(b.refHigh)} comes from a cluster bootstrap that resamples sessions, then iterations within each.</li>
        <li><strong>Index vs fastest.</strong> {ref && refSeconds ? <>{idx(c.index)} = this time ÷ the time of the fastest entry on the same problem, {ref.language} {ref.version} {ref.variant} ({seconds(refSeconds)}); interval {idx(c.indexLow)}–{idx(c.indexHigh)}.</> : "No reference available."}</li>
        <li><strong>How much was hardware?</strong> Raw session medians differ by a geometric factor of {b.agg.rawSpread.toFixed(3)}; after dividing out the machine factors they differ by {b.agg.adjustedSpread.toFixed(3)}. The overall model leaves {m.analysis.residualSpread.toFixed(3)}× of unexplained noise.</li>
        <li><strong>Memory.</strong> {kernel ? <>A sampler on the host reads the anonymous memory of the container&apos;s cgroup every few milliseconds. The average is weighted by time over the timed kernel regions only (instance generation and decoding excluded), then averaged over sessions: {mb(c.memoryMB)}; the highest value seen was {mb(c.peakMB)}.</> : <>Hyperfine records the peak resident set size of every repetition. We report the average over the repetitions of a session, then over sessions: {mb(c.memoryMB)}.</>}</li>
      </ol>

      <h2>Reproduce it</h2>
      <pre className="code"><code>git clone {repoUrl}.git && cd language-bench{"\n"}pnpm install{"\n"}{cmd}</code></pre>
      <p className="small muted">Needs Docker. The command builds the harness and the program in the pinned image and checks the result against the generator&apos;s reference; the full timed measurement runs in CI sessions. The parameters of the problem are <code>{args || "none"}</code>.</p>
    </>
  );
}
