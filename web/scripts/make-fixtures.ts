/**
 * DEV ONLY: writes synthetic data to .work/fixtures so the site can be developed before real CI
 * sessions exist. Build with LB_DATA_DIR=.work/fixtures. Never committed, never published.
 */
import fs from "node:fs";
import path from "node:path";
import { mulberry32, type LanguageData, type Session } from "@lb/core";
import { findRepoRoot, loadLanguages, loadProblems } from "@lb/core/discover";

const root = findRepoRoot(import.meta.dirname);
const out = path.join(root, ".work", "fixtures");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const rnd = mulberry32(7);
const noise = (sd: number) => 1 + (rnd() - 0.5) * 2 * sd;
const CPUS = [
  { model: "AMD EPYC 7763 64-Core Processor", speed: 1.0 },
  { model: "Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz", speed: 1.15 },
  { model: "AMD EPYC 9V74 80-Core Processor", speed: 0.8 },
];
const base: Record<string, Record<string, number>> = {
  c: { startup: 0.001, nbody: 0.1, "binary-trees": 0.15, "json-parse": 0.2, hashmap: 0.1, sort: 0.25, "string-ops": 0.08, "parallel-reduce": 0.12, "file-processing": 0.3 },
  rust: { startup: 0.001, nbody: 0.1, "binary-trees": 0.14, "json-parse": 0.18, hashmap: 0.14, sort: 0.1, "string-ops": 0.07, "parallel-reduce": 0.12, "file-processing": 0.35 },
  go: { startup: 0.002, nbody: 0.15, "binary-trees": 0.3, "json-parse": 0.5, hashmap: 0.2, sort: 0.2, "string-ops": 0.1, "parallel-reduce": 0.13, "file-processing": 0.4 },
  node: { startup: 0.04, nbody: 0.14, "binary-trees": 0.4, "json-parse": 0.5, hashmap: 0.25, sort: 0.2, "string-ops": 0.5, "parallel-reduce": 0.2, "file-processing": 0.9 },
  python: { startup: 0.015, nbody: 3.2, "binary-trees": 2.5, "json-parse": 0.5, hashmap: 0.9, sort: 1.1, "string-ops": 0.5, "parallel-reduce": 2.6, "file-processing": 2.6 },
};

const hf = (t: number, mem: number, n: number) => ({
  schema_version: 2,
  results: [{ command: "fixture", measurements: Array.from({ length: n }, () => ({
    time_wall_clock: { value: Math.round(t * noise(0.02) * 1e7) / 1e7, unit: "second" },
    memory_peak_resident: { value: Math.round(mem * noise(0.03)), unit: "byte" }, exit_code: 0 })) }],
});

const langs = loadLanguages(root);
const problems = loadProblems(root);
const sessions: Record<string, Session> = {};
const data = new Map<string, LanguageData>(langs.map((l) => [l.spec.id, { schemaVersion: 2, language: l.spec.id, measurements: [] }]));

type B = { l: (typeof langs)[number]; version: string; variant: (typeof langs)[number]["spec"]["variants"][number]; p: (typeof problems)[number]; age: number };
const all: B[] = [];
for (const l of langs) {
  const versions = Object.keys(l.releases).sort((a, b) => l.releases[a]!.date.localeCompare(l.releases[b]!.date));
  versions.forEach((version, i) => {
    for (const variant of l.spec.variants)
      for (const p of problems) if (fs.existsSync(path.join(l.dir, "impl", p.spec.id))) all.push({ l, version, variant, p, age: versions.length - 1 - i });
  });
}

for (let s = 0; s < 8; s++) {
  const cpu = CPUS[s % CPUS.length]!;
  const speed = cpu.speed * noise(0.1);
  const id = `fixture-session-${s}`;
  const started = new Date(Date.UTC(2026, 8, 1 + s * 3)).toISOString();
  sessions[id] = {
    id, startedAt: started, finishedAt: started, durationSeconds: 3600, repoCommit: "fixture", trigger: {}, runner: {},
    host: { cpu: { model: cpu.model, cores: 4 } }, tooling: { hyperfineVersion: "2.0.0" }, containers: {}, config: {}, plan: [], order: [], skipped: [],
  };
  // each session runs a random ~55% of all benchmarks, always including the first 30 (overlap)
  all.forEach((b, i) => {
    if (i >= 30 && rnd() > 0.55) return;
    const t = (base[b.l.spec.id]?.[b.p.spec.id] ?? 1) * (1 + b.age * 0.06) * (b.variant.default ? 1 : 1.05 + (b.variant.id.length % 3) * 0.04) * speed;
    data.get(b.l.spec.id)!.measurements.push({
      sessionId: id, language: b.l.spec.id, version: b.version, toolVersion: `${b.l.spec.name} ${b.version} (fixture)`, variant: b.variant.id,
      variantSpec: b.variant as never, problem: b.p.spec.id, args: [], containerImage: b.l.spec.image.replace("{version}", b.version), sourceFile: "fixture",
      sourceHash: "fixture", runCommand: b.variant.run, buildCommand: b.variant.build, status: "ok", correct: true, startedAt: started, finishedAt: started,
      hyperfine: hf(t, 10e6 * (1 + rnd()), 12),
    });
  });
}
fs.writeFileSync(path.join(out, "sessions.json"), JSON.stringify({ schemaVersion: 2, sessions }));
for (const [l, d] of data) fs.writeFileSync(path.join(out, `${l}.json`), JSON.stringify(d));
console.log("fixtures written to", out);
