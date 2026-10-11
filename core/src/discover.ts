/**
 * Folder-based discovery. Nothing is registered centrally:
 *   languages/<id>/language.json   -> a language
 *   problems/<id>/problem.json     -> a problem
 *   data/<language>.json           -> measurements
 */
import fs from "node:fs";
import path from "node:path";
import {
  LanguageDataSchema,
  LanguageSchema,
  ProblemSchema,
  ReleasesSchema,
  type Language,
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

export function loadData(root = findRepoRoot()): LanguageData[] {
  const dir = process.env.LB_DATA_DIR ? path.resolve(root, process.env.LB_DATA_DIR) : path.join(root, "data");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => LanguageDataSchema.parse(readJson(path.join(dir, f))));
}

/** Source code of one implementation (shown on the site, hashed into measurements). */
export function readSource(root: string, lang: Language, problem: string): string | undefined {
  const file = path.join(root, "languages", lang.id, "impl", problem, lang.sourceFile);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
}
