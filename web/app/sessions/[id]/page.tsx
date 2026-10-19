import { environmentOf } from "@lb/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, NoData } from "@/components/Bits";
import { LangIcon, ProblemIcon } from "@/components/Icons";
import { day, idx, mb, seconds } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { benchId, benchPath, getModel, repoUrl, sessionPath, siteUrl } from "@/lib/model";

export function generateStaticParams() {
  const ids = Object.keys(getModel().sessions);
  // output: export rejects an empty list; render a placeholder page until the first data exists
  return (ids.length ? ids : ["none"]).map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getModel().sessions[id];
  if (!s) return {};
  return meta(`Benchmark session ${day(s.startedAt)} (${s.host.cpu.model})`, `Details of benchmark session ${id}: ${s.host.cpu.model}, ${s.host.cpu.cores} cores, every benchmark it measured and how fast its machine was compared to average.`, sessionPath(id));
}

const fmtDuration = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${Math.round(s)} s`);
const gib = (n?: number) => (typeof n === "number" ? `${(n / 2 ** 30).toFixed(1)} GiB` : "-");
const mkey = (x: { language: string; version: string; variant: string; problem: string }) => `${x.language}|${x.version}|${x.variant}|${x.problem}`;

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getModel();
  if (id === "none" && !Object.keys(m.sessions).length) return <NoData />;
  const s = m.sessions[id];
  if (!s) notFound();
  const factor = m.analysis.machineFactors.get(id);
  const ms = m.measurements.filter((x) => x.sessionId === id);
  const ok = ms.filter((x) => x.status === "ok" && (x.runs?.wall.length || x.kernel?.durations.length));
  const failed = ms.length - ok.length;
  const t = s.trigger as Record<string, string | number | undefined>;
  const runner = s.runner as Record<string, string | undefined>;
  const host = s.host as Record<string, any>;
  const rows = ms.map((x) => {
    const b = m.byId.get(benchId(x));
    // the session's value under the benchmark's primary metric (warm kernel time, or end-to-end where there is no kernel run)
    const d = x.status === "ok" ? b?.sessions.find((y) => y.sessionId === id) : undefined;
    const med = d ? d.summary.median : NaN;
    const mem = d && d.meanMemory > 0 ? d.meanMemory : NaN;
    return {
      x, med, mem, reps: d ? (d.iterations ?? d.summary.n) : 0, d,
      b,
      l: m.languages.find((y) => y.spec.id === x.language),
      p: m.problems.find((y) => y.spec.id === x.problem),
      adj: factor ? med / factor : NaN,
    };
  }).sort((a, c) => s.order.indexOf(mkey(a.x)) - s.order.indexOf(mkey(c.x)));
  // benchmarks that also ran in other sessions: these are what reveal how fast this machine is
  const shared = rows.filter((r) => r.b && r.b.sessions.length > 1 && isFinite(r.med) && r.med > 0);
  const ratios = shared.map((r) => r.med / r.b!.refSeconds);
  const geo = ratios.length ? Math.exp(ratios.reduce((a, x) => a + Math.log(x), 0) / ratios.length) : NaN;
  const images = Object.values(s.containers) as Record<string, string>[];
  const reasons = new Map<string, number>();
  for (const pl of s.plan) reasons.set(String(pl.reason), (reasons.get(String(pl.reason)) ?? 0) + 1);
  const reasonText: Record<string, string> = { new: "never measured before", "least-measured": "had the fewest sessions so far", overlap: "re-run on purpose to compare machines" };
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Sessions", item: `${siteUrl}/sessions/` },
        { "@type": "ListItem", position: 2, name: id, item: `${siteUrl}${sessionPath(id)}` },
      ] }} />
      <p className="small muted"><Link href="/sessions/">Sessions</Link> ›</p>
      <h1>Session {day(s.startedAt)} <small className="muted" style={{ fontSize: "1.1rem", fontWeight: 600 }}>{s.startedAt.slice(11, 16)} UTC</small></h1>
      <p className="lead"><code>{id}</code>: one fresh virtual machine ({s.host.cpu.model}, {s.host.cpu.cores} cores) that measured {ok.length} benchmark{ok.length === 1 ? "" : "s"} in {fmtDuration(s.durationSeconds)}{failed > 0 && <>, {failed} failed</>}.</p>

      <h2>How fast was this machine?</h2>
      {factor ? (
        <div className="verdict-hero">
          <div className="big">{idx(factor)} <span className="muted" style={{ fontSize: "1.1rem" }}>{factor > 1.005 ? "slower than average" : factor < 0.995 ? "faster than average" : "about average"}</span></div>
          <div className="sub">
            GitHub gives every session a different computer, and some are faster than others. Programs that ran here took {factor > 1 ? <>about {idx(factor)} as long</> : <>only {idx(factor)} of the time</>} as they would on the average machine of all {m.analysis.sessionCount} sessions.
            To compare languages fairly we divide every time measured here by this number (the “Median ÷ factor” column below). The number is worked out by comparing benchmarks that ran on several machines: if the same program is consistently 20% slower here than elsewhere, this machine is 1.2× slower.
          </div>
        </div>
      ) : <p className="muted">No machine factor available for this session.</p>}

      <h2>How the machine factor was calculated</h2>
      <ol className="steps">
        <li><strong>Find benchmarks that ran on more than one machine.</strong> {shared.length} of the {ok.length} benchmarks in this session were also measured in at least one other session. Benchmarks that only ran here say nothing about this machine&apos;s speed, so they are ignored.</li>
        <li><strong>Compare with the average machine.</strong> For each of those, the table below divides the median time measured here by the benchmark&apos;s time on the average machine (the geometric mean over all its sessions, each corrected by its own machine factor). A ratio of 1.20× means this program took 20% longer here than it normally does.</li>
        <li><strong>Average the ratios.</strong> The machine factor is the geometric mean of those ratios{isFinite(geo) && factor ? <>: <strong>{idx(geo)}</strong>{Math.abs(geo / factor - 1) < 0.002 ? <>, which equals this session&apos;s factor of <strong>{idx(factor)}</strong>.</> : <>, which matches this session&apos;s factor of {idx(factor)} apart from rounding and re-centring.</>}</> : "."} Because the factors of all sessions depend on each other (a session&apos;s factor changes what the “average machine” time of each benchmark is), they are computed together by repeating steps 2 and 3 for all sessions until nothing changes, then shifting them so the average machine is exactly 1.0×.</li>
      </ol>
      {shared.length > 0 && (
        <div className="tablewrap"><table>
          <thead><tr><th>Benchmark</th><th className="num">Time here</th><th className="num">Average machine</th><th className="num">Ratio</th><th className="num">Sessions</th></tr></thead>
          <tbody>{shared.map((r) => (<tr key={mkey(r.x)}>
            <td><Link href={benchPath(r.b!)}>{r.p?.spec.title ?? r.x.problem} · {r.l?.spec.name ?? r.x.language} {r.x.version} · {r.x.variant}</Link></td>
            <td className="num">{seconds(r.med)}</td><td className="num">{seconds(r.b!.refSeconds)}</td><td className="num">{idx(r.med / r.b!.refSeconds)}</td><td className="num">{r.b!.sessions.length}</td></tr>))}
            <tr><td><strong>Geometric mean</strong></td><td></td><td></td><td className="num"><strong>{idx(geo)}</strong></td><td></td></tr></tbody></table></div>
      )}
      {shared.length === 0 && <p className="muted">This session has no benchmarks in common with other sessions yet, so its factor cannot be estimated and counts as 1.0×.</p>}

      <h2>Machine</h2>
      <dl className="kv">
        <dt>CPU</dt><dd>{s.host.cpu.model} ({String(host.cpu?.vendor ?? "")}), {s.host.cpu.cores} cores{host.cpu?.mhzAtStart ? `, ${Math.round(Number(host.cpu.mhzAtStart))} MHz at start` : ""}</dd>
        <dt>Memory</dt><dd>{gib(host.memory?.totalBytes)} total</dd>
        <dt>Kernel</dt><dd><code>{String(host.kernel ?? "-")}</code> ({String(host.arch ?? "")})</dd>
        <dt>CPU governor</dt><dd>{String(host.scalingGovernor ?? "unknown")}</dd>
        <dt>OS environment</dt><dd>{environmentOf(s)}: sessions on the same OS image share one workload-specific correction (see the <Link href="/methodology/">methodology</Link>)</dd>
        <dt>Runner</dt><dd>{runner.RUNNER_ENVIRONMENT ?? "-"} {runner.RUNNER_OS} {runner.RUNNER_ARCH}, image {runner.ImageOS} {runner.ImageVersion}</dd>
        <dt>Load at start</dt><dd>{String(host.loadAvgStart ?? "-")}</dd>
      </dl>

      <h2>Run</h2>
      <dl className="kv">
        <dt>Started</dt><dd>{s.startedAt}</dd>
        <dt>Finished</dt><dd>{s.finishedAt} ({fmtDuration(s.durationSeconds)})</dd>
        <dt>Triggered by</dt><dd>{String(t.event ?? "-")} ({String(t.workflow ?? "")}){t.actor ? <>, by {String(t.actor)}</> : ""}, session {String(t.sessionIndexInRound ?? "?")} of {String(t.sessionsInRound ?? "?")} in its round</dd>
        {t.runUrl && <><dt>CI run</dt><dd><a href={String(t.runUrl)}>{String(t.runUrl).replace("https://github.com/", "")}</a></dd></>}
        <dt>Code version</dt><dd><a href={`${repoUrl}/tree/${s.repoCommit}`}><code>{s.repoCommit.slice(0, 10)}</code></a></dd>
        <dt>Raw data</dt><dd><a href={`${repoUrl}/blob/main/data/sessions/${id}.json`}>data/sessions/{id}.json</a></dd>
        <dt>Timing</dt><dd>in-process kernel loops of the language harnesses; hyperfine {String((s.tooling as Record<string, string>).hyperfineVersion ?? "?")} for the end-to-end runs</dd>
        <dt>Why these benchmarks</dt><dd>{[...reasons].map(([r, n]) => `${n} ${reasonText[r] ?? r}`).join(", ") || "-"}</dd>
      </dl>

      <h2>Docker images</h2>
      <div className="tablewrap"><table>
        <thead><tr><th>Image</th><th>Toolchain</th><th>OS</th><th>Digest</th></tr></thead>
        <tbody>{images.map((c) => (<tr key={c.image}><td><code>{c.image}</code></td><td className="small">{c.toolVersion}</td><td className="small">{c.osRelease}</td><td className="small"><code>{c.digest}</code></td></tr>))}</tbody></table></div>

      <h2>Measurements in this session</h2>
      <p className="small muted">In the order they ran (randomised). The median is the warm kernel time (end-to-end for the start-up task); “÷ factor” converts it to the average machine. Cold is the first iteration; end-to-end is process start to exit.</p>
      <div className="tablewrap"><table>
        <thead><tr><th>Problem</th><th>Language / build</th><th className="num">Iterations</th><th className="num">Median (warm kernel)</th><th className="num">÷ factor</th><th className="num">Cold</th><th className="num">End-to-end</th><th className="num">Avg. memory</th><th>Output</th></tr></thead>
        <tbody>{rows.map((r) => (<tr key={mkey(r.x)}>
          <td><span className="langrow"><ProblemIcon id={r.x.problem} size={24} />{r.p?.spec.title ?? r.x.problem}</span></td>
          <td><span className="langrow"><LangIcon id={r.x.language} size={20} />{r.b ? <Link href={benchPath(r.b)}>{r.l?.spec.name ?? r.x.language} {r.x.version} · {r.x.variant}</Link> : <>{r.l?.spec.name ?? r.x.language} {r.x.version} · {r.x.variant}</>}</span></td>
          <td className="num">{r.reps || "-"}</td><td className="num">{seconds(r.med)}</td><td className="num">{seconds(r.adj)}</td><td className="num">{r.d?.cold ? seconds(r.d.cold) : "-"}</td><td className="num">{r.d?.e2e ? seconds(r.d.e2e) : "-"}</td><td className="num">{isFinite(r.mem) ? mb(r.mem / 1e6) : "-"}</td>
          <td>{r.x.status !== "ok" ? <span className="badge warn">{r.x.status === "incomplete" ? "timeout" : "failed"}</span> : r.x.correct ? <span className="badge good">correct</span> : <span className="badge warn">incorrect</span>}</td></tr>))}</tbody></table></div>
      {s.skipped.length > 0 && <p className="small muted">{s.skipped.length} planned benchmark{s.skipped.length === 1 ? " was" : "s were"} skipped (time budget or build failure).</p>}
    </>
  );
}
