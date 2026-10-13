import { indexVs } from "@lb/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoData } from "@/components/Bits";
import { LangIcon } from "@/components/Icons";
import { bytes, colorOf, idx, mb, seconds } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { benchId, benchPath, defaultVariant, getModel, latestVersion, pairs } from "@/lib/model";

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
    return [{ p, ba, bb, ratio: r.index, low: r.low, high: r.high }];
  });
  const geo = (xs: number[]) => Math.exp(xs.reduce((s, x) => s + Math.log(x), 0) / xs.length);
  const overall = rows.length ? geo(rows.map((r) => r.ratio)) : 1;
  const memRatio = rows.length ? geo(rows.map((r) => r.ba.memoryBytes / r.bb.memoryBytes)) : 1;
  const winner = overall < 1 ? a : b;
  const loser = overall < 1 ? b : a;
  const factor = overall < 1 ? 1 / overall : overall;
  const winsA = rows.filter((r) => r.ratio < 1).length;
  const memWinner = memRatio < 1 ? a : b;
  const memFactor = memRatio < 1 ? 1 / memRatio : memRatio;
  const sizeRows = rows.filter((r) => r.ba.binarySize && r.bb.binarySize);
  const sizeRatio = sizeRows.length ? geo(sizeRows.map((r) => r.ba.binarySize! / r.bb.binarySize!)) : NaN;
  const sizeWinner = sizeRatio < 1 ? a : b;
  const sizeFactor = sizeRatio < 1 ? 1 / sizeRatio : sizeRatio;
  const cell = (secs: number, memBytes: number, size: number | undefined, timeBetter: boolean, memBetter: boolean, sizeBetter: boolean) => (
    <>
      <span className={timeBetter ? "better" : undefined}>{seconds(secs)}</span>
      {" / "}
      <span className={memBetter ? "better" : undefined}>{mb(memBytes / 1e6)}</span>
      {" / "}
      <span className={sizeBetter ? "better" : undefined}>{size ? bytes(size) : "no binary"}</span>
    </>
  );
  return (
    <>
      <h1 className="with-icons"><LangIcon id={a.spec.id} size={44} /><span>{a.spec.name} vs {b.spec.name}</span><LangIcon id={b.spec.id} size={44} /></h1>
      {!rows.length ? <NoData /> : (
        <>
          <div className="verdict-hero">
            <div className="big"><span style={{ color: colorOf(winner.spec.id) }}>{winner.spec.name}</span> is {idx(factor)} faster</div>
            <div className="sub">than {loser.spec.name} overall (geometric mean over {rows.length} problems). {a.spec.name} wins {winsA}, {b.spec.name} wins {rows.length - winsA}.
              {" "}{memWinner.spec.name} uses {idx(memFactor)} less memory on average.
              {isFinite(sizeRatio) && <>{" "}{sizeWinner.spec.name} produces {idx(sizeFactor)} smaller binaries.</>}</div>
          </div>
          <p className="lead">Newest release and default build of each ({a.spec.name} {latestVersion(a)}, {b.spec.name} {latestVersion(b)}), compared problem by problem. “Ratio” is {a.spec.name} time ÷ {b.spec.name} time: below 1.0 means {a.spec.name} is faster. Each cell shows time / memory / binary size; the better value is green.</p>
          <div className="tablewrap"><table>
            <thead><tr><th>Problem</th><th className="num"><LangIcon id={a.spec.id} size={20} />{a.spec.name}</th><th className="num"><LangIcon id={b.spec.id} size={20} />{b.spec.name}</th><th className="num">Ratio (95% CI)</th></tr></thead>
            <tbody>{rows.map((r) => {
              const timeA = r.ratio < 1, memA = r.ba.memoryBytes < r.bb.memoryBytes;
              const sa = r.ba.binarySize, sb = r.bb.binarySize, sizeA = !!sa && !!sb && sa < sb, sizeB = !!sa && !!sb && sb < sa;
              return (<tr key={r.p.spec.id}>
                <td><Link href={`/problems/${r.p.spec.id}/`}>{r.p.spec.title}</Link></td>
                <td className="num"><Link href={`${benchPath(r.ba)}`} className="plain">{cell(r.ba.refSeconds, r.ba.memoryBytes, sa, timeA, memA, sizeA)}</Link></td>
                <td className="num"><Link href={`${benchPath(r.bb)}`} className="plain">{cell(r.bb.refSeconds, r.bb.memoryBytes, sb, !timeA, !memA, sizeB)}</Link></td>
                <td className="num">{idx(r.ratio)} <span className="muted small">({idx(r.low)}–{idx(r.high)})</span></td></tr>);
            })}</tbody></table></div>
        </>
      )}
      <p className="small muted">Times are shown for the average machine (see <Link href="/methodology/">methodology</Link>). A ratio whose 95% interval includes 1.0 is not a clear difference.</p>
    </>
  );
}
