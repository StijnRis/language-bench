import Link from "next/link";
import { NoData } from "@/components/Bits";
import Breadcrumbs from "@/components/Breadcrumbs";
import { day, idx } from "@/lib/fmt";
import { sessionLoad } from "@/lib/load";
import { meta } from "@/lib/meta";
import { getModel, sessionPath } from "@/lib/model";
import { environmentOf, geoMean } from "@lb/core";

export const metadata = meta("Benchmark sessions", "Every benchmark session: the machine it ran on, when, how many benchmarks it measured, how fast that machine was compared to average and how busy it was.", "/sessions/");

const fmtDuration = (s: number) => (s >= 3600 ? `${(s / 3600).toFixed(1)} h` : `${Math.round(s / 60)} min`);

/** Centered meter: the fill grows to the left (faster) or right (slower) of the middle mark; the scale is x0.5 to x2. */
function SpeedMeter({ factor }: { factor: number }) {
  const t = Math.max(-1, Math.min(1, Math.log2(factor)));
  const w = Math.abs(t) * 50;
  return (
    <span className="speedmeter" role="img" aria-label={`${idx(factor)} the average machine`}>
      <i className={t > 0 ? "slow" : "fast"} style={{ width: `${w}%`, left: t > 0 ? "50%" : `${50 - w}%` }} />
      <b />
    </span>
  );
}

export default function Sessions() {
  const m = getModel();
  const sessions = Object.values(m.sessions).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const byId = new Map<string, typeof m.measurements>();
  for (const x of m.measurements) (byId.get(x.sessionId) ?? byId.set(x.sessionId, []).get(x.sessionId)!).push(x);

  const rows = sessions.map((s) => {
    const ms = byId.get(s.id) ?? [];
    const trigger = s.trigger as Record<string, string | undefined>;
    return {
      s, count: ms.length, factor: m.analysis.machineFactors.get(s.id), load: sessionLoad(ms, s.host.cpu.cores), runUrl: trigger.runUrl,
    };
  });
  const days = [...new Set(rows.map((r) => day(r.s.startedAt)))];
  const cpus = [...new Set(rows.map((r) => r.s.host.cpu.model))].map((model) => {
    const mine = rows.filter((r) => r.s.host.cpu.model === model);
    const factors = mine.map((r) => r.factor).filter((f): f is number => !!f);
    const loads = mine.map((r) => r.load).filter((x): x is number => x !== undefined);
    return { model, cores: mine[0]!.s.host.cpu.cores, sessions: mine.length, factor: factors.length ? geoMean(factors) : undefined, load: loads.length ? loads.reduce((a, b) => a + b, 0) / loads.length : undefined };
  }).sort((a, b) => b.sessions - a.sessions);

  return (
    <>
      <Breadcrumbs trail={[{ name: "Sessions", href: "/sessions/" }]} />
      <h1>Benchmark sessions</h1>
      <p className="lead">A session is one GitHub Actions job on one fresh virtual machine. It runs many benchmarks in random order. Open a session to see the machine, the software and every measurement it produced.</p>
      {!rows.length ? <NoData /> : (
        <>
          <div className="grid summary-cards">
            <div className="card"><div className="small muted">Sessions</div><div className="big-num">{rows.length}</div></div>
            <div className="card"><div className="small muted">Measurements</div><div className="big-num">{m.measurements.length}</div></div>
            <div className="card"><div className="small muted">CPU models</div><div className="big-num">{cpus.length}</div></div>
            <div className="card"><div className="small muted">Days</div><div className="big-num">{days.length}</div></div>
          </div>

          <h2>Machines</h2>
          <div className="tablewrap"><table>
            <thead><tr><th>CPU</th><th className="num">Cores</th><th className="num">Sessions</th><th className="num">Speed vs average</th><th className="num">Load per core</th></tr></thead>
            <tbody>{cpus.map((c) => (
              <tr key={c.model}>
                <td>{c.model}</td><td className="num">{c.cores}</td><td className="num">{c.sessions}</td>
                <td className="num">{c.factor ? <>{idx(c.factor)} <span className="muted small">{c.factor > 1.005 ? "slower" : c.factor < 0.995 ? "faster" : "average"}</span></> : "-"}</td>
                <td className="num">{c.load !== undefined ? c.load.toFixed(2) : "-"}</td>
              </tr>
            ))}</tbody>
          </table></div>
          <p className="small muted">Load per core is the 1-minute load average measured just before each benchmark, divided by the core count, averaged over the session. See <Link href="/validation/">validation</Link> for how load relates to the results.</p>

          {days.map((d) => {
            const list = rows.filter((r) => day(r.s.startedAt) === d);
            return (
              <section key={d}>
                <h2>{d} <span className="muted small">· {list.length} session{list.length === 1 ? "" : "s"}</span></h2>
                <div className="session-list">
                  {list.map((r) => (
                    <div className="card session-row" key={r.s.id}>
                      <div className="session-id">
                        <Link href={sessionPath(r.s.id)}><strong>{r.s.startedAt.slice(11, 16)} UTC</strong></Link>
                        <code className="small muted">{r.s.id.split("T")[1]}</code>
                      </div>
                      <div className="session-machine">
                        <div>{r.s.host.cpu.model}</div>
                        <div className="small muted">{r.s.host.cpu.cores} cores · {environmentOf(r.s)}</div>
                      </div>
                      <div className="session-count">
                        <strong>{r.count}</strong> <span className="small muted">benchmarks</span>
                        <div className="small muted">{fmtDuration(r.s.durationSeconds)}{r.runUrl && <> · <a href={r.runUrl}>CI run</a></>}</div>
                      </div>
                      <div className="session-speed">
                        {r.factor ? <><SpeedMeter factor={r.factor} /><div className="small"><strong>{idx(r.factor)}</strong> <span className="muted">{r.factor > 1.005 ? "slower" : r.factor < 0.995 ? "faster" : "average"}</span></div></> : <span className="muted small">-</span>}
                      </div>
                      <div className="session-load">
                        <div className="small muted">load / core</div>
                        <strong>{r.load !== undefined ? r.load.toFixed(2) : "-"}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
      <p className="small muted">“Speed vs average” compares this session&apos;s virtual machine with the average one across all sessions; see the <Link href="/methodology/">methodology</Link>.</p>
    </>
  );
}
