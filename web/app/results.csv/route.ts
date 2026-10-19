import { getModel, toCell } from "@/lib/model";

export const dynamic = "force-static";

const esc = (v: string | number | null) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Every benchmark with its machine-corrected result: the aggregated table behind the site. Raw repetitions live in data/sessions. */
export function GET() {
  const m = getModel();
  const head = ["language", "version", "build", "problem", "seconds", "seconds_ci_low", "seconds_ci_high", "index_vs_fastest", "time_basis", "cold_seconds", "end_to_end_seconds", "memory_mb", "peak_memory_mb", "binary_bytes", "sessions", "provisional", "flags"];
  const rows = [...m.byId.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((b) => {
      const c = toCell(m, b);
      return [b.language, b.version, b.variant, b.problem, c.seconds, c.secondsLow, c.secondsHigh, c.index, c.metric === "warm" ? "kernel_warm" : "end_to_end", c.by.cold?.seconds ?? null, c.by.e2e?.seconds ?? null, c.memoryMB, c.peakMB || null, c.binarySize, c.sessions, c.provisional, c.flags.join(" ")];
    });
  const body = [head, ...rows].map((r) => r.map((x) => esc(typeof x === "number" ? +x.toPrecision(6) : (x as string | null))).join(",")).join("\n") + "\n";
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8" } });
}
