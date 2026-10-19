"use strict";
// language-bench harness for Node.js (also run by Bun): see harness/CONTRACT.md.
// usage: node harness.js <problem.js> [problem arguments]
// The problem module exports setup(args), decode(buffer), solve(instance) (may return a Promise),
// emit(result) -> array-like of integers (the canonical result words) and optionally release(instance, result).
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const problem = require(path.resolve(process.argv[2]));
const env = (k, d) => (process.env[k] ? process.env[k] : d);
const num = (k, d) => (process.env[k] && !Number.isNaN(Number(process.env[k])) ? Number(process.env[k]) : d);
const mono = () => Number(process.hrtime.bigint());

function readFull(n) {
  const buf = Buffer.allocUnsafeSlow(n);
  let off = 0;
  while (off < n) {
    let k;
    try {
      k = fs.readSync(0, buf, off, n - off, null);
    } catch (e) {
      if (e.code === "EAGAIN") {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1);
        continue;
      }
      if (e.code === "EOF") k = 0;
      else throw e;
    }
    if (k === 0) {
      process.stderr.write("harness: input ended early\n");
      process.exit(1);
    }
    off += k;
  }
  return buf;
}

async function main() {
  const input = env("LB_INPUT", "none");
  const budget = num("LB_BUDGET_SECONDS", 10) * 1e9;
  const minIters = num("LB_MIN_ITERS", 3);
  const maxIters = num("LB_MAX_ITERS", 0);
  const start = num("LB_START", 0);
  const gen = env("LB_GEN", "/usr/local/bin/lbgen");
  const file = env("LB_FILE", "/dev/shm/lb-input");
  const pname = env("LB_PROBLEM", "");
  const fileReady = process.env.LB_FILE_READY !== undefined;
  const P1 = 2147483647, P2 = 2147483629;

  problem.setup(process.argv.slice(3));
  const rows = [];
  let kernel = 0;
  const mono0 = mono(), wall0 = Date.now() * 1e6;
  let reason = "budget";

  for (;;) {
    let data;
    if (input === "stream") {
      const hdr = readFull(8);
      data = readFull(Number(hdr.readBigUInt64LE(0)));
    } else if (input === "file") {
      if (!fileReady) {
        const r = spawnSync(gen, ["file", pname, String(start + rows.length), file], { stdio: "inherit" });
        if (r.status !== 0) {
          process.stderr.write("harness: generator failed\n");
          process.exit(1);
        }
      }
      data = Buffer.from(file);
    } else {
      data = Buffer.alloc(0);
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
      let m1 = w % P1; if (m1 < 0) m1 += P1;
      let m2 = w % P2; if (m2 < 0) m2 += P2;
      h1 = (h1 * 1000003 + m1) % P1;
      h2 = (h2 * 999983 + m2) % P2;
    }
    h1 = (h1 * 1000003 + (n % P1)) % P1;
    h2 = (h2 * 999983 + (n % P2)) % P2;
    if (problem.release) problem.release(inst, res);
    inst = res = null;
    if (input === "file" && !fileReady) {
      try { fs.unlinkSync(file); } catch (e) { /* already gone */ }
    }
    rows.push([t0, t1, h1, h2]);
    kernel += t1 - t0;
    if (maxIters && rows.length >= maxIters) { reason = "iters"; break; }
    if (kernel >= budget && rows.length >= minIters) break;
  }

  const out = ["LB 1 clock=process.hrtime", `START mono=${mono0} wall=${wall0}`];
  rows.forEach((r, i) => out.push(`ITER ${i + 1} t0=${r[0]} t1=${r[1]} check=${r[2]}:${r[3]}`));
  out.push(`DONE iters=${rows.length} kernel_ns=${kernel} reason=${reason}`);
  fs.writeSync(1, out.join("\n") + "\n");
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
