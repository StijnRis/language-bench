import { ImageResponse } from "next/og";
import { idx } from "@/lib/fmt";
import { compositeIndex, getModel, latestVersion, snapshotCells } from "@/lib/model";

export const dynamic = "force-static";

const COLORS: Record<string, string> = { c: "#8b97ad", rust: "#f26a1b", go: "#14b8d4", node: "#6cc24a", python: "#f2c200" };

export async function GET() {
  const m = getModel();
  const cells = snapshotCells(m);
  const rows = m.languages
    .map((l) => ({ id: l.spec.id, name: l.spec.name, version: latestVersion(l), value: compositeIndex(cells.filter((c) => c.language === l.spec.id && m.problems.find((p) => p.spec.id === c.problem)?.spec.scored)) }))
    .filter((r) => isFinite(r.value))
    .sort((a, b) => a.value - b.value);
  if (rows.length) { const best = rows[0]!.value; for (const r of rows) r.value /= best; }
  const max = Math.max(...rows.map((r) => r.value), 1);
  const W = 1200, H = 630, labelW = 340, valueW = 140, barMax = W - 2 * 64 - labelW - valueW;
  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", padding: 56, background: "#101216", color: "#e7e9ee", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 46, fontWeight: 800 }}>How fast is each programming language?</div>
        <div style={{ display: "flex", fontSize: 24, color: "#9aa3b2", marginTop: 8 }}>
          Speed index across {m.problems.filter((p) => p.spec.scored).length} workloads (fastest language = 1.0×, shorter is faster)
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 18 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", width: labelW, fontSize: 34, fontWeight: 700 }}>{r.name}</div>
              <div style={{ display: "flex", width: Math.max(14, (r.value / max) * barMax), height: 44, borderRadius: 8, background: COLORS[r.id] ?? "#6ab0ff" }} />
              <div style={{ display: "flex", marginLeft: 18, fontSize: 34, fontWeight: 700 }}>{idx(r.value)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#9aa3b2" }}>
          <div style={{ display: "flex" }}>{rows.map((r) => `${r.name} ${r.version}`).join(" · ")}</div>
          <div style={{ display: "flex" }}>language-bench</div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
