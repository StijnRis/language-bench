import path from "node:path";
import { findRepoRoot } from "@lb/core/discover";

export const ROOT = findRepoRoot(import.meta.dirname);
export const WORK = path.join(ROOT, ".work");
export const CACHE = path.join(ROOT, ".cache");

/** hyperfine >= 2.0 exports per-run peak memory (memory_peak_resident) natively. */
export const HYPERFINE_VERSION = "2.0.0";

/**
 * The hardware anchor: a frozen C program run on every VM in every session. Every measurement is
 * divided by the anchor's median in the same session, so differently fast machines become comparable.
 */
export const ANCHOR = {
  image: "gcc:14",
  source: "runner/anchor/anchor.c",
  build: "gcc -O2 -ffp-contract=off -o /work/anchor/anchor /repo/runner/anchor/anchor.c -lm",
  run: "/work/anchor/anchor",
  runs: 30,
  spec: "gcc:14, gcc -O2 -ffp-contract=off, runner/anchor/anchor.c (5-body float kernel), 30 runs at start, middle and end of a session",
};
