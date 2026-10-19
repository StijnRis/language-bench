/**
 * DEV ONLY: writes synthetic data to .work/fixtures so the site can be developed before real CI
 * sessions exist. Build with LB_DATA_DIR=.work/fixtures. Never committed, never published.
 */
import fs from "node:fs";
import path from "node:path";
import { mulberry32, sessionFilePath, toSessionFile, type Measurement, type Session } from "@lb/core";
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

const runsOf = (t: number, mem: number, n: number) => {
  const col = (f: () => number) => Array.from({ length: n }, f);
  const wall = col(() => Math.round(t * noise(0.02) * 1e7) / 1e7);
  return { wall, cpu: wall, user: wall, system: col(() => 0), memory: col(() => Math.round(mem * noise(0.03))), exit: col(() => 0) };
};

/** Kernel loop of ~10 s: a cold first iteration that decays to the warm time (slower start for managed runtimes). */
const kernelOf = (t: number, mem: number, jit: boolean) => {
  const n = Math.max(3, Math.min(300, Math.ceil(10 / t)));
  const durations = Array.from({ length: n }, (_, i) => Math.round(t * noise(0.03) * (1 + (jit ? 2.5 : 0.3) * Math.exp(-i / 3)) * 1e9) / 1e9);
  let at = 0;
  const starts = durations.map((d) => { const x = at; at += d; return Math.round(x * 1e9) / 1e9; });
  return {
    clock: "fixture", budgetSeconds: 10, iterations: n, kernelSeconds: Math.round(at * 1e9) / 1e9, reason: "budget" as const, durations, starts,
    checked: Math.min(n, 20), matched: Math.min(n, 20),
    memory: { avgBytes: Math.round(mem * noise(0.03)), peakBytes: Math.round(mem * 1.4), runAvgBytes: Math.round(mem * 1.1), samples: Math.round(at * 200) },
    flags: [] as string[],
  };
};

const langs = loadLanguages(root);
const problems = loadProblems(root);
const sessions: Record<string, Session> = {};
const bySession = new Map<string, Measurement[]>();

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
    host: { cpu: { model: cpu.model, cores: 4 } }, tooling: { hyperfineVersion: "2.0.0" }, containers: {}, config: { kernel: { warmupSeconds: 2 } }, plan: [], order: [], skipped: [],
  };
  // each session runs a random ~55% of all benchmarks, always including the first 30 (overlap)
  all.forEach((b, i) => {
    if (i >= 30 && rnd() > 0.55) return;
    const t = (base[b.l.spec.id]?.[b.p.spec.id] ?? 1) * (1 + b.age * 0.06) * (b.variant.default ? 1 : 1.05 + (b.variant.id.length % 3) * 0.04) * speed;
    const kernel = b.p.spec.kind === "kernel";
    const mem = 10e6 * (1 + rnd());
    (bySession.get(id) ?? bySession.set(id, []).get(id)!).push({
      sessionId: id, language: b.l.spec.id, version: b.version, toolVersion: `${b.l.spec.name} ${b.version} (fixture)`, variant: b.variant.id,
      variantSpec: b.variant as never, problem: b.p.spec.id, kind: b.p.spec.kind, args: [], containerImage: b.l.spec.image.replace("{version}", b.version), sourceFile: "fixture",
      sourceHash: "fixture", runCommand: b.variant.run, buildCommand: b.variant.build, status: "ok", correct: true, startedAt: started, finishedAt: started,
      runs: runsOf(kernel ? t * 1.2 + 0.03 : t, mem, 12),
      ...(kernel ? { kernel: kernelOf(t, mem, ["node", "python", "java", "julia"].includes(b.l.spec.id)) } : {}),
    });
  });
}
for (const [id, session] of Object.entries(sessions)) {
  const file = sessionFilePath(out, id);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(toSessionFile(session, bySession.get(id) ?? [])));
}
console.log("fixtures written to", out);
