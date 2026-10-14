/** First field of /proc/loadavg ("0.52 0.31 0.20 1/234 5678"): the 1-minute load average. */
export function parseLoad(s?: string): number | undefined {
  if (!s) return undefined;
  const v = parseFloat(s.trim().split(/\s+/)[0] ?? "");
  return isFinite(v) ? v : undefined;
}

/** Mean 1-minute load per CPU core over the measurements of a session (load measured just before each benchmark). */
export function sessionLoad(ms: { loadAvgBefore?: string }[], cores: number): number | undefined {
  const xs = ms.map((x) => parseLoad(x.loadAvgBefore)).filter((x): x is number => x !== undefined);
  return xs.length && cores > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length / cores : undefined;
}
