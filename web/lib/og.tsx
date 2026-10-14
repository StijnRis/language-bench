import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

/** Social-share card: dark panel, brand mark, big title, subtitle and an optional row of language colour bars. */
export function card(title: string, subtitle: string, bars: { label: string; color: string; value: number }[] = [], extra?: ReactNode) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#0a0d13", color: "#e9ecf2", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 32, color: "#9aa4b6" }}>
          <div style={{ display: "flex", width: 44, height: 44, borderRadius: 10, background: "#16181d", marginRight: 16, alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", width: 24, height: 6, borderRadius: 3, background: "#7aa2ff" }} />
          </div>
          language-bench
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 32, color: "#9aa4b6", marginTop: 20, maxWidth: 1000 }}>{subtitle}</div>
          {extra}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {bars.slice(0, 5).map((b) => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
              <div style={{ display: "flex", width: 170, fontSize: 24, color: "#9aa4b6" }}>{b.label}</div>
              <div style={{ display: "flex", height: 18, width: Math.max(12, b.value * 800), borderRadius: 9, background: b.color }} />
            </div>
          ))}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

import { getModel, pairs, snapshotCells } from "./model";
import { ranking } from "./text";

const BLUE = "#7aa2ff";

/** All share cards: /og/<kind>/<id>.png with kind = site | language | problem | compare. */
export function ogParams() {
  const m = getModel();
  return [
    { kind: "site", file: "home.png" },
    ...m.languages.map((l) => ({ kind: "language", file: `${l.spec.id}.png` })),
    ...m.problems.map((p) => ({ kind: "problem", file: `${p.spec.id}.png` })),
    ...pairs(m.languages.map((l) => l.spec.id)).map((p) => ({ kind: "compare", file: `${p}.png` })),
  ];
}

export const ogPath = (kind: "site" | "language" | "problem" | "compare", id = "home") => `/og/${kind}/${id}.png`;

export function ogImage(kind: string, id: string) {
  const m = getModel();
  const order = ranking(m);
  const colorOf = (lang?: string) => m.languages.find((l) => l.spec.id === lang)?.spec.color?.dark ?? BLUE;
  if (kind === "language") {
    const l = m.languages.find((x) => x.spec.id === id);
    const at = order.findIndex((r) => r.id === id);
    const from = Math.max(0, Math.min(at - 2, order.length - 5));
    return card(
      `${l?.spec.name ?? id} performance`,
      at >= 0 ? `Ranks #${at + 1} of ${order.length} overall · ${order[at]!.value.toFixed(1)}× the fastest language` : "Speed and memory benchmark results",
      order.slice(from, from + 5).map((r) => ({ label: r.name, color: r.id === id ? colorOf(id) : "#2b3a52", value: 1 / r.value })),
    );
  }
  if (kind === "problem") {
    const p = m.problems.find((x) => x.spec.id === id);
    const cells = snapshotCells(m).filter((c) => c.problem === id).sort((a, b) => a.index - b.index);
    return card(`${p?.spec.title ?? id} benchmark`, p?.spec.summary ?? "Speed and memory by language",
      cells.slice(0, 5).map((c) => ({ label: m.languages.find((l) => l.spec.id === c.language)?.spec.name ?? c.language, color: colorOf(c.language), value: 1 / c.index })));
  }
  if (kind === "compare") {
    const [a, b] = id.split("-vs-").map((x) => m.languages.find((l) => l.spec.id === x));
    const va = order.find((r) => r.id === a?.spec.id)?.value, vb = order.find((r) => r.id === b?.spec.id)?.value;
    const sub = va && vb ? `${va < vb ? a!.spec.name : b!.spec.name} is ${(Math.max(va, vb) / Math.min(va, vb)).toFixed(2)}× faster overall` : "Speed and memory, problem by problem";
    return card(`${a?.spec.name ?? "?"} vs ${b?.spec.name ?? "?"}`, sub, [a, b].map((l) => ({ label: l?.spec.name ?? "", color: colorOf(l?.spec.id), value: 1 / (order.find((r) => r.id === l?.spec.id)?.value ?? 1) })));
  }
  const top = order.slice(0, 5);
  return card(
    "How fast is each programming language, really?",
    `${m.languages.length} languages · ${m.problems.filter((p) => p.spec.scored).length} workloads · ${m.analysis.sessionCount} sessions`,
    top.map((r) => ({ label: r.name, color: colorOf(r.id), value: 1 / r.value })),
  );
}
