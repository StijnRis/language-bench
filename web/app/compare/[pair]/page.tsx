import { indexVs } from "@lb/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoData } from "@/components/Bits";
import { colorOf, idx, mb, seconds } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { benchId, defaultVariant, getModel, latestVersion, pairs } from "@/lib/model";

export function generateStaticParams() {
  return pairs(getModel().languages.map((l) => l.spec.id)).map((pair) => ({ pair }));
}

function parse(pair: string) {
  const m = getModel();
  const [a, b] = pair.split("-vs-").map((id) => m.languages.find((l) => l.spec.id === id));
  return { m, a, b };
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const { a, b } = parse(pair);
  if (!a || !b) return {};
  const year = new Date().getUTCFullYear();
  return meta(`${a.spec.name} vs ${b.spec.name} performance benchmark ${year}`, `Is ${a.spec.name} faster than ${b.spec.name}? Side-by-side speed and memory on every benchmark problem, with confidence intervals.`, `/compare/${pair}/`);
}

export default async function Pair({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const { m, a, b } = parse(pair);
  if (!a || !b) notFound();
  const rows = m.problems.filter((p) => p.spec.scored).flatMap((p) => {
    const get = (l: typeof a) => m.byId.get(benchId({ language: l.spec.id, version: latestVersion(l), variant: defaultVariant(l), problem: p.spec.id }));
    const ba = get(a), bb = get(b);
    if (!ba || !bb) return [];
    const r = indexVs(m.analysis, ba, bb); // >1: a slower than b
    const significant = r.low > 1 || r.high < 1;
    return [{ p, ba, bb, ratio: r.index, low: r.low, high: r.high, significant }];
  });
  return (
    <>
      <h1>{a.spec.name} vs {b.spec.name}</h1>
      <p className="lead">Newest release and default build of each ({a.spec.name} {latestVersion(a)}, {b.spec.name} {latestVersion(b)}), compared problem by problem. “Ratio” is {a.spec.name} time ÷ {b.spec.name} time: below 1.0 means {a.spec.name} is faster.</p>
      {!rows.length ? <NoData /> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Problem</th><th className="num"><span className="dot" style={{ background: colorOf(a.spec.id) }} />{a.spec.name}</th><th className="num"><span className="dot" style={{ background: colorOf(b.spec.id) }} />{b.spec.name}</th><th className="num">Ratio (95% CI)</th><th>Verdict</th><th className="num">Avg. memory</th></tr></thead>
          <tbody>{rows.map((r) => {
            const fasterA = r.ratio < 1;
            return (<tr key={r.p.spec.id}>
              <td><Link href={`/problems/${r.p.spec.id}/`}>{r.p.spec.title}</Link></td>
              <td className="num"><Link href={`/benchmarks/${benchId(r.ba)}/`}>{seconds(r.ba.refSeconds)}</Link></td>
              <td className="num"><Link href={`/benchmarks/${benchId(r.bb)}/`}>{seconds(r.bb.refSeconds)}</Link></td>
              <td className="num">{idx(r.ratio)} <span className="muted small">({idx(r.low)}–{idx(r.high)})</span></td>
              <td>{r.significant ? <span className="badge good">{fasterA ? a.spec.name : b.spec.name} faster</span> : <span className="badge">no clear difference</span>}</td>
              <td className="num small">{mb(r.ba.memoryBytes / 1e6)} / {mb(r.bb.memoryBytes / 1e6)}</td></tr>);
          })}</tbody></table></div>
      )}
      <p className="small muted">Times are shown for the average machine (see <Link href="/methodology/">methodology</Link>). “No clear difference” means the 95% interval of the ratio includes 1.0.</p>
    </>
  );
}
