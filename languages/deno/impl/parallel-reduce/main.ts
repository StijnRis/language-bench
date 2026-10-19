function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

// One module serves as both the main thread and the worker (a module Worker of the same file).
if (typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope) {
  self.onmessage = (e: MessageEvent<{ n: number; workers: number; t: number }>) => {
    const { n, workers, t } = e.data;
    let count = 0;
    for (let i = t; i < n; i += workers) if (isPrime(i)) count++;
    self.postMessage(count);
    self.close();
  };
} else {
  const n = parseInt(Deno.args[0], 10);
  const workers = parseInt(Deno.args[1], 10);
  const parts = await Promise.all(
    Array.from({ length: workers }, (_, t) =>
      new Promise<number>((resolve, reject) => {
        const w = new Worker(import.meta.url, { type: "module" });
        w.onmessage = (e: MessageEvent<number>) => resolve(e.data);
        w.onerror = (e) => reject(e);
        w.postMessage({ n, workers, t });
      })),
  );
  console.log(`primes=${parts.reduce((a, b) => a + b, 0)}`);
}
