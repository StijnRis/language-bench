import Link from "next/link";
import { notFound } from "next/navigation";
import BadgeBox from "@/components/BadgeBox";
import { JsonLd, NoData } from "@/components/Bits";
import Breadcrumbs from "@/components/Breadcrumbs";
import { LangIcon, ProblemIcon } from "@/components/Icons";
import ReleaseTable from "@/components/ReleaseTable";
import Timeline from "@/components/Timeline";
import { colorOf, idx, logBar, mb, seconds } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { benchId, benchPath, defaultVariant, getModel, latestVersion, siteUrl, snapshotCells, toCell, versionsOf } from "@/lib/model";
import { ranking } from "@/lib/text";
import { languageSeries, timelineProblems } from "@/lib/timeline";

export function generateStaticParams() {
  return getModel().languages.map((l) => ({ id: l.spec.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = getModel().languages.find((x) => x.spec.id === id);
  if (!l) return {};
  return meta(`${l.spec.name} performance benchmarks`, `How fast is ${l.spec.name}? Results on every benchmark problem, across releases and build settings.`, `/languages/${id}/`, { kind: "language", id });
}

const pairPath = (a: string, b: string) => `/compare/${[a, b].sort().join("-vs-")}/`;

export default async function Language({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getModel();
  const l = m.languages.find((x) => x.spec.id === id);
  if (!l) notFound();
  const scored = m.problems.filter((p) => p.spec.scored);
  const has = m.analysis.benchmarks.some((b) => b.language === id);
  const order = ranking(m);
  const at = order.findIndex((r) => r.id === id);
  const versions = versionsOf(m, l);
  const dates = versions.map((v) => l.releases[v]?.date).filter((d): d is string => !!d).sort();

  // latest release, default build: one row per problem with its rank among all languages
  const cells = snapshotCells(m);
  const mine = scored.flatMap((p) => {
    const c = cells.find((x) => x.language === id && x.problem === p.spec.id);
    if (!c) return [];
    const field = cells.filter((x) => x.problem === p.spec.id).sort((a, b) => a.index - b.index);
    return [{ p, c, rank: field.findIndex((x) => x.language === id) + 1, of: field.length }];
  });
  const best = mine.length ? mine.reduce((a, b) => (b.c.index < a.c.index ? b : a)) : undefined;
  const worst = mine.length ? mine.reduce((a, b) => (b.c.index > a.c.index ? b : a)) : undefined;
  const maxIdx = Math.max(...mine.map((r) => r.c.index), 1);

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "TechArticle", headline: `${l.spec.name} performance benchmarks` }} />
      <Breadcrumbs trail={[{ name: "Languages", href: "/languages/" }, { name: l.spec.name, href: `/languages/${id}/` }]} />

      <section className="lang-hero card" style={{ ["--lang" as string]: colorOf(id) }}>
        <div className="lang-hero-head">
          <LangIcon id={id} size={72} />
          <div>
            <h1 style={{ margin: 0 }}>{l.spec.name}</h1>
            <p className="lead" style={{ margin: "6px 0 4px" }}>{l.spec.description}</p>
            <a href={l.spec.website}>{l.spec.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗</a>
          </div>
        </div>
        <dl className="stats">
          <div><dt>Overall speed rank</dt><dd>{at >= 0 ? <>#{at + 1}<span className="muted small"> of {order.length}</span></> : "-"}</dd><dd className="small muted">{at >= 0 ? `${order[at]!.value.toFixed(2)}× the fastest language` : "no data yet"}</dd></div>
          <div><dt>Latest release</dt><dd>{latestVersion(l)}</dd><dd className="small muted">{versions.length} tracked release{versions.length === 1 ? "" : "s"}{dates.length > 1 ? ` since ${dates[0]!.slice(0, 4)}` : ""}</dd></div>
          <div><dt>Strongest on</dt><dd>{best ? <Link href={`/problems/${best.p.spec.id}/`}>{best.p.spec.title}</Link> : "-"}</dd><dd className="small muted">{best ? `${idx(best.c.index)} vs the fastest` : ""}</dd></div>
          <div><dt>Weakest on</dt><dd>{worst ? <Link href={`/problems/${worst.p.spec.id}/`}>{worst.p.spec.title}</Link> : "-"}</dd><dd className="small muted">{worst ? `${idx(worst.c.index)} vs the fastest` : ""}</dd></div>
        </dl>
      </section>

      <h2>Performance by problem</h2>
      <p className="muted">Newest release ({latestVersion(l)}), default build ({l.spec.variants.find((v) => v.default)?.name}). The index is how many times slower this language is than the fastest entry on that problem (1.00× = fastest); rank is among all languages.</p>
      {!mine.length ? <NoData /> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Problem</th><th className="num">Time</th><th className="num">vs fastest</th><th style={{ minWidth: 120, width: "24%" }}></th><th className="num">Rank</th><th className="num">Memory</th></tr></thead>
          <tbody>{mine.map(({ p, c, rank, of }) => {
            const b = m.byId.get(c.id);
            return (
              <tr key={p.spec.id}>
                <td><span className="langrow"><ProblemIcon id={p.spec.id} size={26} /><Link href={`/problems/${p.spec.id}/`}>{p.spec.title}</Link></span></td>
                <td className="num">{b ? <Link href={benchPath(b)}>{seconds(c.seconds)}</Link> : seconds(c.seconds)}</td>
                <td className="num"><strong>{idx(c.index)}</strong></td>
                <td><div className="bar" style={{ width: `${logBar(c.index, maxIdx)}%`, background: colorOf(id) }} /></td>
                <td className="num">{rank === 1 ? <span className="badge good">#1</span> : <>#{rank}<span className="muted small"> / {of}</span></>}</td>
                <td className="num muted">{c.memoryMB > 0 ? mb(c.memoryMB) : "-"}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      )}

      {at >= 0 && (
        <>
          <h2>Compare with other languages</h2>
          <p className="small muted">How fast each language is relative to {l.spec.name} (composite over all tasks).</p>
          <div className="compare-chips">
            {order.filter((r) => r.id !== id).map((r) => {
              const ratio = r.value / order[at]!.value; // >1: this language is faster
              return (
                <Link key={r.id} href={pairPath(id, r.id)} className="card chip-card">
                  <LangIcon id={r.id} size={26} />
                  <span><strong>{r.name}</strong><br /><span className="small muted">{Math.abs(ratio - 1) < 0.02 ? "about equal" : ratio > 1 ? `${ratio.toFixed(ratio >= 10 ? 0 : 1)}× slower` : `${(1 / ratio).toFixed(1 / ratio >= 10 ? 0 : 1)}× faster`}</span></span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <h2>Build settings</h2>
      <div className="grid">
        {l.spec.variants.map((v) => (
          <div className="card" key={v.id}>
            <h3 style={{ margin: "0 0 4px" }}>{v.name} {v.default && <span className="badge">default</span>}</h3>
            {v.description && <p className="small muted" style={{ margin: "0 0 8px" }}>{v.description}</p>}
            <code className="snippet">{v.build ?? v.run}</code>
            {v.build && <code className="snippet" style={{ marginTop: 6 }}>{v.run}</code>}
          </div>
        ))}
      </div>

      <h2>Every release (default build)</h2>
      {!has ? <NoData /> : (
        <ReleaseTable
          problems={scored.map((p) => ({ id: p.spec.id, title: p.spec.title }))}
          rows={versions.map((version) => ({
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
          releases={versions.flatMap((v) => (l.releases[v] ? [{ version: v, ...l.releases[v]! }] : []))} />
      )}

      <h2>Release highlights</h2>
      <ol className="releases">
        {versions.map((v) => (
          <li key={v}>
            <strong>{l.spec.name} {v}</strong> <span className="muted small">{l.releases[v]?.date}</span>
            {l.releases[v]?.highlights.length ? <div className="small muted">{l.releases[v]!.highlights.join(" · ")}</div> : null}
          </li>
        ))}
      </ol>

      <h2>Badge</h2>
      <p className="muted small">Show this language&apos;s overall rank in your README or website:</p>
      <BadgeBox id={id} name={l.spec.name} siteUrl={siteUrl} />
    </>
  );
}
