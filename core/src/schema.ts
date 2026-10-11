import { z } from "zod";

/* ------------------------------------------------------------------ */
/* languages/<id>/language.json                                        */
/* ------------------------------------------------------------------ */

export const VariantSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9._-]*$/),
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
  /** Where to learn about new releases (used by the release detector). */
  releaseFeed: z.string().optional(),
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
/* data/<language>.json                                                */
/* ------------------------------------------------------------------ */

export const HyperfineRawSchema = z.object({
  /** wall-clock seconds for every repetition (raw, in execution order) */
  times: z.array(z.number()),
  /** peak resident set size in bytes for every repetition */
  memory: z.array(z.number()),
  /** user / system CPU seconds for every repetition */
  user: z.array(z.number()).optional(),
  system: z.array(z.number()).optional(),
  exitCodes: z.array(z.number()),
});
export type HyperfineRaw = z.infer<typeof HyperfineRawSchema>;

export const SessionSchema = z.object({
  date: z.string(), // ISO timestamp
  actionsRunUrl: z.string().optional(),
  repoCommit: z.string(),
  image: z.string(),
  imageDigest: z.string().optional(),
  hyperfineVersion: z.string(),
  hardware: z.object({
    cpuModel: z.string(),
    cores: z.number(),
    ramBytes: z.number(),
    arch: z.string(),
  }),
  kernel: z.string(),
  osRelease: z.string().optional(),
  glibc: z.string().optional(),
  /** Description of the fixed anchor workload (identical in every session). */
  anchorSpec: z.string(),
  /** Randomised execution order of "variant/problem" within the session. */
  order: z.array(z.string()).optional(),
  /** Calibration runs of the anchor on this very VM (start / middle / end of the session). */
  anchors: z.array(z.object({ at: z.enum(["start", "middle", "end"]), hyperfine: HyperfineRawSchema })),
});
export type Session = z.infer<typeof SessionSchema>;

export const MeasurementSchema = z.object({
  sessionId: z.string(),
  version: z.string(),
  toolVersion: z.string(),
  variant: z.string(),
  problem: z.string(),
  buildCommand: z.string().optional(),
  runCommand: z.string(),
  sourceHash: z.string(),
  /** Output matched problems/<id>/expected.txt */
  correct: z.boolean(),
  binarySize: z.number().optional(),
  hyperfine: HyperfineRawSchema,
});
export type Measurement = z.infer<typeof MeasurementSchema>;

export const LanguageDataSchema = z.object({
  schemaVersion: z.literal(1),
  language: z.string(),
  sessions: z.record(z.string(), SessionSchema),
  measurements: z.array(MeasurementSchema),
});
export type LanguageData = z.infer<typeof LanguageDataSchema>;

export const benchmarkKey = (m: { version: string; variant: string; problem: string }) =>
  `${m.version}|${m.variant}|${m.problem}`;
