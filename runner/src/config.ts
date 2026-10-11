import path from "node:path";
import { findRepoRoot } from "@lb/core/discover";

export const ROOT = findRepoRoot(import.meta.dirname);
export const WORK = path.join(ROOT, ".work");
export const CACHE = path.join(ROOT, ".cache");

/** hyperfine >= 2.0 exports per-run peak memory (memory_peak_resident) natively. */
export const HYPERFINE_VERSION = "2.0.0";

