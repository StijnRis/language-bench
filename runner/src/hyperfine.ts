import fs from "node:fs";
import { runsFromHyperfine, type Runs } from "@lb/core";
import type { Container } from "./docker";

const envPrefix = (env: Record<string, string>) => Object.entries(env).map(([k, v]) => `${k}=${v}`).join(" ");
const quote = (s: string) => `'${s.replace(/'/g, "'\\''")}'`;

/**
 * End-to-end timing: runs hyperfine (>= 2.0) on a command and returns the per-run measurements of its
 * `--export-json` output as columns: wall-clock, CPU/user/system time, peak resident memory and exit code.
 * Hyperfine's own summary (mean, stddev, ...) is derived from these and not kept. `stdinFile` (a path inside
 * the container) becomes the standard input of every run.
 */
export function runHyperfine(
  c: Container,
  workDir: string,
  command: string,
  env: Record<string, string>,
  runs: number,
  warmup: number,
  stdinFile?: string,
): { runs: Runs; args: string } {
  if (!c.hasHyperfine) return runManually(c, command, env, runs, warmup, stdinFile);
  const out = `hf-${Date.now()}.json`;
  // hyperfine refuses a command that starts with VAR=value, so the environment goes through --env
  const args = `--runs ${runs} --warmup ${warmup} --style basic --env ${quote(envPrefix(env))}${stdinFile ? ` --input ${stdinFile}` : ""}`;
  const r = c.exec(`hyperfine ${args} --export-json /work/${out} ${quote(command)}`);
  if (r.code !== 0) throw new Error(`hyperfine failed (${r.code}): ${r.stderr}\n${r.stdout}`);
  const file = `${workDir}/${out}`;
  const hf = JSON.parse(fs.readFileSync(file, "utf8"));
  fs.rmSync(file);
  if (!hf?.results?.[0]?.measurements?.length) throw new Error("hyperfine export has no measurements");
  return { runs: runsFromHyperfine(hf), args };
}

/** Development fallback (LB_LOCAL without hyperfine): wall-clock of plain runs, no CPU or memory columns. */
function runManually(c: Container, command: string, env: Record<string, string>, runs: number, warmup: number, stdinFile?: string) {
  const cmd = `${envPrefix(env)} ${command}${stdinFile ? ` < ${stdinFile}` : ""}`;
  const wall: number[] = [], exit: number[] = [];
  for (let i = 0; i < warmup + runs; i++) {
    const r = c.exec(cmd);
    if (i < warmup) continue;
    wall.push(r.ms / 1000);
    exit.push(r.code);
  }
  const zeros = wall.map(() => 0);
  return { runs: { wall, cpu: zeros, user: zeros, system: zeros, memory: zeros, exit }, args: `manual: ${runs} runs, ${warmup} warm-up` };
}
