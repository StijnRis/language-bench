import fs from "node:fs";
import { runsFromHyperfine, type Runs } from "@lb/core";
import type { Container } from "./docker";

/**
 * Runs hyperfine (>= 2.0) and returns the per-run measurements of its `--export-json` output as
 * columns: wall-clock, CPU/user/system time, peak resident memory and exit code. Hyperfine's own
 * summary (mean, stddev, ...) is derived from these and not kept.
 */
export function runHyperfine(
  c: Container,
  workDir: string,
  command: string,
  runs: number,
  warmup: number,
): { runs: Runs; args: string } {
  const out = `hf-${Date.now()}.json`;
  const args = `--runs ${runs} --warmup ${warmup} --style basic`;
  const r = c.exec(`hyperfine ${args} --export-json /work/${out} '${command.replace(/'/g, "'\\''")}'`);
  if (r.code !== 0) throw new Error(`hyperfine failed (${r.code}): ${r.stderr}\n${r.stdout}`);
  const file = `${workDir}/${out}`;
  const hf = JSON.parse(fs.readFileSync(file, "utf8"));
  fs.rmSync(file);
  if (!hf?.results?.[0]?.measurements?.length) throw new Error("hyperfine export has no measurements");
  return { runs: runsFromHyperfine(hf), args };
}
