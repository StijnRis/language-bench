import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Config, Language } from "@lb/core";
import { loadLanguages, type LoadedLanguage } from "@lb/core/discover";
import { ROOT } from "./config";

const log = (...a: unknown[]) => console.error(...a);

interface Found {
  version: string;
  /** git tag the version was derived from (github-tags) */
  tag?: string;
  date?: string;
}

const cmpVersion = (a: string, b: string) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
};

async function findReleases(src: NonNullable<Language["versionSource"]>): Promise<Found[]> {
  const re = new RegExp(src.pattern);
  if (src.kind === "node-dist") {
    const idx = (await (await fetch("https://nodejs.org/dist/index.json")).json()) as { version: string; date: string }[];
    return idx.flatMap((e) => {
      const m = e.version.match(re);
      return m ? [{ version: m[1]!, date: e.date }] : [];
    });
  }
  const r = spawnSync("git", ["ls-remote", "--tags", "--refs", `https://github.com/${src.repo}.git`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ls-remote ${src.repo} failed: ${r.stderr}`);
  const out = new Map<string, Found>();
  for (const line of r.stdout.split("\n")) {
    const tag = line.split("\trefs/tags/")[1];
    const m = tag?.match(re);
    if (m) out.set(m[1]!, { version: m[1]!, tag });
  }
  return [...out.values()];
}

async function tagDate(repo: string, tag: string): Promise<string | undefined> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  const res = await fetch(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(tag)}`, {
    headers: { accept: "application/vnd.github+json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) return undefined;
  return ((await res.json()) as any).commit?.committer?.date?.slice(0, 10);
}

function imageExists(image: string): boolean {
  const r = spawnSync("docker", ["manifest", "inspect", image], { stdio: "ignore", timeout: 60_000 });
  return r.error ? true : r.status === 0; // no docker available: assume yes
}

export interface VersionChange {
  language: string;
  tracked: string[];
  added: string[];
}

/**
 * Looks up the newest releases of every language and rewrites `versions` in language.json
 * (newest `trackedVersionsPerLanguage` releases whose Docker image exists) and adds dates to
 * releases.json. Returns what changed.
 */
export async function discoverVersions(cfg: Config, write = true): Promise<VersionChange[]> {
  const changes: VersionChange[] = [];
  for (const l of loadLanguages(ROOT)) {
    const src = l.spec.versionSource;
    if (!src) continue;
    let found: Found[];
    try {
      found = (await findReleases(src)).sort((a, b) => cmpVersion(b.version, a.version));
    } catch (e) {
      log(`[versions] ${l.spec.id}: ${e}`);
      continue;
    }
    const tracked: Found[] = [];
    for (const f of found) {
      if (tracked.length >= cfg.trackedVersionsPerLanguage) break;
      const image = l.spec.image.replace("{version}", f.version);
      if (imageExists(image)) tracked.push(f);
      else log(`[versions] ${l.spec.id} ${f.version}: image ${image} not available (yet), skipping`);
    }
    if (tracked.length === 0) continue;
    const before = l.spec.versions.map((v) => v.version);
    const after = tracked.map((t) => t.version);
    const added = after.filter((v) => !before.includes(v));
    if (!write) {
      changes.push({ language: l.spec.id, tracked: after, added });
      continue;
    }
    const specFile = path.join(l.dir, "language.json");
    const raw = JSON.parse(fs.readFileSync(specFile, "utf8"));
    const newVersions = after.map((v, i) => ({ version: v, latest: i === 0 }));
    const same = JSON.stringify(raw.versions) === JSON.stringify(newVersions);
    if (!same) {
      raw.versions = newVersions;
      fs.writeFileSync(specFile, JSON.stringify(raw, null, 2) + "\n");
    }
    // release dates for the timeline
    const relFile = path.join(l.dir, "releases.json");
    const rel: LoadedLanguage["releases"] = fs.existsSync(relFile) ? JSON.parse(fs.readFileSync(relFile, "utf8")) : {};
    let relChanged = false;
    for (const t of tracked) {
      if (rel[t.version]) continue;
      const date = t.date ?? (t.tag && src.repo ? await tagDate(src.repo, t.tag) : undefined);
      if (!date) continue;
      rel[t.version] = { date, highlights: [] };
      relChanged = true;
    }
    if (relChanged) fs.writeFileSync(relFile, JSON.stringify(rel, null, 2) + "\n");
    if (!same || relChanged) changes.push({ language: l.spec.id, tracked: after, added });
  }
  return changes;
}
