// language-bench harness for Deno (TypeScript): see harness/CONTRACT.md.
// usage: deno run -A harness.ts <problem.ts> [problem arguments]
// The problem module exports setup(args), decode(bytes), solve(instance) (may return a Promise),
// emit(result) -> array-like of integers (the canonical result words) and optionally release(instance, result).
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// deno-lint-ignore no-explicit-any
const problem: any = await import(pathToFileURL(resolve(Deno.args[0])).href);

const env = (k: string, d: string) => Deno.env.get(k) || d;
const num = (k: string, d: number) => {
  const v = Deno.env.get(k);
  return v && !Number.isNaN(Number(v)) ? Number(v) : d;
};
const mono = () => Number(process.hrtime.bigint());

function readFull(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  let off = 0;
  while (off < n) {
    const k = Deno.stdin.readSync(buf.subarray(off));
    if (k === null || k === 0) {
      console.error("harness: input ended early");
      Deno.exit(1);
    }
    off += k;
  }
  return buf;
}

const input = env("LB_INPUT", "none");
const budget = num("LB_BUDGET_SECONDS", 10) * 1e9;
const minIters = num("LB_MIN_ITERS", 3);
const maxIters = num("LB_MAX_ITERS", 0);
const start = num("LB_START", 0);
const gen = env("LB_GEN", "/usr/local/bin/lbgen");
const file = env("LB_FILE", "/dev/shm/lb-input");
const pname = env("LB_PROBLEM", "");
const fileReady = Deno.env.get("LB_FILE_READY") !== undefined;
const P1 = 2147483647, P2 = 2147483629;

problem.setup(Deno.args.slice(1));
const rows: number[][] = [];
let kernel = 0;
const mono0 = mono(), wall0 = Date.now() * 1e6;
let reason = "budget";

for (;;) {
  let data: Uint8Array;
  if (input === "stream") {
    const hdr = readFull(8);
    data = readFull(Number(new DataView(hdr.buffer).getBigUint64(0, true)));
  } else if (input === "file") {
    if (!fileReady) {
      const r = new Deno.Command(gen, { args: ["file", pname, String(start + rows.length), file], stdout: "inherit", stderr: "inherit" }).outputSync();
      if (!r.success) {
        console.error("harness: generator failed");
        Deno.exit(1);
      }
    }
    data = new TextEncoder().encode(file);
  } else {
    data = new Uint8Array(0);
  }
  let inst = problem.decode(data);
  const t0 = mono();
  let res = await problem.solve(inst);
  const t1 = mono();
  let h1 = 17, h2 = 19;
  const words = problem.emit(res);
  const n = words.length;
  for (let i = 0; i < n; i++) {
    const w = words[i];
    let m1 = w % P1;
    if (m1 < 0) m1 += P1;
    let m2 = w % P2;
    if (m2 < 0) m2 += P2;
    h1 = (h1 * 1000003 + m1) % P1;
    h2 = (h2 * 999983 + m2) % P2;
  }
  h1 = (h1 * 1000003 + (n % P1)) % P1;
  h2 = (h2 * 999983 + (n % P2)) % P2;
  if (problem.release) problem.release(inst, res);
  inst = res = null;
  if (input === "file" && !fileReady) {
    try {
      Deno.removeSync(file);
    } catch (_) { /* already gone */ }
  }
  rows.push([t0, t1, h1, h2]);
  kernel += t1 - t0;
  if (maxIters && rows.length >= maxIters) {
    reason = "iters";
    break;
  }
  if (kernel >= budget && rows.length >= minIters) break;
}

const out = ["LB 1 clock=process.hrtime", `START mono=${mono0} wall=${wall0}`];
rows.forEach((r, i) => out.push(`ITER ${i + 1} t0=${r[0]} t1=${r[1]} check=${r[2]}:${r[3]}`));
out.push(`DONE iters=${rows.length} kernel_ns=${kernel} reason=${reason}`);
Deno.stdout.writeSync(new TextEncoder().encode(out.join("\n") + "\n"));
Deno.exit(0);
