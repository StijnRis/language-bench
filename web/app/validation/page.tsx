import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { NoData } from "@/components/Bits";
import { meta } from "@/lib/meta";
import { getModel, repoUrl } from "@/lib/model";
import LoadScatter from "@/components/LoadScatter";
import { validate } from "@/lib/validation";

export const metadata = meta(
  "Validation: does the machine-speed correction work?",
  "Evidence that the statistical correction for runner hardware works: how much the results of the same benchmark disagree across sessions before and after correcting for machine speed.",
  "/validation/",
);

const pct = (f: number) => `±${((f - 1) * 100).toFixed(1)}%`;

export default function Validation() {
  const m = getModel();
  const v = validate(m);
  const enough = v.benchmarks > 0;
  const max = Math.max(...v.bins.flatMap((b) => [b.raw, b.corrected]), 1);
  const W = 760, H = 220, M = { l: 40, r: 10, t: 12, b: 44 };
  const bw = (W - M.l - M.r) / v.bins.length;
  const Y = (n: number) => H - M.b - (n / max) * (H - M.t - M.b);
  return (
    <>
      <Breadcrumbs trail={[{ name: "Validation", href: "/validation/" }]} />
      <h1>Validation</h1>
      <p className="lead">GitHub-hosted runners differ in speed from session to session. The site corrects for that with a statistical model (see the <Link href="/methodology/">methodology</Link>). This page checks the correction against the data itself: if it works, the same benchmark measured on different machines should agree much better afterwards.</p>
      {!m.hasData || !enough ? <NoData /> : (
        <>
          <div className="grid">
            <div className="card"><div className="small muted">Typical disagreement between sessions, raw</div><div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{pct(v.rawSpread)}</div></div>
            <div className="card"><div className="small muted">After machine and OS correction</div><div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--good)" }}>{pct(v.correctedSpread)}</div></div>
            <div className="card"><div className="small muted">Variance explained by the correction</div><div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{(v.explained * 100).toFixed(0)}%</div></div>
          </div>
          <p className="muted">Computed over {v.benchmarks} benchmarks measured in two or more sessions ({v.observations} session results). Spread is the root-mean-square deviation of a session result from its benchmark&apos;s mean on a log scale, so ±5% means a typical session is about 5% off.{v.worst && <> The largest remaining deviation is {v.worst.percent.toFixed(1)}% (<code>{v.worst.key}</code>); it is not removed.</>}</p>
          <p className="small muted">Caveat: the machine factors are fitted from the same data, so this is an in-sample check. Few sessions per benchmark make the fit flatter the result. It becomes a stronger test as more sessions on different hardware arrive. The model&apos;s own recovery of known factors is unit-tested on synthetic data in <a href={`${repoUrl}/blob/main/core/src/stats.test.ts`}>stats.test.ts</a>.</p>

          <h2>Distribution of deviations</h2>
          <div className="chartwrap">
            <svg className="histo" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 520 }} role="img" aria-label={`Histogram of deviations: raw results are spread out to about ${pct(v.rawSpread)}, corrected results are concentrated near zero at ${pct(v.correctedSpread)}.`}>
              {v.bins.map((b, i) => (
                <g key={b.lo}>
                  <rect className="raw" x={M.l + i * bw + 2} width={(bw - 4) / 2} y={Y(b.raw)} height={H - M.b - Y(b.raw)} />
                  <rect x={M.l + i * bw + 2 + (bw - 4) / 2} width={(bw - 4) / 2} y={Y(b.corrected)} height={H - M.b - Y(b.corrected)} />
                  <text x={M.l + i * bw + bw / 2} y={H - M.b + 14} textAnchor="middle">{b.lo > 0 ? "+" : ""}{b.lo}</text>
                </g>
              ))}
              <text x={M.l + v.bins.length * bw - 2} y={H - M.b + 14} textAnchor="end">{v.bins[v.bins.length - 1]!.hi}%</text>
              <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} stroke="var(--line)" />
              <text x={M.l - 6} y={Y(max) + 4} textAnchor="end">{max}</text>
              <text x={M.l - 6} y={Y(0) + 4} textAnchor="end">0</text>
              <g transform={`translate(${M.l + 8}, ${M.t + 4})`}><rect className="raw" x={0} y={0} width={10} height={10} /><text x={16} y={9}>raw</text><rect x={56} y={0} width={10} height={10} /><text x={72} y={9}>corrected</text></g>
              <text x={(W + M.l) / 2} y={H - 6} textAnchor="middle">deviation from the benchmark&apos;s mean (percent, lower edge of each bin)</text>
            </svg>
          </div>

          <h2>Does machine load matter?</h2>
          {v.load.n > 0 ? (
            <>
              <p className="muted">
                Before every benchmark the runner records the machine&apos;s 1-minute load average. Dividing by the core count gives the load per core (1.0 = every core busy on average). The scatter plot shows, for every measurement of a benchmark that ran in several sessions, how far its corrected result lies from that benchmark&apos;s mean, against the load at that moment.
                The correlation is <strong>{v.load.correlation.toFixed(2)}</strong>{Math.abs(v.load.correlation) < 0.1 ? " (practically none)" : Math.abs(v.load.correlation) < 0.3 ? " (weak)" : " (clear)"}; using only measurements below {v.load.threshold} load per core the typical deviation is {pct(v.load.spreadLow)} instead of {pct(v.load.spreadAll)} for all {v.load.n}.
              </p>
              <div className="chartwrap">
                <LoadScatter points={v.load.points} />
              </div>
              <div className="tablewrap"><table>
                <thead><tr><th>Load per core</th><th className="num">Measurements</th><th className="num">Typical deviation</th><th className="num">Mean bias</th></tr></thead>
                <tbody>{v.load.buckets.map((b) => (
                  <tr key={b.label}><td>{b.label}</td><td className="num">{b.n}</td><td className="num">{b.n ? `±${b.rms.toFixed(1)}%` : "-"}</td><td className="num muted">{b.n ? `${b.mean >= 0 ? "+" : ""}${b.mean.toFixed(1)}%` : "-"}</td></tr>
                ))}</tbody>
              </table></div>
              <p className="small muted">Caveat: a 1-minute load average also contains the benchmark that ran just before on the same VM, so it measures how busy the machine was, not necessarily outside interference. A positive bias in a bucket means results measured at that load were slower than the benchmark&apos;s mean.</p>
            </>
          ) : <p className="muted">No load readings in the recorded sessions yet.</p>}

          <h2>Machines seen</h2>
          <div className="tablewrap"><table>
            <thead><tr><th>CPU model</th><th className="num">Sessions</th><th className="num">Speed factor (geo. mean)</th><th className="num">Range</th><th className="num">Load / core</th></tr></thead>
            <tbody>{v.cpus.map((c) => (
              <tr key={c.model}><td>{c.model}</td><td className="num">{c.sessions}</td><td className="num">{c.factor.toFixed(3)}×</td><td className="num muted">{c.min.toFixed(3)}–{c.max.toFixed(3)}×</td><td className="num">{c.load !== undefined ? c.load.toFixed(2) : "-"}</td></tr>
            ))}</tbody>
          </table></div>
          <p className="small muted">Factor &gt; 1 means the machine was slower than the average machine. A CPU model with a narrow range across sessions is evidence that a model explains speed, and not just noise.</p>

          <h2>Operating-system images</h2>
          <div className="tablewrap"><table>
            <thead><tr><th>Image</th><th className="num">Sessions</th></tr></thead>
            <tbody>{v.environments.map((e) => <tr key={e.name}><td>{e.name}</td><td className="num">{e.sessions}</td></tr>)}</tbody>
          </table></div>
        </>
      )}
    </>
  );
}
