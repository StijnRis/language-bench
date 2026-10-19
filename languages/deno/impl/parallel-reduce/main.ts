function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

let n = 2000000, workers = 4;
export const setup = (args: string[]) => {
  if (args.length > 1) {
    n = parseInt(args[0], 10);
    workers = parseInt(args[1], 10);
  }
};
export const decode = () => null;
// one module Worker (this same file) per share, started inside the timed region
export const solve = () =>
  Promise.all(
    Array.from({ length: workers }, (_, t) =>
      new Promise<number>((resolve, reject) => {
        const w = new Worker(import.meta.url, { type: "module" });
        w.onmessage = (e: MessageEvent<number>) => {
          resolve(e.data);
          w.terminate();
        };
        w.onerror = (e) => reject(e);
        w.postMessage({ n, workers, t });
      })),
  ).then((parts) => [parts.reduce((a, b) => a + b, 0)]);
export const emit = (r: number[]) => r;

// when this file is loaded as a worker it computes one share
if (typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope) {
  self.onmessage = (e: MessageEvent<{ n: number; workers: number; t: number }>) => {
    const { n, workers, t } = e.data;
    let count = 0;
    for (let i = t; i < n; i += workers) if (isPrime(i)) count++;
    self.postMessage(count);
  };
}
