import { describe, expect, it } from "vitest";
import { aggregateSessions, geoMean, mad, median, mulberry32, summarizeReps } from "./stats";
import { analyze } from "./analysis";
import type { LanguageData } from "./schema";

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

/** Synthetic world: a benchmark takes `trueRatio` x the anchor on every machine. Machines differ in speed. */
function synth(sessions: number, trueRatio: number, seed = 1) {
  const rnd = mulberry32(seed);
  const noise = (sd: number) => 1 + (rnd() - 0.5) * 2 * sd;
  const out = [];
  for (let i = 0; i < sessions; i++) {
    const hw = 0.6 + rnd() * 1.2; // machine slowness factor 0.6..1.8
    const anchor = Array.from({ length: 30 }, () => 0.5 * hw * noise(0.02));
    const reps = Array.from({ length: 30 }, () => 0.5 * trueRatio * hw * noise(0.02));
    out.push({ reps, anchorReps: anchor });
  }
  return out;
}

describe("aggregateSessions", () => {
  it("recovers the true ratio despite very different hardware", () => {
    const agg = aggregateSessions(synth(12, 3.0), "t");
    expect(agg.score).toBeGreaterThan(2.95);
    expect(agg.score).toBeLessThan(3.05);
    expect(agg.ciLow).toBeLessThanOrEqual(agg.score);
    expect(agg.ciHigh).toBeGreaterThanOrEqual(agg.score);
    expect(agg.icc).toBeLessThan(0.5);
  });
  it("raw (un-normalised) values would be far off, proving normalisation matters", () => {
    const s = synth(12, 3.0);
    const raw = s.map((x) => median(x.reps));
    expect(Math.max(...raw) / Math.min(...raw)).toBeGreaterThan(1.5);
  });
  it("is deterministic", () => {
    expect(aggregateSessions(synth(5, 2), "x").ciLow).toBe(aggregateSessions(synth(5, 2), "x").ciLow);
  });
});

describe("analyze", () => {
  it("builds benchmarks from data files", () => {
    const hf = (t: number) => ({ times: [t, t, t], memory: [1e6, 1e6, 1e6], exitCodes: [0, 0, 0] });
    const data: LanguageData = {
      schemaVersion: 1,
      language: "c",
      sessions: {
        s1: {
          date: "2026-01-01T00:00:00Z",
          repoCommit: "abc",
          image: "gcc:14",
          hyperfineVersion: "1.19.0",
          hardware: { cpuModel: "X", cores: 4, ramBytes: 1, arch: "x86_64" },
          kernel: "6",
          anchorSpec: "a",
          anchors: [{ at: "start", hyperfine: hf(1) }],
        },
      },
      measurements: [
        {
          sessionId: "s1",
          version: "14",
          toolVersion: "gcc 14",
          variant: "o3",
          problem: "nbody",
          runCommand: "x",
          sourceHash: "h",
          correct: true,
          hyperfine: hf(2),
        },
      ],
    };
    const a = analyze([data], 50);
    expect(a.benchmarks).toHaveLength(1);
    expect(a.benchmarks[0]!.agg.score).toBeCloseTo(2);
    expect(a.benchmarks[0]!.refSeconds).toBeCloseTo(2);
  });
});
