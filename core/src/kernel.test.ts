import { describe, expect, it } from "vitest";
import { alignMemory, contractViolations, kernelFlags, parseHarness, warmDurations } from "./kernel";

const sample = `LB 1 clock=CLOCK_MONOTONIC
START mono=1000 wall=5000000
ITER 1 t0=2000 t1=4000 check=1:2
ITER 2 t0=6000 t1=7000 check=3:4
DONE iters=2 kernel_ns=3000 reason=budget
`;

describe("parseHarness", () => {
  it("reads the contract lines", () => {
    const o = parseHarness(sample);
    expect(o.clock).toBe("CLOCK_MONOTONIC");
    expect(o.mono0).toBe(1000);
    expect(o.iterations.map((i) => i.check)).toEqual(["1:2", "3:4"]);
    expect(o.done).toEqual({ iters: 2, kernelNs: 3000, reason: "budget" });
  });
});

describe("contractViolations", () => {
  const opts = { minIterations: 2, budgetSeconds: 3e-6 };
  it("accepts a conforming output", () => expect(contractViolations(parseHarness(sample), opts)).toEqual([]));
  it("finds a backwards timestamp, a short run and a wrong count", () => {
    const bad = sample.replace("t0=6000 t1=7000", "t0=3000 t1=3500").replace("iters=2", "iters=3");
    const v = contractViolations(parseHarness(bad), opts);
    expect(v.some((x) => x.includes("backwards"))).toBe(true);
    expect(v.some((x) => x.includes("DONE says 3"))).toBe(true);
  });
  it("checks the iteration limit", () => expect(contractViolations(parseHarness(sample), { ...opts, maxIterations: 1 })).toEqual(["ran 2 iterations, LB_MAX_ITERS was 1"]));
});

describe("alignMemory", () => {
  it("weights samples by the time they cover inside the timed regions", () => {
    const o = parseHarness(sample);
    // regions on the wall clock: [5001000, 5003000] and [5005000, 5006000]
    const mem = alignMemory(o, [
      { wallNs: 5000000, bytes: 100 },
      { wallNs: 5002000, bytes: 300 }, // from 5002000 on
      { wallNs: 5004000, bytes: 1000 }, // only between the regions
      { wallNs: 5005500, bytes: 500 },
    ])!;
    // region 1: 1000ns@100 + 1000ns@300 = 400000; region 2: 500ns@1000 + 500ns@500 = 750000; total 3000ns
    expect(mem.avgBytes).toBeCloseTo((100 * 1000 + 300 * 1000 + 1000 * 500 + 500 * 500) / 3000, 6);
    expect(mem.peakBytes).toBe(1000);
  });
  it("returns nothing without samples", () => expect(alignMemory(parseHarness(sample), [])).toBeUndefined());
});

describe("warmDurations", () => {
  it("drops the iterations that start within the warm-up window", () => {
    expect(warmDurations([1, 1, 1, 1, 1], 2)).toEqual([1, 1, 1]);
  });
  it("throws when no iteration is warm instead of guessing", () => {
    expect(() => warmDurations([5, 4, 3], 100)).toThrow(/no iteration starts after the first 100 s/);
  });
});

describe("kernelFlags", () => {
  it("flags suspiciously fast iterations and unstable warm-up", () => {
    const base = { iterations: 12, checked: 12, matched: 12 };
    expect(kernelFlags({ ...base, durations: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.001] }, 0)).toContain("near-zero-iteration");
    expect(kernelFlags({ ...base, durations: [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2] }, 0)).toContain("warmup-unstable");
    expect(kernelFlags({ ...base, matched: 11, durations: Array(12).fill(1) }, 0)).toEqual(["checksum-mismatch"]);
  });
});
