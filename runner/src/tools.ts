import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { CACHE, ROOT } from "./config";

const dir = path.join(CACHE, "tools");
export const toolPath = (name: "lbgen" | "lbgen-static" | "lbsample") => path.join(dir, name);

const FLAGS = ["-O2", "-ffp-contract=off"];

function hashOf(files: string[]) {
  const h = crypto.createHash("sha256");
  for (const f of files) h.update(fs.readFileSync(path.join(ROOT, "tools", f)));
  return h.digest("hex").slice(0, 16);
}

/** Compiles tools/lbgen.c and tools/lbsample.c with the host's gcc (cached by content hash). */
export function ensureTools(): { lbgenSha: string; gcc: string } {
  fs.mkdirSync(dir, { recursive: true });
  const sha = hashOf(["lbgen.c", "lbsample.c"]);
  const stamp = path.join(dir, "stamp");
  const gcc = spawnSync("gcc", ["--version"], { encoding: "utf8" }).stdout.split("\n")[0] ?? "";
  if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === sha && ["lbgen", "lbgen-static", "lbsample"].every((n) => fs.existsSync(toolPath(n as "lbgen")))) return { lbgenSha: sha, gcc };
  const build = (out: string, src: string, extra: string[], libs: string[] = []) => {
    const r = spawnSync("gcc", [...FLAGS, ...extra, "-o", path.join(dir, out), path.join(ROOT, "tools", src), ...libs], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`gcc ${src} failed:\n${r.stderr}`);
  };
  build("lbgen", "lbgen.c", [], ["-lm"]);
  build("lbsample", "lbsample.c", []);
  try {
    build("lbgen-static", "lbgen.c", ["-static"], ["-lm"]);
  } catch {
    // no static libc on this machine: the dynamic binary is the fallback (fine for a container with a compatible glibc)
    fs.copyFileSync(toolPath("lbgen"), toolPath("lbgen-static"));
  }
  fs.writeFileSync(stamp, sha);
  return { lbgenSha: sha, gcc };
}

/** Reference hashes of the first `count` instances (one per line "<i> <h1>:<h2>"). */
const refCache = new Map<string, string[]>();
export function referenceHashes(problem: string, count: number, start = 0): string[] {
  const key = `${problem}|${start}`;
  const have = refCache.get(key);
  if (have && have.length >= count) return have.slice(0, count);
  const r = spawnSync(toolPath("lbgen"), ["ref", problem, String(count), String(start)], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`lbgen ref ${problem} failed: ${r.stderr}`);
  const hashes = r.stdout.trim().split("\n").map((l) => l.split(" ")[1]!);
  refCache.set(key, hashes);
  return hashes;
}
