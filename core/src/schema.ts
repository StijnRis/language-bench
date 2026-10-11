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
});

export const LanguageSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string(),
  /** Language id used for syntax highlighting. */
  highlight: z.string(),
  website: z.string().url(),
  description: z.string(),
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
   * automatically from this source: the newest `trackedVersionsPerLanguage` releases are tracked.
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
  /** What this workload reveals. */
  reveals: z.string(),
  /** What to be careful about when reading the numbers. */
  caveat: z.string(),
  tags: z.array(z.string()).min(1),
  /** Counted in aggregate scores? (the startup problem is not) */
  scored: z.boolean().default(true),
  /** Arguments passed to the program. {input} = generated input file path. */
  args: z.array(z.string()).default([]),
  /** Optional input generator, run once: node <generator> <outFile> */
  input: z.object({ generator: z.string(), file: z.string() }).optional(),
  /** Hyperfine repetition policy: as many runs as fit the budget, within [min, max]. */
  runs: z.object({ min: z.number().default(10), max: z.number().default(30) }).default({}),
  /** Time budget per measurement in seconds. */
  budgetSeconds: z.number().default(60),
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
  /** Sessions started in parallel per workflow round. */
  sessionsPerRound: z.number().int().min(1),
  /** Share of each session spent re-running already measured benchmarks (to calibrate hardware). */
  overlapFraction: z.number().min(0).max(1),
  /** ...but at least this many (when enough measured benchmarks exist). */
  minOverlap: z.number().int().min(0),
  /** Newest N releases per language are tracked. */
  trackedVersionsPerLanguage: z.number().int().min(1),
  /** Give up on a benchmark after this many failed attempts. */
  maxAttempts: z.number().int().min(1),
  /** A session stops starting new benchmarks after this long. */
  sessionTimeBudgetMinutes: z.number().min(1),
  /** Clamps problem.json repetition policy. */
  repetitions: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
  /** Multiplies every problem's time budget (use < 1 while testing). */
  budgetSecondsScale: z.number().positive(),
  warmupRuns: z.number().int().min(0),
  /** Safety valve: a self-continuing chain of workflow rounds stops after this many rounds. */
  maxChainedRounds: z.number().int().min(1),
});
export type Config = z.infer<typeof ConfigSchema>;

/* ------------------------------------------------------------------ */
/* data/sessions.json and data/<language>.json                          */
/* ------------------------------------------------------------------ */

/** Verbatim `hyperfine --export-json` output (schema_version 2). Stored untouched. */
export const HyperfineExportSchema = z
  .object({
    schema_version: z.number(),
    results: z.array(z.object({ measurements: z.array(z.any()) }).passthrough()).min(1),
  })
  .passthrough();
export type HyperfineExport = z.infer<typeof HyperfineExportSchema>;

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

export const SessionsFileSchema = z.object({
  schemaVersion: z.literal(2),
  sessions: z.record(z.string(), SessionSchema),
});
export type SessionsFile = z.infer<typeof SessionsFileSchema>;

export const MeasurementSchema = z
  .object({
    sessionId: z.string(),
    language: z.string(),
    version: z.string(),
    toolVersion: z.string(),
    variant: z.string(),
    variantSpec: z.record(z.any()),
    problem: z.string(),
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
    status: z.enum(["ok", "failed"]),
    error: z.string().optional(),
    /** stdout equalled problems/<id>/expected.txt */
    correct: z.boolean(),
    outputSha256: z.string().optional(),
    startedAt: z.string(),
    finishedAt: z.string(),
    loadAvgBefore: z.string().optional(),
    loadAvgAfter: z.string().optional(),
    hyperfineArgs: z.string().optional(),
    warmupRuns: z.number().optional(),
    hyperfine: HyperfineExportSchema.optional(),
  })
  .passthrough();
export type Measurement = z.infer<typeof MeasurementSchema>;

export const LanguageDataSchema = z.object({
  schemaVersion: z.literal(2),
  language: z.string(),
  measurements: z.array(MeasurementSchema),
});
export type LanguageData = z.infer<typeof LanguageDataSchema>;

export const benchmarkKey = (m: { language: string; version: string; variant: string; problem: string }) =>
  `${m.language}|${m.version}|${m.variant}|${m.problem}`;

export interface RawRuns {
  times: number[];
  memory: number[];
  user: number[];
  system: number[];
  exitCodes: number[];
}

/** Per-repetition arrays out of a verbatim hyperfine 2.x export. */
export function extractRuns(hf: HyperfineExport): RawRuns {
  const ms = hf.results[0]!.measurements as any[];
  return {
    times: ms.map((m) => m.time_wall_clock.value),
    memory: ms.map((m) => m.memory_peak_resident?.value ?? 0),
    user: ms.map((m) => m.time_user?.value ?? 0),
    system: ms.map((m) => m.time_system?.value ?? 0),
    exitCodes: ms.map((m) => m.exit_code ?? 0),
  };
}
