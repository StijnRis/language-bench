import { describe, expect, it } from "vitest";
import { aggregateSessions, fitHardware, geoMean, mad, median, mulberry32, summarizeReps } from "./stats";
import { analyze } from "./analysis";
import { planSessions, type Candidate, type Counts } from "./plan";
import type { Config, LanguageData, Session } from "./schema";

describe("basic stats", () => {
  it("median/mad", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(mad([1, 1, 2, 2, 4, 6, 9])).toBe(1);
  });
  it("geoMean", () => expect(geoMean([1, 100])).toBeCloseTo(10));
  it("flags but keeps outliers", () => {
    const s = summarizeReps([1, 1.01, 0.99, 1, 1.02, 0.98, 1, 5]);
    expect(s.n).toBe(8);
    expect(s.outliers).toEqual([7]);
  });
});

/** True benchmark times (average machine) and per-session machine factors. */
function world(nBench: number, nSess: number, seed = 3) {
  const rnd = mulberry32(seed);
  const truth = Array.from({ length: nBench }, () => Math.exp(Math.log(0.05) + rnd() * 6));
  const hw = Array.from({ length: nSess }, () => 0.6 + rnd() * 1.2);
  const gm = Math.exp(hw.reduce((a, x) => a + Math.log(x), 0) / nSess);
  return { truth, hw: hw.map((x) => x / gm), rnd };
}

describe("fitHardware", () => {
  it("recovers machine factors from benchmarks shared between sessions", () => {
    const { truth, hw, rnd } = world(12, 5);
    const obs = [];
    for (let s = 0; s < 5; s++)
      for (let b = 0; b < 12; b++)
        if ((b + s) % 3 !== 0) obs.push({ bench: `b${b}`, session: `s${s}`, y: Math.log(truth[b]! * hw[s]! * (1 + (rnd() - 0.5) * 0.02)) });
    const fit = fitHardware(obs);
    for (let s = 0; s < 5; s++) expect(Math.exp(fit.h.get(`s${s}`)!)).toBeCloseTo(hw[s]!, 1);
    expect(new Set(fit.component.values()).size).toBe(1);
  });
  it("keeps unconnected groups apart", () => {
    const fit = fitHardware([
      { bench: "a", session: "s1", y: 0 },
      { bench: "b", session: "s2", y: 1 },
    ]);
    expect(new Set(fit.component.values()).size).toBe(2);
  });
});

describe("aggregateSessions", () => {
  it("is deterministic and brackets the score", () => {
    const samples = [0, 0.2, -0.1].map((f) => ({ reps: Array.from({ length: 20 }, (_, i) => Math.exp(f) * (1 + i * 0.001)), logFactor: f }));
    const a = aggregateSessions(samples, "x");
    expect(a.score).toBeCloseTo(1.01, 1);
    expect(a.ciLow).toBeLessThanOrEqual(a.score);
    expect(a.ciHigh).toBeGreaterThanOrEqual(a.score);
    expect(a.rawSpread).toBeGreaterThan(a.adjustedSpread);
    expect(aggregateSessions(samples, "x").ciLow).toBe(a.ciLow);
  });
});

describe("environment effect", () => {
  it("learns a workload-specific OS effect shared by all sessions of that OS", () => {
    const rnd = mulberry32(5);
    const obs: { bench: string; session: string; y: number; env: string; group: string }[] = [];
    // sessions s0..s3 on os A, s4..s7 on os B; os B is 30% slower for group "io" only
    for (let s = 0; s < 8; s++) {
      const env = s < 4 ? "A" : "B";
      for (let b = 0; b < 10; b++) {
        const group = b < 5 ? "cpu" : "io";
        const bump = env === "B" && group === "io" ? Math.log(1.3) : 0;
        obs.push({ bench: `b${b}`, session: `s${s}`, env, group, y: Math.log(1 + b) + 0.1 * s + bump + (rnd() - 0.5) * 0.002 });
      }
    }
    const fit = fitHardware(obs);
    const d = (e: string, g: string) => fit.envEffect.get(`${e}|${g}`)!;
    // the general shift of OS B is carried by the machine factors; d holds the workload-specific rest
    const contrast = d("B", "io") - d("A", "io") - (d("B", "cpu") - d("A", "cpu"));
    expect(contrast).toBeGreaterThan(Math.log(1.3) * 0.8);
    expect(contrast).toBeLessThan(Math.log(1.3) * 1.05);
  });
  it("has no effect with a single environment", () => {
    const fit = fitHardware([
      { bench: "a", session: "s1", y: 0, env: "A", group: "g" },
      { bench: "a", session: "s2", y: 1, env: "A", group: "g" },
    ]);
    expect(fit.envEffect.get("A|g")).toBeCloseTo(0, 9);
  });
});

const cfg: Config = {
  targetSessionsPerBenchmark: 3, maxBenchmarksPerSession: 10, sessionsPerRound: 2, overlapFraction: 0.3, minOverlap: 2,
  trackedVersionsPerLanguage: 1, maxAttempts: 3, sessionTimeBudgetMinutes: 60, repetitions: { min: 5, max: 10 },
  budgetSecondsScale: 1, warmupRuns: 1, maxChainedRounds: 10,
};
const cands: Candidate[] = Array.from({ length: 30 }, (_, i) => ({ key: `k${i}`, language: "c", version: "1", variant: "v", problem: `p${i}` }));

describe("planSessions", () => {
  it("never repeats a benchmark in a session and picks the least measured first", () => {
    const counts = new Map<string, Counts>(cands.slice(0, 20).map((c, i) => [c.key, { ok: i < 10 ? 2 : 1, failed: 0 }]));
    const plan = planSessions(cands, counts, cfg, "seed");
    for (const s of plan.sessions) {
      expect(new Set(s.map((p) => p.key)).size).toBe(s.length);
      expect(s.length).toBeLessThanOrEqual(10);
      // fresh picks are the never-measured ones first
      expect(s.filter((p) => p.reason === "new").length).toBeGreaterThan(0);
    }
    const fresh = plan.sessions.flatMap((s) => s.filter((p) => p.reason !== "overlap").map((p) => p.key));
    expect(new Set(fresh).size).toBe(fresh.length); // disjoint between parallel sessions
    expect(plan.sessions[0]!.some((p) => p.reason === "overlap")).toBe(true);
  });
  it("plans nothing when every benchmark is sufficient", () => {
    const counts = new Map<string, Counts>(cands.map((c) => [c.key, { ok: 3, failed: 0 }]));
    expect(planSessions(cands, counts, cfg, "s").sessions).toHaveLength(0);
  });
  it("gives up on repeatedly failing benchmarks", () => {
    const counts = new Map<string, Counts>(cands.map((c) => [c.key, { ok: 3, failed: 0 }]));
    counts.set("k0", { ok: 0, failed: 3 });
    expect(planSessions(cands, counts, cfg, "s").remaining).toBe(0);
  });
});

describe("analyze", () => {
  it("builds hardware-corrected benchmarks from sessions and measurements", () => {
    const runs = (t: number) => ({ wall: [t, t, t], cpu: [t, t, t], user: [t, t, t], system: [0, 0, 0], memory: [1e6, 1e6, 1e6], exit: [0, 0, 0] });
    const mkSession = (id: string): Session => ({
      id, startedAt: "2026-01-01T00:00:00Z", finishedAt: "2026-01-01T01:00:00Z", durationSeconds: 3600, repoCommit: "abc", trigger: {}, runner: {},
      host: { cpu: { model: "X", cores: 4 } }, tooling: {}, containers: {}, config: {}, plan: [], order: [], skipped: [],
    });
    const m = (sessionId: string, problem: string, t: number): LanguageData["measurements"][number] => ({
      sessionId, language: "c", version: "1", toolVersion: "gcc", variant: "v", variantSpec: {}, problem, args: [], containerImage: "gcc:1",
      sourceFile: "main.c", sourceHash: "h", runCommand: "x", status: "ok", correct: true, startedAt: "", finishedAt: "", runs: runs(t),
    });
    // machine B is exactly 2x slower than A; benchmark "shared" ran on both
    const a = analyze(
      { A: mkSession("A"), B: mkSession("B") },
      [{ language: "c", measurements: [m("A", "shared", 1), m("B", "shared", 2), m("A", "onlyA", 4), m("B", "onlyB", 6)] }],
      50,
    );
    const by = (p: string) => a.benchmarks.find((b) => b.problem === p)!;
    expect(a.machineFactors.get("B")! / a.machineFactors.get("A")!).toBeCloseTo(2, 5);
    // on the average machine (sqrt(2) slower than A): shared = 1*sqrt2, onlyA = 4*sqrt2, onlyB = 3*sqrt2
    expect(by("shared").refSeconds).toBeCloseTo(Math.SQRT2, 3);
    expect(by("onlyA").refSeconds).toBeCloseTo(4 * Math.SQRT2, 3);
    expect(by("onlyB").refSeconds).toBeCloseTo(3 * Math.SQRT2, 3);
    expect(by("shared").linked).toBe(true);
  });
});
