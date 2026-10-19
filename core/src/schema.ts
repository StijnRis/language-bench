import { z } from "zod";

/* ------------------------------------------------------------------ */
/* languages/<id>/language.json                                        */
/* ------------------------------------------------------------------ */

export const VariantSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/),
  name: z.string(),
  description: z.string().optional(),
  /** Optional build command. Placeholders: {src} {bin} {work} */
  build: z.string().optional(),
  /** Run command. Same placeholders; program arguments are appended by the runner. */
  run: z.string(),
  /** Variant used as the headline number on the leaderboard (exactly one per language). */
  default: z.boolean().default(false),
  /** Only benchmark this variant for these versions (default: all). */
  versions: z.array(z.string()).optional(),
  /** Only benchmark this variant from this version on (dotted numeric compare), e.g. a flag older toolchains do not know. */
  minVersion: z.string().optional(),
  /**
   * Different commands for newer versions. The rule with the highest `minVersion` that is <= the
   * benchmarked version overrides `build` / `run` (a field left out keeps the value above).
   */
  rules: z.array(z.object({ minVersion: z.string(), build: z.string().optional(), run: z.string().optional() })).optional(),
});

export const LanguageSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string(),
  /** Language id used for syntax highlighting. */
  highlight: z.string(),
  website: z.string().url(),
  description: z.string(),
  /** Brand colour used in charts, per colour scheme. Optional: a generated colour is used when missing. */
  color: z.object({ light: z.string(), dark: z.string() }).optional(),
  /** File name of the implementation inside languages/<id>/impl/<problem>/ */
  sourceFile: z.string(),
  /** Docker image template. {version} is replaced. */
  image: z.string(),
  /** Command run in the container to print the real tool version. */
  toolVersionCmd: z.string(),
  /** Stable versions to benchmark. The newest stable has latest = true. */
  versions: z.array(z.object({ version: z.string(), latest: z.boolean().default(false) })).min(1),
  variants: z.array(VariantSchema).min(1),
  /**
   * How new releases are found (see runner/src/versions.ts). `versions` above is maintained
   * automatically from this source: releases newer than the newest tracked one are appended; the
   * existing list is curated by hand and never rewritten.
   */
  versionSource: z
    .object({
      kind: z.enum(["github-tags", "node-dist"]),
      repo: z.string().optional(),
      /** regex with one capture group = the version string used in the Docker tag */
      pattern: z.string(),
      /** URL where humans can read about releases */
      url: z.string().optional(),
    })
    .optional(),
});
export type Language = z.infer<typeof LanguageSchema>;
export type Variant = z.infer<typeof VariantSchema>;

/** languages/<id>/releases.json : version -> metadata for the timeline */
export const ReleasesSchema = z.record(
  z.string(),
  z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    highlights: z.array(z.string()),
  }),
);
export type Releases = z.infer<typeof ReleasesSchema>;

/* ------------------------------------------------------------------ */
/* problems/<id>/problem.json                                          */
/* ------------------------------------------------------------------ */

export const ProblemSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  /** Language-neutral pseudocode of the workload. */
  pseudocode: z.string().optional(),
  /** What this workload reveals. */
  reveals: z.string(),
  /** What to be careful about when reading the numbers. */
  caveat: z.string(),
  tags: z.array(z.string()).min(1),
  /** Counted in aggregate scores? (the startup problem is not) */
  scored: z.boolean().default(true),
  /** Arguments passed to the program: the parameters of the problem (not the instance). */
  args: z.array(z.string()).default([]),
  /** kernel: timed in-process by the language's harness; startup: only the end-to-end run (no harness). */
  kind: z.enum(["kernel", "startup"]).default("kernel"),
  /** How instances reach the harness: streamed on stdin by tools/lbgen, as a file on tmpfs, or none (fixed workload). */
  instance: z.enum(["stream", "file", "none"]).default("none"),
  /** End-to-end (hyperfine) repetition policy: as many runs as fit the budget, within [min, max]. */
  runs: z.object({ min: z.number().default(3), max: z.number().default(10) }).default({}),
  /** Time budget of the end-to-end run in seconds. */
  budgetSeconds: z.number().default(30),
});
export type Problem = z.infer<typeof ProblemSchema>;

/* ------------------------------------------------------------------ */
/* lb.config.json : everything that is tunable about the benchmarking   */
/* ------------------------------------------------------------------ */

export const ConfigSchema = z.object({
  /** A benchmark is "sufficiently measured" once it has results from this many sessions. */
  targetSessionsPerBenchmark: z.number().int().min(1),
  /** Max benchmarks executed in one session (one session = one VM = many benchmarks). */
  maxBenchmarksPerSession: z.number().int().min(1),
  /** Upper bound of sessions (= VMs) started in parallel per workflow round. */
  maxSessionsPerRound: z.number().int().min(1),
  /** Lower bound: even a nearly finished round starts this many sessions. */
  minSessionsPerRound: z.number().int().min(1),
  /** Share of each session spent re-running already measured benchmarks (to calibrate hardware). */
  overlapFraction: z.number().min(0).max(1),
  /** ...but at least this many (when enough measured benchmarks exist). */
  minOverlap: z.number().int().min(0),
  /** Give up on a benchmark after this many failed attempts. */
  maxAttempts: z.number().int().min(1),
  /** A session stops starting new benchmarks after this long. */
  sessionTimeBudgetMinutes: z.number().min(1),
  /** Clamps the end-to-end (hyperfine) repetition policy of problem.json. */
  repetitions: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
  /** Multiplies the end-to-end time budget of every problem (use < 1 while testing). */
  budgetSecondsScale: z.number().positive(),
  warmupRuns: z.number().int().min(0),
  /** The in-process kernel loop (see harness/CONTRACT.md). */
  kernel: z
    .object({
      /** The loop runs until the summed kernel time reaches this many seconds... */
      budgetSeconds: z.number().positive(),
      /** ...but at least this many iterations. */
      minIterations: z.number().int().min(1),
      /** Hard wall-clock limit of one kernel run; hitting it makes the benchmark incomplete. */
      timeoutSeconds: z.number().positive(),
      /** Iterations that start within this much kernel time after the first one are warm-up and not part of the warm statistic. */
      warmupSeconds: z.number().min(0),
      /** Iterations whose result is compared with the reference hash of the generator (all of them if fewer ran). */
      checkedIterations: z.number().int().min(1),
      /** Memory sampling interval of the host (milliseconds). */
      sampleMillis: z.number().positive(),
    })
    .default({ budgetSeconds: 10, minIterations: 3, timeoutSeconds: 120, warmupSeconds: 2, checkedIterations: 20, sampleMillis: 5 }),
  /** Safety valve: a self-continuing chain of workflow rounds stops after this many rounds. */
  maxChainedRounds: z.number().int().min(1),
});
export type Config = z.infer<typeof ConfigSchema>;

/* ------------------------------------------------------------------ */
/* data/sessions/<sessionId>.json (one file per session, see store.ts)  */
/* ------------------------------------------------------------------ */

/**
 * Per-repetition measurements of one benchmark, column-wise (one entry per run, equal lengths).
 * Units are fixed: seconds and bytes. Taken from hyperfine's `--export-json` measurements.
 */
export const RunsSchema = z.object({
  wall: z.array(z.number()),
  cpu: z.array(z.number()),
  user: z.array(z.number()),
  system: z.array(z.number()),
  memory: z.array(z.number()),
  exit: z.array(z.number()),
});
export type Runs = z.infer<typeof RunsSchema>;

/**
 * Result of the in-process kernel loop of one benchmark in one session (harness/CONTRACT.md).
 * Every iteration is kept: cold = the first one, warm = the median after the warm-up cutoff.
 */
export const KernelSchema = z.object({
  clock: z.string(),
  budgetSeconds: z.number(),
  iterations: z.number().int(),
  /** sum of the per-iteration kernel times, seconds */
  kernelSeconds: z.number(),
  reason: z.enum(["budget", "iters"]),
  /** kernel time of every iteration, seconds, in order */
  durations: z.array(z.number()),
  /** start of every iteration relative to the start of the first, seconds */
  starts: z.array(z.number()),
  /** iterations compared with the reference hash, and how many matched */
  checked: z.number().int(),
  matched: z.number().int(),
  /** memory of the container's cgroup (anonymous memory), sampled by the host */
  memory: z
    .object({
      /** time-weighted mean over the timed kernel regions */
      avgBytes: z.number(),
      peakBytes: z.number(),
      /** mean over the whole run, including instance generation and decoding */
      runAvgBytes: z.number(),
      samples: z.number().int(),
    })
    .optional(),
  /** automatic flags, see core/analysis.ts */
  flags: z.array(z.string()).default([]),
});
export type Kernel = z.infer<typeof KernelSchema>;

/** Everything about one VM run that executed many benchmarks. Extra fields are allowed and kept. */
export const SessionSchema = z
  .object({
    id: z.string(),
    startedAt: z.string(),
    finishedAt: z.string(),
    durationSeconds: z.number(),
    repoCommit: z.string(),
    trigger: z.record(z.any()),
    runner: z.record(z.any()),
    host: z.object({ cpu: z.object({ model: z.string(), cores: z.number() }).passthrough() }).passthrough(),
    tooling: z.record(z.any()),
    containers: z.record(z.any()),
    config: z.record(z.any()),
    /** Planned benchmarks incl. the reason each was chosen, executed order and skipped ones. */
    plan: z.array(z.record(z.any())),
    order: z.array(z.string()),
    skipped: z.array(z.record(z.any())),
  })
  .passthrough();
export type Session = z.infer<typeof SessionSchema>;

export const MeasurementSchema = z
  .object({
    sessionId: z.string(),
    language: z.string(),
    version: z.string(),
    toolVersion: z.string(),
    variant: z.string(),
    variantSpec: z.record(z.any()),
    problem: z.string(),
    /** kernel: has a kernel loop and an end-to-end run; startup: end-to-end run only */
    kind: z.enum(["kernel", "startup"]),
    args: z.array(z.string()),
    containerImage: z.string(),
    sourceFile: z.string(),
    sourceHash: z.string(),
    inputSha256: z.string().optional(),
    inputBytes: z.number().optional(),
    buildCommand: z.string().optional(),
    buildSeconds: z.number().optional(),
    buildOutput: z.string().optional(),
    runCommand: z.string(),
    binarySize: z.number().optional(),
    /** incomplete: the kernel run hit its hard timeout */
    status: z.enum(["ok", "failed", "incomplete"]),
    error: z.string().optional(),
    /** the results matched the reference (kernel runs: hashes of the checked iterations; startup: stdout equalled expected.txt) */
    correct: z.boolean(),
    outputSha256: z.string().optional(),
    startedAt: z.string(),
    finishedAt: z.string(),
    loadAvgBefore: z.string().optional(),
    loadAvgAfter: z.string().optional(),
    hyperfineArgs: z.string().optional(),
    warmupRuns: z.number().optional(),
    /** end-to-end: hyperfine runs of one iteration, process start to exit */
    runs: RunsSchema.optional(),
    /** in-process kernel loop */
    kernel: KernelSchema.optional(),
  })
  .passthrough();
export type Measurement = z.infer<typeof MeasurementSchema>;

/** In-memory view: all measurements of one language, regrouped from the session files. */
export const LanguageDataSchema = z.object({
  language: z.string(),
  measurements: z.array(MeasurementSchema),
});
export type LanguageData = z.infer<typeof LanguageDataSchema>;

export const benchmarkKey = (m: { language: string; version: string; variant: string; problem: string }) =>
  `${m.language}|${m.version}|${m.variant}|${m.problem}`;

/** Session file on disk: the session, the distinct variant specs (by hash) and its measurements. */
export const SessionFileSchema = z.object({
  schemaVersion: z.literal(3),
  session: SessionSchema,
  variants: z.record(z.string(), z.record(z.any())),
  measurements: z.array(MeasurementSchema.extend({ variantSpec: z.string() })),
});
export type SessionFile = z.infer<typeof SessionFileSchema>;

export interface RawRuns {
  times: number[];
  memory: number[];
  user: number[];
  system: number[];
  exitCodes: number[];
}

/** Per-repetition arrays of a measurement. */
export function extractRuns(runs: Runs): RawRuns {
  return { times: runs.wall, memory: runs.memory, user: runs.user, system: runs.system, exitCodes: runs.exit };
}

/** Columns out of a hyperfine 2.x export (only the per-run measurements are kept). */
export function runsFromHyperfine(hf: { results: { measurements: any[] }[] }): Runs {
  const ms = hf.results[0]!.measurements;
  return {
    wall: ms.map((m) => m.time_wall_clock.value),
    cpu: ms.map((m) => m.time_cpu?.value ?? 0),
    user: ms.map((m) => m.time_user?.value ?? 0),
    system: ms.map((m) => m.time_system?.value ?? 0),
    memory: ms.map((m) => m.memory_peak_resident?.value ?? 0),
    exit: ms.map((m) => m.exit_code ?? 0),
  };
}
