<p align="center"><img src="docs/logo.svg" width="96" alt="language-bench logo"></p>

# language-bench

![Homepage screenshot](docs/screenshot.png)

_Screenshot of the live site, refreshed automatically after every deploy by `.github/workflows/screenshot.yml`._

Transparent speed and memory benchmarks of 25 programming languages (C, C++, Rust, Go, Java, Scala, C#, F#, Dart, Julia, Node.js, Bun, Deno, Python, PyPy, R, Ruby, PHP, Perl, Lua, Haskell, OCaml, Nim, Elixir, Fortran; see `languages/`) on a set of workloads (see `problems/`;
N-body, binary trees, JSON parsing, hash map, sorting, string operations, parallel reduction, file
processing, start-up, matrix multiply, fannkuch, prime sieve). Results are measured on GitHub Actions, repeated on different days and hardware,
combined with documented statistics, and published as a static site.

## How it works

- **Benchmark** = language version + build setting (compiler flags, runtime options) + problem.
- **Session** = one CI job on one fresh VM running *many* benchmarks (all languages) in randomised order, each with hyperfine repetitions. The planner picks the least-measured benchmarks and re-runs some already measured ones; those overlaps let the statistics separate machine speed from benchmark speed (`log time = benchmark + machine`).
- **Data** is append-only: one file per session, `data/sessions/<sessionId>.json` (full environment of the session plus every measurement with its per-repetition times and memory as columns); files are only ever added, never rewritten, and nothing derived is stored.
- **Statistics** (`core/src/stats.ts`): sessions are the independent samples; machine factors fitted from overlapping benchmarks; geometric mean over sessions; cluster-bootstrap 95% CIs.
- **Automation**: `bench.yml` discovers new language releases, plans sessions from `lb.config.json` (target sessions per benchmark, session size, overlap, ...; the number of parallel sessions scales with the work that is left, up to `maxSessionsPerRound`), runs them, commits the data and re-triggers itself until all tracked benchmarks have enough data.
- **Site** (`web/`, Next.js static export) computes everything from the raw data at build time; every number links to its sessions, source, flags and CI run.
  - *Leaderboard / Pick for me*: the task, metric and task weights live in the query string (`?task=sort&metric=memory`, `/pick/?w=sort:5,hashmap:0&mem=50`), so every view is a shareable link; tables export CSV, `/results.csv` has every benchmark, `/badges/<language>.svg` is a README badge.
  - *Validation* (`/validation/`): how much the same benchmark disagrees across sessions before and after the machine-speed correction.
  - Share cards are generated at build time (`/og/<kind>/<id>.png`); pages carry JSON-LD (Dataset, FAQ, breadcrumbs).

## Layout

| Path | Purpose |
| --- | --- |
| `languages/<id>/` | one folder per language: `language.json` (versions, build variants), `releases.json`, `impl/<problem>/` sources |
| `problems/<id>/` | `problem.json`, optional `generate.mjs`, `expected.txt` |
| `data/` | measurements (written by CI only) |
| `runner/` | CLI: verify, bench, merge, matrix |
| `core/` | schemas, discovery, statistics (tested) |
| `web/` | website |

Add a language by adding a `languages/<id>/` folder (`language.json` with name, colour and build variants, `icon.svg`, `impl/<problem>/`); the site picks up its name, colour, icon and every text that lists languages from there; add a problem by adding a `problems/<id>/` folder. Nothing else needs registering.

## Versions, flags and sources per version

- `versions` in `language.json` is curated by hand: about one release per year, as far back as the benchmark sources compile. `discover-versions` only appends releases that are newer than the newest tracked one (it never removes or rewrites entries).
- **Different flags per version:** a variant has `build`/`run` plus optional `rules: [{ "minVersion": "10", "build": "..." }]`. The rule with the highest `minVersion` that is <= the benchmarked version overrides the fields it lists (example: C++ uses `-std=c++14` before gcc 10 and `-std=c++20` from gcc 10). `minVersion` on the variant itself skips the variant on older versions (example: `ruby --yjit` from 3.1).
- **Different code per version:** `impl/<problem>/main.ext` is shared by all versions. To use another file from some version on, add `impl/<problem>/@<minVersion>/main.ext` (for example `impl/sort/@1.23/main.go`); the highest `@` folder that is <= the version wins, so only files that really differ are copied. `{src}` in the commands points to the chosen folder, and the site shows the source that was actually used.

## Build speed

`pnpm build` computes the statistics once (`web/scripts/warm-cache.ts`, bootstrap loop on typed arrays) and caches them in `web/.cache/` keyed by the data files and statistics code, so the Next.js workers read them instead of recomputing; per-cell intervals and highlighted sources are memoised. A full static export takes about a minute.

## Commands

```bash
pnpm install
pnpm test                                   # statistics tests
pnpm lb verify python --version 3.14        # build + check outputs in Docker
pnpm lb plan                                # what would run next (writes .work/plans)
pnpm lb session --plan .work/plans/session-1.json --out .work/frag/s1.json --reps 3   # run a session locally (needs Docker)
pnpm build                                  # static site -> web/out
# smoke tests (Playwright) against the exported site
SITE_URL=http://localhost:4173 pnpm build && pnpm --filter @lb/web e2e:install && pnpm --filter @lb/web e2e
```

CI: `verify.yml` (changed implementations must print `expected.txt`; runs only when something relevant changed, and `bench.yml` starts it for newly discovered versions; no schedule), `bench.yml` (self-continuing sessions, appends data), `deploy.yml` (GitHub Pages), `e2e.yml` (builds the site and runs the Playwright smoke tests in `web/e2e`).
Read the [methodology](web/app/methodology/page.tsx) for details and limits.
