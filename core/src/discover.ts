/**
 * Folder-based discovery. Nothing is registered centrally:
 *   languages/<id>/language.json   -> a language
 *   problems/<id>/problem.json     -> a problem
 *   data/<language>.json           -> measurements
 */
import fs from "node:fs";
import path from "node:path";
import {
  ConfigSchema,
  LanguageDataSchema,
  SessionsFileSchema,
  LanguageSchema,
  ProblemSchema,
  ReleasesSchema,
  type Config,
  type Language,
  type SessionsFile,
  type LanguageData,
  type Problem,
  type Releases,
} from "./schema";

export function findRepoRoot(from = process.cwd()): string {
  let dir = path.resolve(from);
  for (;;) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("repo root (pnpm-workspace.yaml) not found");
    dir = parent;
  }
}

const readJson = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"));

function subdirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export interface LoadedLanguage {
  spec: Language;
  releases: Releases;
  dir: string;
}

export function loadLanguages(root = findRepoRoot()): LoadedLanguage[] {
  return subdirs(path.join(root, "languages")).flatMap((id) => {
    const dir = path.join(root, "languages", id);
    const file = path.join(dir, "language.json");
    if (!fs.existsSync(file)) return [];
    const spec = LanguageSchema.parse(readJson(file));
    if (spec.id !== id) throw new Error(`${file}: id "${spec.id}" must equal folder name "${id}"`);
    if (spec.variants.filter((v) => v.default).length !== 1)
      throw new Error(`${file}: exactly one variant must have default: true`);
    if (spec.versions.filter((v) => v.latest).length !== 1)
      throw new Error(`${file}: exactly one version must have latest: true`);
    const relFile = path.join(dir, "releases.json");
    const releases = fs.existsSync(relFile) ? ReleasesSchema.parse(readJson(relFile)) : {};
    return [{ spec, releases, dir }];
  });
}

export interface LoadedProblem {
  spec: Problem;
  expected: string;
  dir: string;
}

export function loadProblems(root = findRepoRoot()): LoadedProblem[] {
  return subdirs(path.join(root, "problems")).flatMap((id) => {
    const dir = path.join(root, "problems", id);
    const file = path.join(dir, "problem.json");
    if (!fs.existsSync(file)) return [];
    const spec = ProblemSchema.parse(readJson(file));
    if (spec.id !== id) throw new Error(`${file}: id "${spec.id}" must equal folder name "${id}"`);
    const expectedFile = path.join(dir, "expected.txt");
    const expected = fs.existsSync(expectedFile) ? fs.readFileSync(expectedFile, "utf8") : "";
    return [{ spec, expected, dir }];
  });
}

export interface LoadedData {
  sessions: SessionsFile["sessions"];
  languages: LanguageData[];
}

export function dataDir(root = findRepoRoot()): string {
  return process.env.LB_DATA_DIR ? path.resolve(root, process.env.LB_DATA_DIR) : path.join(root, "data");
}

export function loadData(root = findRepoRoot()): LoadedData {
  const dir = dataDir(root);
  const sessionsFile = path.join(dir, "sessions.json");
  const sessions = fs.existsSync(sessionsFile) ? SessionsFileSchema.parse(readJson(sessionsFile)).sessions : {};
  const languages = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".json") && f !== "sessions.json")
        .sort()
        .map((f) => LanguageDataSchema.parse(readJson(path.join(dir, f))))
    : [];
  return { sessions, languages };
}

export function loadConfig(root = findRepoRoot()): Config {
  return ConfigSchema.parse(readJson(path.join(root, "lb.config.json")));
}

/** Source code of one implementation (shown on the site, hashed into measurements). */
export function readSource(root: string, lang: Language, problem: string): string | undefined {
  const file = path.join(root, "languages", lang.id, "impl", problem, lang.sourceFile);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
}
