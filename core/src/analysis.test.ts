import { describe, expect, it } from "vitest";
import { analyze, indexVs, repsOf } from "./analysis";
import type { LanguageData, Measurement, Session } from "./schema";

const session = (id: string): Session =>
  ({
    id, startedAt: `2026-01-0${id.slice(1)}T00:00:00Z`, finishedAt: "", durationSeconds: 1, repoCommit: "x", trigger: {}, runner: { ImageOS: "ubuntu24" },
    host: { cpu: { model: "cpu", cores: 4 }, arch: "x64" }, tooling: {}, containers: {}, config: { kernel: { warmupSeconds: 1 } }, plan: [], order: [], skipped: [],
  }) as unknown as Session;

const meas = (sessionId: string, language: string, durations: number[] | undefined, wall: number[]): Measurement =>
  ({
    sessionId, language, version: "1", toolVersion: "1", variant: "v", variantSpec: {}, problem: "p", args: [], containerImage: "i", sourceFile: "m", sourceHash: "h",
    runCommand: "r", status: "ok", correct: true, startedAt: "", finishedAt: "",
    runs: { wall, cpu: wall, user: wall, system: wall, memory: wall.map(() => 1e6), exit: wall.map(() => 0) },
    kernel: durations && { clock: "c", budgetSeconds: 10, iterations: durations.length, kernelSeconds: 1, reason: "budget", durations, starts: [], checked: 1, matched: 1, flags: [], memory: { avgBytes: 5e6, peakBytes: 9e6, runAvgBytes: 4e6, samples: 10 } },
  }) as unknown as Measurement;

describe("metrics", () => {
  const warm = [1, ...Array(30).fill(0.1)]; // first iteration (cold) is 10x slower
  it("warm drops the warm-up, cold is the first iteration", () => {
    const m = meas("s1", "a", warm, [2]);
    expect(repsOf(m, "cold", 1)).toEqual([1]);
    expect(repsOf(m, "e2e", 1)).toEqual([2]);
    const w = repsOf(m, "warm", 1)!;
    expect(w.every((x) => x === 0.1)).toBe(true);
  });
  it("analyses kernel data under every metric and falls back to end-to-end without it", () => {
    const sessions = { s1: session("s1"), s2: session("s2"), s3: session("s3") };
    const a: LanguageData = { language: "a", measurements: ["s1", "s2", "s3"].map((s) => meas(s, "a", warm, [2, 2.1])) } as LanguageData;
    const b: LanguageData = { language: "b", measurements: ["s1", "s2", "s3"].map((s) => meas(s, "b", undefined, [1, 1.1])) } as LanguageData;
    const an = analyze(sessions, [a, b], 50);
    const ra = an.benchmarks.find((x) => x.language === "a")!;
    const rb = an.benchmarks.find((x) => x.language === "b")!;
    expect(ra.metric).toBe("warm");
    expect(ra.refSeconds).toBeCloseTo(0.1, 6);
    expect(ra.byMetric.cold!.score).toBeCloseTo(1, 6);
    expect(ra.byMetric.e2e!.score).toBeGreaterThan(1.9);
    expect(ra.memoryBytes).toBe(5e6);
    expect(ra.peakBytes).toBe(9e6);
    expect(rb.metric).toBe("e2e");
    expect(rb.byMetric.warm).toBeUndefined();
    expect(indexVs(an, ra, ra).index).toBe(1);
  });
});
