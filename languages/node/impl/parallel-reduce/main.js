"use strict";
const { Worker, isMainThread, parentPort, workerData } = require("node:worker_threads");

function isPrime(n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

if (isMainThread) {
  const n = parseInt(process.argv[2], 10);
  const workers = parseInt(process.argv[3], 10);
  let total = 0;
  let done = 0;
  for (let t = 0; t < workers; t++) {
    const w = new Worker(__filename, { workerData: { n, workers, t } });
    w.on("message", (c) => {
      total += c;
      if (++done === workers) console.log(`primes=${total}`);
    });
    w.on("error", (e) => {
      console.error(e);
      process.exit(1);
    });
  }
} else {
  const { n, workers, t } = workerData;
  let count = 0;
  for (let i = t; i < n; i += workers) if (isPrime(i)) count++;
  parentPort.postMessage(count);
}
