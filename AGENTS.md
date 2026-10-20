# Working agreements

## Git

- Always commit everything and merge it into `main`. Work in small commits; when a piece of work is done it is on
  `main` and pushed. If a session works on a side branch, merge that branch into `main` and push `main`; never leave
  finished work on a side branch or uncommitted.
- Commit messages say what changed and why.

## Migrate completely, no fallbacks (clean break)

When a design changes, migrate everything to the new design in the same change. This is sometimes called a
*clean break* or *fail-fast* migration (the opposite of backward-compatible shims).

- Do not add fallbacks, compatibility branches, default values that hide missing data, or "if the new thing is
  absent use the old thing" paths. One way of doing each thing.
- Data in an old format is deleted, not supported. This includes measurements taken with an older way of
  measuring: when the methodology changes significantly, delete the old data in the same change instead of mixing
  incomparable numbers. Never keep dead formats, flags, fields or code paths "just in case".
  Git history is the archive.
- Remove the old code, docs, tests and config in the same commit that introduces the replacement. Grep for leftovers
  (names, strings, docs) before finishing.
- Missing or malformed input is an error, not a case to paper over.
- Never write fallbacks anywhere (code, config, workflows, docs). Fail fast: stop at the first problem with a clear
  error instead of continuing with a substitute value or a degraded result.

## Keep it simple

- Do the simplest thing that works. No extra options, abstractions or machinery that were not asked for.
- Prefer changing a number in `lb.config.json` over adding code.

## Errors must be easy to find

- Fail loudly and early with a message that says what went wrong, where (file, benchmark key, session id) and what to do.
- Never swallow errors (`catch {}`, ignored exit codes, silent `continue`). If something is intentionally skipped,
  log it explicitly with the reason.
- A validation step (`pnpm lb validate`, the schemas) rejects bad data instead of the site quietly rendering without it.
- CI output should point at the failing benchmark or file in the first lines of the failure.
