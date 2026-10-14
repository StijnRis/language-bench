// Generates one icon per problem in a light and a dark variant: web/public/problems/<id>-{light,dark}.svg
// Run: node web/scripts/make-problem-icons.mjs   (re-run after adding a problem; add its glyph below)
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "problems");
mkdirSync(out, { recursive: true });

const THEMES = {
  light: { bg: "#e8eeff", ring: "#c9d6fb", ink: "#1e3a8a", a: "#2457f5", b: "#f97316", c: "#16a34a", soft: "#ffffff" },
  dark: { bg: "#16213b", ring: "#27385f", ink: "#c7d6ff", a: "#7aa2ff", b: "#fb923c", c: "#4ade80", soft: "#0a0d13" },
};

const stroke = (t, w = 3, color = t.ink) => `fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

const GLYPHS = {
  // sun with three orbiting bodies
  nbody: (t) => `
    <ellipse cx="48" cy="48" rx="30" ry="12" ${stroke(t, 2)} opacity=".55" transform="rotate(-25 48 48)"/>
    <ellipse cx="48" cy="48" rx="20" ry="30" ${stroke(t, 2)} opacity=".55" transform="rotate(35 48 48)"/>
    <circle cx="48" cy="48" r="9" fill="${t.b}"/>
    <circle cx="74" cy="36" r="5" fill="${t.a}"/><circle cx="28" cy="62" r="4" fill="${t.c}"/><circle cx="60" cy="74" r="3.5" fill="${t.a}"/>`,
  // binary tree
  "binary-trees": (t) => `
    <path d="M48 28 L30 50 M48 28 L66 50 M30 50 L20 70 M30 50 L40 70 M66 50 L56 70 M66 50 L76 70" ${stroke(t)}/>
    <circle cx="48" cy="26" r="8" fill="${t.b}"/><circle cx="30" cy="50" r="7" fill="${t.a}"/><circle cx="66" cy="50" r="7" fill="${t.a}"/>
    <circle cx="20" cy="71" r="6" fill="${t.c}"/><circle cx="40" cy="71" r="6" fill="${t.c}"/><circle cx="56" cy="71" r="6" fill="${t.c}"/><circle cx="76" cy="71" r="6" fill="${t.c}"/>`,
  // curly braces around key/value lines
  "json-parse": (t) => `
    <path d="M36 24 C28 24 28 30 28 38 C28 44 24 48 20 48 C24 48 28 52 28 58 C28 66 28 72 36 72" ${stroke(t, 4)}/>
    <path d="M60 24 C68 24 68 30 68 38 C68 44 72 48 76 48 C72 48 68 52 68 58 C68 66 68 72 60 72" ${stroke(t, 4)}/>
    <rect x="38" y="36" width="10" height="5" rx="2.5" fill="${t.b}"/><rect x="51" y="36" width="8" height="5" rx="2.5" fill="${t.a}"/>
    <rect x="38" y="46" width="14" height="5" rx="2.5" fill="${t.b}"/><rect x="55" y="46" width="5" height="5" rx="2.5" fill="${t.c}"/>
    <rect x="38" y="56" width="8" height="5" rx="2.5" fill="${t.b}"/><rect x="49" y="56" width="10" height="5" rx="2.5" fill="${t.a}"/>`,
  // buckets with keys
  hashmap: (t) => `
    <g ${stroke(t, 2.5)}><rect x="16" y="22" width="22" height="14" rx="3"/><rect x="16" y="41" width="22" height="14" rx="3"/><rect x="16" y="60" width="22" height="14" rx="3"/></g>
    <path d="M38 29 H54 M38 48 H54 M38 67 H54" ${stroke(t, 2.5)}/>
    <rect x="54" y="22" width="26" height="14" rx="7" fill="${t.a}"/><rect x="54" y="41" width="26" height="14" rx="7" fill="${t.b}"/><rect x="54" y="60" width="26" height="14" rx="7" fill="${t.c}"/>
    <text x="27" y="33" font-size="9" font-weight="700" text-anchor="middle" fill="${t.ink}" font-family="monospace">#</text>
    <text x="27" y="52" font-size="9" font-weight="700" text-anchor="middle" fill="${t.ink}" font-family="monospace">#</text>
    <text x="27" y="71" font-size="9" font-weight="700" text-anchor="middle" fill="${t.ink}" font-family="monospace">#</text>`,
  // ascending bars with arrow
  sort: (t) => `
    <rect x="18" y="56" width="10" height="20" rx="3" fill="${t.a}"/><rect x="32" y="48" width="10" height="28" rx="3" fill="${t.a}"/>
    <rect x="46" y="38" width="10" height="38" rx="3" fill="${t.c}"/><rect x="60" y="28" width="10" height="48" rx="3" fill="${t.c}"/>
    <path d="M20 32 L74 18 M64 17 L74 18 L70 27" ${stroke(t, 3, t.b)}/>`,
  // quoted text with cursor
  "string-ops": (t) => `
    <rect x="14" y="26" width="68" height="44" rx="10" fill="${t.soft}" stroke="${t.ink}" stroke-width="2.5"/>
    <text x="48" y="58" font-size="26" font-weight="800" text-anchor="middle" fill="${t.a}" font-family="Georgia, serif">Ab</text>
    <path d="M22 22 q-4 6 0 10 M30 22 q-4 6 0 10" ${stroke(t, 2.5, t.b)}/>
    <rect x="62" y="40" width="4" height="22" rx="2" fill="${t.b}"/>`,
  // several lanes merging into one
  "parallel-reduce": (t) => `
    <path d="M14 24 H40 C52 24 52 48 62 48 M14 40 H40 C50 40 52 48 62 48 M14 56 H40 C50 56 52 48 62 48 M14 72 H40 C52 72 52 48 62 48" ${stroke(t, 3, t.a)}/>
    <path d="M62 48 H78 M72 41 L79 48 L72 55" ${stroke(t, 4, t.b)}/>
    <circle cx="14" cy="24" r="4" fill="${t.c}"/><circle cx="14" cy="40" r="4" fill="${t.c}"/><circle cx="14" cy="56" r="4" fill="${t.c}"/><circle cx="14" cy="72" r="4" fill="${t.c}"/>`,
  // document with lines and folded corner
  "file-processing": (t) => `
    <path d="M26 16 H56 L72 32 V78 a4 4 0 0 1 -4 4 H26 a4 4 0 0 1 -4 -4 V20 a4 4 0 0 1 4 -4 Z" fill="${t.soft}" stroke="${t.ink}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M56 16 V32 H72" ${stroke(t, 2.5)}/>
    <rect x="30" y="42" width="32" height="5" rx="2.5" fill="${t.a}"/><rect x="30" y="53" width="24" height="5" rx="2.5" fill="${t.b}"/><rect x="30" y="64" width="30" height="5" rx="2.5" fill="${t.c}"/>`,
  // two matrices multiplied into a third
  matmul: (t) => `
    <g ${stroke(t, 2.5)}><rect x="12" y="30" width="22" height="22" rx="3"/><rect x="40" y="30" width="22" height="22" rx="3"/><rect x="40" y="58" width="22" height="22" rx="3"/></g>
    <path d="M12 41 H34 M23 30 V52 M40 41 H62 M51 30 V52 M40 69 H62 M51 58 V80" ${stroke(t, 1.5)}/>
    <rect x="68" y="42" width="16" height="16" rx="3" fill="${t.b}"/><rect x="70" y="44" width="5" height="5" rx="1.5" fill="${t.soft}"/><rect x="77" y="51" width="5" height="5" rx="1.5" fill="${t.soft}"/>
    <rect x="23" y="41" width="10" height="10" rx="2" fill="${t.a}"/><rect x="40" y="58" width="10" height="10" rx="2" fill="${t.c}"/>`,
  // stack of pancakes with a spatula
  fannkuch: (t) => `
    <rect x="22" y="64" width="46" height="9" rx="4.5" fill="${t.a}"/><rect x="26" y="53" width="38" height="9" rx="4.5" fill="${t.b}"/>
    <rect x="20" y="42" width="50" height="9" rx="4.5" fill="${t.c}"/><rect x="28" y="31" width="34" height="9" rx="4.5" fill="${t.a}"/>
    <path d="M76 26 V58 M70 32 L76 24 L82 32" ${stroke(t, 3, t.ink)}/>`,
  // grid of dots, composites crossed out
  sieve: (t) => `
    <circle cx="24" cy="26" r="5" fill="${t.a}"/><circle cx="48" cy="26" r="5" fill="${t.a}"/><circle cx="72" cy="26" r="5" fill="${t.c}"/>
    <circle cx="24" cy="48" r="5" fill="${t.b}" opacity=".35"/><circle cx="48" cy="48" r="5" fill="${t.b}" opacity=".35"/><circle cx="72" cy="48" r="5" fill="${t.c}"/>
    <circle cx="24" cy="70" r="5" fill="${t.a}"/><circle cx="48" cy="70" r="5" fill="${t.b}" opacity=".35"/><circle cx="72" cy="70" r="5" fill="${t.b}" opacity=".35"/>
    <path d="M18 42 L30 54 M42 42 L54 54 M42 64 L54 76 M66 64 L78 76" ${stroke(t, 2.5, t.b)}/>`,
  // stopwatch
  startup: (t) => `
    <circle cx="48" cy="54" r="26" fill="${t.soft}" stroke="${t.ink}" stroke-width="3"/>
    <path d="M40 18 H56 M48 18 V28" ${stroke(t, 3.5)}/>
    <path d="M48 54 L62 40" ${stroke(t, 4, t.b)}/>
    <circle cx="48" cy="54" r="3.5" fill="${t.b}"/>
    <path d="M48 33 V37 M69 54 H65 M48 75 V71 M27 54 H31" ${stroke(t, 2.5, t.a)}/>`,
};

const fallback = (t) => `<path d="M30 60 L48 28 L66 60 Z" fill="${t.a}"/><circle cx="48" cy="62" r="10" fill="${t.b}"/>`;

export function icon(id, mode) {
  const t = THEMES[mode];
  const glyph = (GLYPHS[id] ?? fallback)(t);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="${id} icon">
  <rect x="1.5" y="1.5" width="93" height="93" rx="22" fill="${t.bg}" stroke="${t.ring}" stroke-width="3"/>
  ${glyph}
</svg>
`;
}

import { readdirSync } from "node:fs";
const problemsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "problems");
for (const id of readdirSync(problemsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  for (const mode of Object.keys(THEMES)) writeFileSync(join(out, `${id}-${mode}.svg`), icon(id, mode));
  console.log("wrote", id);
}
