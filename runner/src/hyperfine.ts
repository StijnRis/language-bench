import fs from "node:fs";
import type { HyperfineRaw } from "@lb/core";
import type { Container } from "./docker";

interface Hf2Measurement {
  time_wall_clock: { value: number };
  time_user?: { value: number };
  time_system?: { value: number };
  memory_peak_resident?: { value: number };
  exit_code?: number | null;
}

/** Parse hyperfine >= 2.0 `--export-json` (schema_version 2) into the raw arrays we store. */
export function parseHyperfine(json: any): HyperfineRaw {
  if (json.schema_version !== 2) throw new Error(`unsupported hyperfine JSON schema ${json.schema_version}`);
  const ms: Hf2Measurement[] = json.results[0].measurements;
  const round = (x: number) => Math.round(x * 1e7) / 1e7; // 0.1 microsecond
  return {
    times: ms.map((m) => round(m.time_wall_clock.value)),
    memory: ms.map((m) => Math.round(m.memory_peak_resident?.value ?? 0)),
    user: ms.map((m) => round(m.time_user?.value ?? 0)),
    system: ms.map((m) => round(m.time_system?.value ?? 0)),
    exitCodes: ms.map((m) => m.exit_code ?? 0),
  };
}

export function runHyperfine(
  c: Container,
  workDir: string,
  command: string,
  runs: number,
  warmup = 1,
): HyperfineRaw {
  const out = `hf-${Date.now()}.json`;
  const r = c.exec(
    `hyperfine --runs ${runs} --warmup ${warmup} --export-json /work/${out} --style basic '${command.replace(/'/g, "'\\''")}'`,
  );
  if (r.code !== 0) throw new Error(`hyperfine failed (${r.code}): ${r.stderr}\n${r.stdout}`);
  const file = `${workDir}/${out}`;
  const raw = parseHyperfine(JSON.parse(fs.readFileSync(file, "utf8")));
  fs.rmSync(file);
  return raw;
}
