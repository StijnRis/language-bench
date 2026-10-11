import fs from "node:fs";
import { HyperfineExportSchema, type HyperfineExport } from "@lb/core";
import type { Container } from "./docker";

/**
 * Runs hyperfine (>= 2.0) and returns its `--export-json` output UNCHANGED: per-run wall-clock,
 * user/system CPU time, peak resident memory and exit code, plus hyperfine's own summary.
 */
export function runHyperfine(
  c: Container,
  workDir: string,
  command: string,
  runs: number,
  warmup: number,
): { json: HyperfineExport; args: string } {
  const out = `hf-${Date.now()}.json`;
  const args = `--runs ${runs} --warmup ${warmup} --style basic`;
  const r = c.exec(`hyperfine ${args} --export-json /work/${out} '${command.replace(/'/g, "'\\''")}'`);
  if (r.code !== 0) throw new Error(`hyperfine failed (${r.code}): ${r.stderr}\n${r.stdout}`);
  const file = `${workDir}/${out}`;
  const json = HyperfineExportSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  fs.rmSync(file);
  return { json, args };
}
