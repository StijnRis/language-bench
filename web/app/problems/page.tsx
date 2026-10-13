import Link from "next/link";
import { Tags } from "@/components/Bits";
import { ProblemIcon } from "@/components/Icons";
import { meta } from "@/lib/meta";
import { getModel } from "@/lib/model";

export const metadata = meta("Benchmark problems", "The workloads used to compare programming languages: N-body, binary trees, JSON parsing, hash maps, sorting, strings, parallel reduction and file processing.", "/problems/");

export default function Problems() {
  const m = getModel();
  return (
    <>
      <h1>Benchmark problems</h1>
      <p className="lead">Each problem stresses a different part of a language implementation. Every problem has an exact expected output that all implementations must reproduce.</p>
      <div className="grid">
        {m.problems.map((p) => (
          <div className="card problem-card" key={p.spec.id}>
            <ProblemIcon id={p.spec.id} size={52} />
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: "1.1rem" }}><Link href={`/problems/${p.spec.id}/`}>{p.spec.title}</Link></h2>
              <p className="small muted">{p.spec.summary}</p>
              <Tags tags={p.spec.tags} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
