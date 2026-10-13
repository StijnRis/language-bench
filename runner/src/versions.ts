import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { cmpVersion, type Config, type Language } from "@lb/core";
import { loadLanguages, type LoadedLanguage } from "@lb/core/discover";
import { ROOT } from "./config";

const log = (...a: unknown[]) => console.error(...a);

interface Found {
  version: string;
  /** git tag the version was derived from (github-tags) */
  tag?: string;
  date?: string;
}

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
    if (m) { const v = m[1]!.replace(/_/g, "."); out.set(v, { version: v, tag }); }
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

/**
 * Does the image tag exist? Asks the registries over HTTP (Docker Hub tag API / MCR manifest)
 * instead of `docker manifest inspect`, which counts against the anonymous pull rate limit.
 * Throws on anything but a clear yes or no, so a transient error never drops a version.
 */
async function imageExists(image: string): Promise<boolean> {
  const at = image.lastIndexOf(":");
  const repo = image.slice(0, at), tag = image.slice(at + 1);
  const mcr = repo.startsWith("mcr.microsoft.com/");
  const url = mcr
    ? `https://mcr.microsoft.com/v2/${repo.slice("mcr.microsoft.com/".length)}/manifests/${tag}`
    : `https://hub.docker.com/v2/repositories/${repo.includes("/") ? repo : "library/" + repo}/tags/${tag}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: mcr ? "HEAD" : "GET",
      headers: mcr ? { accept: "application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json" } : {},
    });
    if (res.status === 200) return true;
    if (res.status === 404) return false;
    if (attempt >= 3) throw new Error(`${url}: HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
}

export interface VersionChange {
  language: string;
  /** versions added by this run, newest first */
  added: string[];
}

/**
 * Looks for releases that are newer than the newest tracked version of every language and appends
 * them (when their Docker image exists) to `versions` in language.json, with their date in
 * releases.json. It never removes or reorders existing versions: the tracked set is curated by hand
 * (one release per year, see README). Returns what was added.
 */
export async function discoverVersions(_cfg: Config, write = true): Promise<VersionChange[]> {
  const changes: VersionChange[] = [];
  for (const l of loadLanguages(ROOT)) {
    const src = l.spec.versionSource;
    if (!src) continue;
    const newest = l.spec.versions.reduce((m, v) => (cmpVersion(v.version, m) > 0 ? v.version : m), l.spec.versions[0]!.version);
    try {
      const fresh = (await findReleases(src)).filter((f) => cmpVersion(f.version, newest) > 0).sort((a, b) => cmpVersion(b.version, a.version));
      const added: Found[] = [];
      for (const f of fresh) {
        const image = l.spec.image.replace("{version}", f.version);
        if (await imageExists(image)) added.push(f);
        else log(`[versions] ${l.spec.id} ${f.version}: image ${image} not available (yet), skipping`);
      }
      if (added.length === 0) continue;
      if (write) {
        const specFile = path.join(l.dir, "language.json");
        const raw = JSON.parse(fs.readFileSync(specFile, "utf8"));
        raw.versions = [...added.map((f) => ({ version: f.version, latest: false })), ...raw.versions].map((v: { version: string; latest: boolean }, i: number) => ({ ...v, latest: i === 0 }));
        fs.writeFileSync(specFile, JSON.stringify(raw, null, 2) + "\n");
        const relFile = path.join(l.dir, "releases.json");
        const rel: LoadedLanguage["releases"] = fs.existsSync(relFile) ? JSON.parse(fs.readFileSync(relFile, "utf8")) : {};
        for (const f of added) {
          const date = f.date ?? (f.tag && src.repo ? await tagDate(src.repo, f.tag) : undefined);
          if (date) rel[f.version] = { date, highlights: [] };
        }
        fs.writeFileSync(relFile, JSON.stringify(rel, null, 2) + "\n");
      }
      changes.push({ language: l.spec.id, added: added.map((f) => f.version) });
    } catch (e) {
      log(`[versions] ${l.spec.id}: ${e}`);
    }
  }
  return changes;
}
