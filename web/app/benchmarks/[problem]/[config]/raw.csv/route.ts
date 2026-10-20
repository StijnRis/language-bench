import { benchId, getModel } from "@/lib/model";

export const dynamic = "force-static";

export function generateStaticParams() {
  const bs = [...getModel().byId.values()];
  // output: export rejects an empty list; the placeholder matches the one of the benchmark page
  return bs.length ? bs.map((b) => ({ problem: b.problem, config: `${b.language}--${b.version}--${b.variant}` })) : [{ problem: "none", config: "none" }];
}

/** Every measured value behind one benchmark, exactly as stored in data/sessions: one row per iteration or repetition. */
export async function GET(_: Request, { params }: { params: Promise<{ problem: string; config: string }> }) {
  const { problem, config } = await params;
  const rows = ["session,measurement,number,seconds,start_offset_seconds,cpu_seconds,peak_memory_bytes"];
  for (const x of getModel().measurements) {
    if (x.status !== "ok" || benchId(x) !== `${config}--${problem}`) continue;
    x.kernel?.durations.forEach((d, i) => rows.push([x.sessionId, "kernel_iteration", i + 1, d, x.kernel!.starts[i]!, "", ""].join(",")));
    x.runs?.wall.forEach((w, i) => rows.push([x.sessionId, "end_to_end_run", i + 1, w, "", x.runs!.cpu[i]!, x.runs!.memory[i]!].join(",")));
  }
  return new Response(rows.join("\n") + "\n", { headers: { "content-type": "text/csv; charset=utf-8" } });
}
