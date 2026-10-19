import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fromSessionFile, listSessionFiles } from "@lb/core";
import { dataDir, implDir, loadConfig, loadLanguages, loadProblems } from "@lb/core/discover";
import { planSessions } from "@lb/core";
import { ROOT } from "./config";
import { conformance, currentCounts, enumerateCandidates, mergeFragment, runSession, verify, type SessionPlan } from "./session";
import { discoverVersions } from "./versions";

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

const cwdPath = (p: string) => path.resolve(process.env.INIT_CWD ?? process.cwd(), p);
const ghOutput = (k: string, v: string) => {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
};

async function main() {
  const { f, pos } = flags(rest);
  switch (cmd) {
    case "list": {
      for (const l of loadLanguages(ROOT))
        console.log(`${l.spec.id}: tracked ${l.spec.versions.map((v) => v.version).join(", ")}; variants ${l.spec.variants.map((v) => v.id).join(", ")}`);
      for (const p of loadProblems(ROOT)) console.log(`problem ${p.spec.id} [${p.spec.tags.join(", ")}]`);
      break;
    }
    /* Find new language releases and update language.json / releases.json. */
    case "discover-versions": {
      const changes = await discoverVersions(loadConfig(ROOT), f["dry-run"] !== "true");
      console.log(JSON.stringify(changes, null, 2));
      ghOutput("changed", String(changes.length > 0));
      break;
    }
    /* How much is left to measure? */
    case "status": {
      const cfg = loadConfig(ROOT);
      const plan = planSessions(enumerateCandidates(), currentCounts(), cfg, "status", 1);
      console.log(JSON.stringify({ total: plan.total, remaining: plan.remaining, sufficient: plan.total - plan.remaining }));
      ghOutput("remaining", String(plan.remaining));
      break;
    }
    /* Decide what the next sessions run. Writes plans/<n>.json and prints a GitHub matrix. */
    case "plan": {
      const cfg = loadConfig(ROOT);
      const plan = planSessions(enumerateCandidates(), currentCounts(), cfg, f.seed ?? `${Date.now()}`, f.sessions ? Number(f.sessions) : undefined);
      const dir = cwdPath(f.out ?? ".work/plans");
      fs.mkdirSync(dir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const include = plan.sessions.map((picks, i) => {
        const sp: SessionPlan = {
          sessionId: `${stamp}-s${i + 1}`,
          picks,
          config: cfg,
          trigger: { plannedAt: new Date().toISOString(), remainingAtPlanTime: plan.remaining, sessionIndexInRound: i + 1, sessionsInRound: plan.sessions.length },
        };
        fs.writeFileSync(path.join(dir, `session-${i + 1}.json`), JSON.stringify(sp, null, 2));
        return { session: i + 1 };
      });
      console.error(`[plan] ${plan.remaining}/${plan.total} benchmarks below target; ${include.length} session(s) planned: ${plan.sessions.map((s) => s.length).join(", ")} benchmarks`);
      const matrix = JSON.stringify({ include });
      console.log(matrix);
      ghOutput("matrix", matrix);
      ghOutput("remaining", String(plan.remaining));
      ghOutput("sessions", String(include.length));
      break;
    }
    case "session": {
      const plan: SessionPlan = JSON.parse(fs.readFileSync(cwdPath(f.plan!), "utf8"));
      if (f.reps) plan.config.repetitions = { min: Number(f.reps), max: Number(f.reps) };
      if (f.budget) plan.config.kernel = { ...plan.config.kernel, budgetSeconds: Number(f.budget), warmupSeconds: Number(f.budget) / 5 }; // shorter kernel loops for tests (warm-up scaled with them)
      await runSession(plan, { out: cwdPath(f.out!) });
      break;
    }
    /*
     * Which (language, version, problems) combinations need verifying for a list of changed files
     * (stdin; --base <sha> lets it see what changed inside language.json):
     *  - an implementation file: the versions that actually use that file, for that problem
     *  - language.json: only the added versions if nothing but `versions` changed, else all versions
     *  - a problem: that problem, every version of every language
     *  - runner/core/workflow/lockfile: a smoke test, the newest version of every language
     */
    case "verify-matrix": {
      const changed = fs.readFileSync(0, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
      const langs = loadLanguages(ROOT);
      const problems = loadProblems(ROOT).map((p) => p.spec.id);
      const wanted = new Map<string, Set<string>>(); // "lang|version" -> problems
      const add = (language: string, version: string, ps: string[]) => {
        const set = wanted.get(`${language}|${version}`) ?? wanted.set(`${language}|${version}`, new Set()).get(`${language}|${version}`)!;
        ps.forEach((p) => set.add(p));
      };
      const versionsOf = (id: string) => langs.find((l) => l.spec.id === id)?.spec.versions.map((v) => v.version) ?? [];
      const showBase = (file: string): any => {
        if (!f.base) return undefined;
        const r = spawnSync("git", ["show", `${f.base}:${file}`], { encoding: "utf8", cwd: ROOT });
        return r.status === 0 ? JSON.parse(r.stdout) : undefined;
      };
      for (const c of changed) {
        let m: RegExpMatchArray | null;
        if (/^(runner|core|tools|harness)\//.test(c) || c === "pnpm-lock.yaml" || c.startsWith(".github/workflows/verify")) {
          for (const l of langs) add(l.spec.id, l.spec.versions.find((v) => v.latest)!.version, problems);
        } else if ((m = c.match(/^languages\/([^/]+)\/harness\//))) {
          // a harness is part of every benchmark of its language: every tracked version, every problem
          versionsOf(m[1]!).forEach((v) => add(m![1]!, v, problems));
        } else if ((m = c.match(/^languages\/([^/]+)\/impl\/([^/]+)\/(@([^/]+)\/)?/))) {
          const lang = langs.find((l) => l.spec.id === m![1]);
          if (!lang) continue;
          const dir = (v: string) => path.relative(ROOT, implDir(ROOT, lang.spec, m![2]!, v)).split(path.sep).join("/") + "/";
          // the versions whose chosen folder is the one that changed
          const touched = lang.spec.versions.map((v) => v.version).filter((v) => c.startsWith(dir(v)));
          const fallback = touched.length ? touched : m[4] ? [] : versionsOf(lang.spec.id);
          fallback.forEach((v) => add(lang.spec.id, v, [m![2]!]));
        } else if ((m = c.match(/^languages\/([^/]+)\/(language\.json|Dockerfile|app\.csproj)$/))) {
          const id = m[1]!;
          let vs = versionsOf(id);
          if (m[2] === "language.json") {
            const before = showBase(c);
            const now = JSON.parse(fs.readFileSync(path.join(ROOT, c), "utf8"));
            if (before && now) {
              const strip = (x: any) => JSON.stringify({ ...x, versions: undefined });
              if (strip(before) === strip(now)) vs = vs.filter((v) => !before.versions.some((o: { version: string }) => o.version === v));
            }
          }
          vs.forEach((v) => add(id, v, problems));
        } else if ((m = c.match(/^problems\/([^/]+)\//))) {
          for (const l of langs) versionsOf(l.spec.id).forEach((v) => add(l.spec.id, v, [m![1]!]));
        }
      }
      const include = [...wanted].map(([k, set]) => {
        const [language, version] = k.split("|");
        return { language, version, problems: [...set].join(",") };
      });
      console.log(JSON.stringify({ include }));
      break;
    }
    /* Tracked versions of the given languages (default: all), optionally only some versions: --language a,b --version 1,2 */
    case "matrix": {
      const only = f.language?.split(",");
      const versions = f.version?.split(",");
      const include = loadLanguages(ROOT)
        .filter((l) => !only || only.includes(l.spec.id))
        .flatMap((l) => l.spec.versions.filter((v) => !versions || versions.includes(v.version)).map((v) => ({ language: l.spec.id, version: v.version })));
      console.log(JSON.stringify({ include }));
      break;
    }
    case "verify": {
      const ok = await verify({ language: f.language ?? pos[0]!, version: f.version, variant: f.variant, problems: f.problems?.split(","), iterations: f.iterations ? Number(f.iterations) : undefined });
      process.exit(ok ? 0 : 1);
    }
    /* Does the harness of a language follow harness/CONTRACT.md? Builds it with the conformance problem. */
    case "conformance": {
      const ok = await conformance({ language: f.language ?? pos[0]!, version: f.version });
      process.exit(ok ? 0 : 1);
    }
    /* Append session fragments written by `session --out` to data/. */
    case "merge": {
      const dir = cwdPath(pos[0]!);
      const files = fs.readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((x) => x.endsWith(".json")).sort();
      for (const file of files) {
        await mergeFragment(JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
        console.log(`merged ${file}`);
      }
      break;
    }
    case "validate": {
      const files = listSessionFiles(dataDir(ROOT));
      const seen = new Set<string>();
      for (const file of files) {
        const { session } = fromSessionFile(JSON.parse(fs.readFileSync(file, "utf8")));
        if (path.basename(file) !== `${session.id}.json`) throw new Error(`${file}: file name must be <session id>.json`);
        if (seen.has(session.id)) throw new Error(`duplicate session ${session.id}`);
        seen.add(session.id);
        console.log(`ok ${path.basename(file)}`);
      }
      break;
    }
    default:
      console.error("usage: lb <list|discover-versions|status|plan|session|verify|conformance|verify-matrix|matrix|merge|validate> [--flags]");
      process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
