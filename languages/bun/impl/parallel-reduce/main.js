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
  let n = 2000000, workers = 4;
  exports.setup = (args) => {
    if (args.length > 1) {
      n = parseInt(args[0], 10);
      workers = parseInt(args[1], 10);
    }
  };
  exports.decode = () => null;
  // one Worker per share, started inside the timed region (thread creation is part of the workload)
  exports.solve = () =>
    new Promise((resolve, reject) => {
      let total = 0, done = 0;
      for (let t = 0; t < workers; t++) {
        const w = new Worker(__filename, { workerData: { n, workers, t } });
        w.on("message", (c) => {
          total += c;
          if (++done === workers) resolve([total]);
        });
        w.on("error", reject);
      }
    });
  exports.emit = (r) => r;
} else {
  const { n, workers, t } = workerData;
  let count = 0;
  for (let i = t; i < n; i += workers) if (isPrime(i)) count++;
  parentPort.postMessage(count);
}
