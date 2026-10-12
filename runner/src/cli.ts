import fs from "node:fs";
import path from "node:path";
import { fromSessionFile, listSessionFiles } from "@lb/core";
import { dataDir, loadConfig, loadLanguages, loadProblems } from "@lb/core/discover";
import { planSessions } from "@lb/core";
import { ROOT } from "./config";
import { currentCounts, enumerateCandidates, mergeFragment, runSession, verify, type SessionPlan } from "./session";
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
      console.log(changes.length ? JSON.stringify(changes, null, 2) : "no new versions");
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
      const plan = planSessions(enumerateCandidates(), currentCounts(), cfg, f.seed ?? `${Date.now()}`, f.sessions ? Number(f.sessions) : cfg.sessionsPerRound);
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
      await runSession(plan, { out: cwdPath(f.out!) });
      break;
    }
    case "verify-matrix": {
      const changed = fs.readFileSync(0, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
      const langs = loadLanguages(ROOT).map((l) => l.spec.id);
      const problems = loadProblems(ROOT).map((p) => p.spec.id);
      const all = changed.some((c) => /^(runner|core)\//.test(c) || c === "pnpm-lock.yaml" || c.startsWith(".github/workflows/verify"));
      const pairs = new Map<string, Set<string>>();
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
      console.log(JSON.stringify({ include: [...pairs].map(([language, set]) => ({ language, problems: [...set].join(",") })) }));
      break;
    }
    /* All tracked versions of every language (weekly full verification). */
    case "matrix": {
      const include = loadLanguages(ROOT).flatMap((l) => l.spec.versions.map((v) => ({ language: l.spec.id, version: v.version })));
      console.log(JSON.stringify({ include }));
      break;
    }
    case "verify": {
      const ok = verify({ language: f.language ?? pos[0]!, version: f.version, variant: f.variant, problems: f.problems?.split(",") });
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
      console.error("usage: lb <list|discover-versions|status|plan|session|verify|verify-matrix|matrix|merge|validate> [--flags]");
      process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
