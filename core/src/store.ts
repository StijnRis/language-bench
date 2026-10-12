/**
 * On-disk data layout: one append-only file per session, `data/sessions/<sessionId>.json`.
 * Variant specs (identical for every measurement of the same variant) are stored once per file
 * and referenced by hash; per-repetition numbers are stored as columns (see RunsSchema).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { SessionFileSchema, type LanguageData, type Measurement, type Session, type SessionFile } from "./schema";

export const SESSIONS_SUBDIR = "sessions";

const specHash = (spec: unknown) => crypto.createHash("sha1").update(JSON.stringify(spec)).digest("hex").slice(0, 12);

/** In-memory session (measurements carry their full variantSpec) -> file content. */
export function toSessionFile(session: Session, measurements: Measurement[]): SessionFile {
  const variants: SessionFile["variants"] = {};
  const ms = measurements.map((m) => {
    const key = specHash(m.variantSpec);
    variants[key] = m.variantSpec;
    return { ...m, variantSpec: key };
  });
  return { schemaVersion: 3, session, variants, measurements: ms };
}

/** File content -> session + measurements with the variant specs resolved again. */
export function fromSessionFile(raw: unknown): { session: Session; measurements: Measurement[] } {
  const f = SessionFileSchema.parse(raw);
  const measurements = f.measurements.map((m) => {
    const spec = f.variants[m.variantSpec];
    if (!spec) throw new Error(`session ${f.session.id}: unknown variant reference ${m.variantSpec}`);
    if (m.sessionId !== f.session.id) throw new Error(`session ${f.session.id}: measurement belongs to ${m.sessionId}`);
    if (m.runs) {
      const lens = new Set(Object.values(m.runs).map((c) => c.length));
      if (lens.size > 1) throw new Error(`session ${f.session.id}: run columns of ${m.language}|${m.version}|${m.variant}|${m.problem} differ in length`);
    }
    return { ...m, variantSpec: spec } as Measurement;
  });
  return { session: f.session, measurements };
}

export const sessionFilePath = (dataDir: string, sessionId: string) => path.join(dataDir, SESSIONS_SUBDIR, `${sessionId}.json`);

export function listSessionFiles(dataDir: string): string[] {
  const dir = path.join(dataDir, SESSIONS_SUBDIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(dir, f));
}

/** Reads every session file and regroups the measurements per language. */
export function loadSessionFiles(dataDir: string): { sessions: Record<string, Session>; languages: LanguageData[] } {
  const sessions: Record<string, Session> = {};
  const byLang = new Map<string, Measurement[]>();
  for (const file of listSessionFiles(dataDir)) {
    const { session, measurements } = fromSessionFile(JSON.parse(fs.readFileSync(file, "utf8")));
    if (path.basename(file) !== `${session.id}.json`) throw new Error(`${file}: file name must be <session id>.json`);
    sessions[session.id] = session;
    for (const m of measurements) (byLang.get(m.language) ?? byLang.set(m.language, []).get(m.language)!).push(m);
  }
  const languages = [...byLang].sort(([a], [b]) => a.localeCompare(b)).map(([language, measurements]) => ({ language, measurements }));
  return { sessions, languages };
}
