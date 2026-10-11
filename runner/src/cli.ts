import fs from "node:fs";
import path from "node:path";
import { LanguageDataSchema } from "@lb/core";
import { loadLanguages, loadProblems } from "@lb/core/discover";
import { ROOT } from "./config";
import { appendData, bench, verify } from "./session";

const [cmd, ...rest] = process.argv.slice(2);

function flags(args: string[]) {
  const f: Record<string, string> = {};
  const pos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a.startsWith("--")) f[a.slice(2)] = args[i + 1]?.startsWith("--") || args[i + 1] === undefined ? "true" : args[++i]!;
    else pos.push(a);
  }
  return { f, pos };
}

async function main() {
  const { f, pos } = flags(rest);
  switch (cmd) {
    case "list": {
      for (const l of loadLanguages(ROOT))
        console.log(`${l.spec.id}: versions ${l.spec.versions.map((v) => v.version).join(", ")}; variants ${l.spec.variants.map((v) => v.id).join(", ")}`);
      for (const p of loadProblems(ROOT)) console.log(`problem ${p.spec.id} [${p.spec.tags.join(", ")}]`);
      break;
    }
    /* GitHub Actions matrix: one entry per (language, version) */
    case "matrix": {
      const only = f.language;
      const include = loadLanguages(ROOT).flatMap((l) =>
        l.spec.versions
          .filter((v) => (f.latest ? v.latest : true))
          .filter(() => !only || l.spec.id === only)
          .map((v) => ({ language: l.spec.id, version: v.version })),
      );
      console.log(JSON.stringify({ include }));
      break;
    }
    /* Verify matrix: languages + problems affected by the changed files given on stdin (one path per line) */
    case "verify-matrix": {
      const changed = fs.readFileSync(0, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
      const langs = loadLanguages(ROOT).map((l) => l.spec.id);
      const problems = loadProblems(ROOT).map((p) => p.spec.id);
      const all = changed.some((c) => /^(runner|core)\//.test(c) || c === "pnpm-lock.yaml" || c.startsWith(".github/workflows/verify"));
      const pairs = new Map<string, Set<string>>(); // language -> problems
      const add = (l: string, p: string | null) => {
        const set = pairs.get(l) ?? pairs.set(l, new Set()).get(l)!;
        for (const x of p ? [p] : problems) set.add(x);
      };
      for (const c of changed) {
        let m: RegExpMatchArray | null;
        if (all) langs.forEach((l) => add(l, null));
        else if ((m = c.match(/^languages\/([^/]+)\/impl\/([^/]+)\//))) add(m[1]!, m[2]!);
        else if ((m = c.match(/^languages\/([^/]+)\/(language\.json|Dockerfile)$/))) add(m[1]!, null);
        else if ((m = c.match(/^problems\/([^/]+)\//))) langs.forEach((l) => add(l, m![1]!));
      }
      const include = [...pairs].map(([language, set]) => ({ language, problems: [...set].join(",") }));
      console.log(JSON.stringify({ include }));
      break;
    }
    case "verify": {
      const ok = verify({
        language: f.language ?? pos[0]!,
        version: f.version,
        variant: f.variant,
        problems: f.problems?.split(","),
      });
      process.exit(ok ? 0 : 1);
    }
    case "bench": {
      await bench({
        language: f.language ?? pos[0]!,
        version: f.version ?? pos[1]!,
        reps: f.reps ? Number(f.reps) : undefined,
        problems: f.problems?.split(","),
        variant: f.variant,
        dryRun: f["dry-run"] === "true",
        out: f.out,
        sessionSuffix: f.suffix,
      });
      break;
    }
    /* Append session fragments written by `bench --out` to data/<language>.json */
    case "merge": {
      const dir = pos[0]!;
      const files = fs.readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((x) => x.endsWith(".json")).sort();
      for (const file of files) {
        const frag = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
        await appendData(frag.language, frag.sessionId, frag.session, frag.measurements);
        console.log(`merged ${file}`);
      }
      break;
    }
    /* Validate every file in data/ against the schema (CI gate for bench commits). */
    case "validate": {
      const dir = path.join(ROOT, "data");
      for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
        LanguageDataSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
        console.log(`ok ${f}`);
      }
      break;
    }
    default:
      console.error("usage: lb <list|matrix|verify-matrix|verify|bench|merge|validate> [--flags]");
      process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
