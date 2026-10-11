# language-bench

Transparent speed and memory benchmarks of **C, Rust, Go, Node.js and CPython** on nine workloads
(N-body, binary trees, JSON parsing, hash map, sorting, string operations, parallel reduction, file
processing, start-up). Results are measured on GitHub Actions, repeated on different days and hardware,
combined with documented statistics, and published as a static site.

## How it works

- **Benchmark** = language version + build setting (compiler flags, runtime options) + problem.
- **Session** = one CI job on one fresh VM; each runs ≥10 (up to 30) hyperfine repetitions in randomised order, plus a frozen *hardware anchor* program to cancel out machine speed.
- **Data** is append-only: `data/<language>.json` holds all raw repetitions (time + peak RSS), environment of each session once, nothing derived.
- **Statistics** (`core/src/stats.ts`): sessions are the independent samples; geometric mean of anchor-normalised ratios; cluster-bootstrap 95% CIs.
- **Site** (`web/`, Next.js static export) computes everything from the raw data at build time; every number links to its sessions, source, flags and CI run.

## Layout

| Path | Purpose |
| --- | --- |
| `languages/<id>/` | one folder per language: `language.json` (versions, build variants), `releases.json`, `impl/<problem>/` sources |
| `problems/<id>/` | `problem.json`, optional `generate.mjs`, `expected.txt` |
| `data/` | measurements (written by CI only) |
| `runner/` | CLI: verify, bench, merge, matrix |
| `core/` | schemas, discovery, statistics (tested) |
| `web/` | website |

Add a language by adding a `languages/<id>/` folder; add a problem by adding a `problems/<id>/` folder. Nothing else needs registering.

## Commands

```bash
pnpm install
pnpm test                                   # statistics tests
pnpm lb verify python --version 3.14        # build + check outputs in Docker
pnpm lb bench rust 1.99 --reps 5 --dry-run  # try a session locally (needs Docker)
pnpm build                                  # static site -> web/out
```

CI: `verify.yml` (changed implementations must print `expected.txt`), `bench.yml` (scheduled sessions, appends data), `deploy.yml` (GitHub Pages).
Read the [methodology](web/app/methodology/page.tsx) for details and limits.
