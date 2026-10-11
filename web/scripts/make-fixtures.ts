/**
 * DEV ONLY: writes synthetic data files to .work/fixtures so the site can be developed before real
 * CI sessions exist. Build with LB_DATA_DIR=.work/fixtures. Never committed, never published.
 */
import fs from "node:fs";
import path from "node:path";
import { mulberry32, type LanguageData } from "@lb/core";
import { findRepoRoot, loadLanguages, loadProblems } from "@lb/core/discover";

const root = findRepoRoot(import.meta.dirname);
const out = path.join(root, ".work", "fixtures");
fs.mkdirSync(out, { recursive: true });

const rnd = mulberry32(7);
const noise = (sd: number) => 1 + (rnd() - 0.5) * 2 * sd;
const CPUS = [
  { model: "AMD EPYC 7763 64-Core Processor", speed: 1.0 },
  { model: "Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz", speed: 1.15 },
  { model: "AMD EPYC 9V74 80-Core Processor", speed: 0.8 },
];
/** seconds on the reference machine, per language / problem (rough orders of magnitude) */
const base: Record<string, Record<string, number>> = {
  c: { startup: 0.001, nbody: 0.1, "binary-trees": 0.15, "json-parse": 0.2, hashmap: 0.1, sort: 0.25, "string-ops": 0.08, "parallel-reduce": 0.12, "file-processing": 0.3 },
  rust: { startup: 0.001, nbody: 0.1, "binary-trees": 0.14, "json-parse": 0.18, hashmap: 0.14, sort: 0.1, "string-ops": 0.07, "parallel-reduce": 0.12, "file-processing": 0.35 },
  go: { startup: 0.002, nbody: 0.15, "binary-trees": 0.3, "json-parse": 0.5, hashmap: 0.2, sort: 0.2, "string-ops": 0.1, "parallel-reduce": 0.13, "file-processing": 0.4 },
  node: { startup: 0.04, nbody: 0.14, "binary-trees": 0.4, "json-parse": 0.5, hashmap: 0.25, sort: 0.2, "string-ops": 0.5, "parallel-reduce": 0.2, "file-processing": 0.9 },
  python: { startup: 0.015, nbody: 3.2, "binary-trees": 2.5, "json-parse": 0.5, hashmap: 0.9, sort: 1.1, "string-ops": 0.5, "parallel-reduce": 2.6, "file-processing": 2.6 },
};
const ANCHOR = 0.11;

const reps = (mean: number, sd: number, n: number) =>
  Array.from({ length: n }, () => Math.round(mean * noise(sd) * 1e7) / 1e7);

for (const l of loadLanguages(root)) {
  const probs = loadProblems(root).filter((p) => fs.existsSync(path.join(l.dir, "impl", p.spec.id)));
  const data: LanguageData = { schemaVersion: 1, language: l.spec.id, sessions: {}, measurements: [] };
  l.spec.versions.forEach((v, vi) => {
    const age = l.spec.versions.length - 1 - vi; // older = slower
    for (let s = 0; s < 6; s++) {
      const cpu = CPUS[s % CPUS.length]!;
      const id = `fixture-${l.spec.id}-${v.version}-${s}`;
      const date = new Date(Date.UTC(2026, 8, 1 + s * 4 + vi)).toISOString();
      const mk = (t: number, n: number) => ({ times: reps(t, 0.02, n), memory: Array(n).fill(20e6), exitCodes: Array(n).fill(0) });
      data.sessions[id] = {
        date, repoCommit: "fixture", image: l.spec.image.replace("{version}", v.version), hyperfineVersion: "2.0.0",
        hardware: { cpuModel: cpu.model, cores: 4, ramBytes: 16e9, arch: "x86_64" }, kernel: "6.8.0-fixture",
        anchorSpec: "fixture",
        anchors: (["start", "middle", "end"] as const).map((at) => ({ at, hyperfine: mk(ANCHOR * cpu.speed, 30) })),
      };
      for (const variant of l.spec.variants) {
        for (const p of probs) {
          const vf = variant.default ? 1 : 1.05 + (variant.id.length % 3) * 0.04;
          const t = (base[l.spec.id]?.[p.spec.id] ?? 1) * (1 + age * 0.06) * vf * cpu.speed;
          data.measurements.push({
            sessionId: id, version: v.version, toolVersion: `${l.spec.name} ${v.version} (fixture)`, variant: variant.id,
            problem: p.spec.id, buildCommand: variant.build, runCommand: variant.run, sourceHash: "fixture", correct: true,
            hyperfine: { ...mk(t, 30), memory: Array(30).fill(Math.round(10e6 * (1 + rnd()))) },
          });
        }
      }
    }
  });
  fs.writeFileSync(path.join(out, `${l.spec.id}.json`), JSON.stringify(data));
}
console.log("fixtures written to", out);
