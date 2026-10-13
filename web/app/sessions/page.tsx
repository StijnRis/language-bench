import Link from "next/link";
import { NoData } from "@/components/Bits";
import { day, idx } from "@/lib/fmt";
import { meta } from "@/lib/meta";
import { getModel, sessionPath } from "@/lib/model";

export const metadata = meta("Benchmark sessions", "Every benchmark session: the machine it ran on, when, how many benchmarks it measured and how fast that machine was compared to average.", "/sessions/");

export default function Sessions() {
  const m = getModel();
  const rows = Object.values(m.sessions).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return (
    <>
      <h1>Benchmark sessions</h1>
      <p className="lead">A session is one GitHub Actions job on one fresh virtual machine. It runs many benchmarks in random order. Open a session to see the machine, the software and every measurement it produced.</p>
      {!rows.length ? <NoData /> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Session</th><th>Started</th><th>CPU</th><th className="num">Benchmarks</th><th className="num">Machine speed</th></tr></thead>
          <tbody>{rows.map((s) => {
            const f = m.analysis.machineFactors.get(s.id);
            return (<tr key={s.id}>
              <td><Link href={sessionPath(s.id)}><code>{s.id}</code></Link></td>
              <td>{day(s.startedAt)} {s.startedAt.slice(11, 16)} UTC</td>
              <td className="small">{s.host.cpu.model} · {s.host.cpu.cores} cores</td>
              <td className="num">{m.measurements.filter((x) => x.sessionId === s.id).length}</td>
              <td className="num">{f ? <>{idx(f)} <span className="muted small">{f > 1.005 ? "slower" : f < 0.995 ? "faster" : "average"}</span></> : "-"}</td></tr>);
          })}</tbody></table></div>
      )}
      <p className="small muted">“Machine speed” compares this session&apos;s virtual machine with the average one across all sessions; see the <Link href="/methodology/">methodology</Link>.</p>
    </>
  );
}
