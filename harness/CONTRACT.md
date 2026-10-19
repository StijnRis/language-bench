# Harness contract

Every language has **one harness** in `languages/<id>/harness/`, shared by all its problems. A problem
implementation (`languages/<id>/impl/<problem>/<sourceFile>`) only provides the kernel; the harness owns
reading instances, timing, the loop, consuming results and output. Harness and problem are built together,
with the same flags (the `build` command of the build setting compiles both).

## Problem API

Five operations, spelled in each language's own idiom (see the harness of the language for the exact names):

| operation | when | timed |
| --- | --- | --- |
| `setup(params)` | once, before the loop; the program arguments from `problem.json` (`args`) | no |
| `decode(input) -> instance` | every iteration; `input` is the raw bytes of the instance (stream problems), the path of the file (file problems) or nothing (problems without an instance); builds the problem's own data structure | no |
| `solve(instance) -> result` | every iteration | **yes** |
| `emit(result, sink)` | every iteration, after the timer stopped: calls `sink(w)` with each canonical result word `w` (a 64-bit integer), in order | no |
| `release(instance, result)` | optional, every iteration after `emit` (frees memory, deletes the file) | no |

`solve` must do the complete work, including everything a user of the result would need (sorted array
built, map filled, ...). It must not read the clock, print, or touch the standard streams. Statically typed
languages pass `instance` and `result` as opaque handles; languages without generics keep them in module state.

## Canonical result words

The harness hashes the words `emit` produces. Floating-point values are rounded: `w = floor(x * 1e9 + 0.5)`.
The words per problem (the reference implementation is `tools/lbgen.c`; `lbgen words <problem> <i>` prints them):

| problem | input | words |
| --- | --- | --- |
| sort | `int32[2000000]` | the sorted array |
| hashmap | `int32[1000000]` insert keys, then `int32[1000000]` lookup keys | distinct keys, sum of `key * count`, sum of the counts of all lookup keys that exist |
| matmul | `int32 n`, `float64[n*n]` A, `float64[n*n]` B (row-major, integer valued) | the n*n elements of C = A*B, row-major, rounded to integers |
| nbody | 5 x `float64[7]`: x y z vx vy vz mass (velocities per year) | rounded energy after offsetting the momentum, rounded energy after `args[0]` steps of dt = 0.01 |
| string-ops | UTF-8 text (words separated by one space, padded with spaces) | byte length, number of code points, number of spaces + 1, number of non-overlapping `er`, sum of the bytes with `' '` replaced by `'_'` |
| json-parse | one JSON document (padded with whitespace), kept as bytes | objects, sum of all integers, total length of all string *values* (unescaped, keys excluded), `true` count, `null` count |
| file-processing | a CSV file `id,word,value` | lines, sum of values, distinct words, count of the most frequent word (ties: smallest word), byte length of that word, its bytes |
| binary-trees | none (`args[0]` = depth) | `check(stretch tree)`, then `iterations, iterations * check` per depth 4, 6, .., max, then `check(long lived tree)` |
| fannkuch | none (`args[0]` = n) | checksum, max flips |
| sieve | none (`args[0]` = n) | number of primes, largest prime, sum of primes |
| parallel-reduce | none (`args[0]` = n, `args[1]` = workers) | number of primes below n |

The hash is over the words in order, `h1 = (h1 * 1000003 + (w mod 2147483647)) mod 2147483647` and
`h2 = (h2 * 999983 + (w mod 2147483629)) mod 2147483629` (mod is the non-negative remainder), starting at
17 and 19; finally the number of words is mixed in as one more word. All products stay below 2^53, so
even a language that only has doubles computes it exactly. `CHECK=h1:h2`.

## Instances

`tools/lbgen.c` is the one generator. Instance `i` is a pure function of `i`, so every language solves the same
sequence. Iteration 1 uses instance `LB_START` (default 0), iteration 2 the next one, ... and an instance is never
reused. Stream problems arrive on **standard input**, each as an unsigned 64-bit little-endian length followed by that
many bytes; numbers inside are little-endian `int32` / `float64`. The generator writes in small chunks and blocks
on the pipe, so it does no work while a benchmark is timed. File problems: before each iteration the harness runs
`$LB_GEN file <problem> <i> $LB_FILE` (untimed; the generator writes the file to tmpfs), passes the path to `decode`,
and removes the file after the iteration.

## Loop

Environment (set by the runner): `LB_INPUT` = `stream` | `file` | `none`, `LB_BUDGET_SECONDS` (default 10),
`LB_MIN_ITERS` (default 3), `LB_MAX_ITERS` (default 0 = no limit; 1 gives the end-to-end run, small values the
validation run), `LB_START`, `LB_FILE` (default `/dev/shm/lb-input`), `LB_GEN` (default `/usr/local/bin/lbgen`),
`LB_PROBLEM` (file problems).

```
setup(params)
repeat:
    read the next instance, decode it                  # untimed
    t0 = clock(); result = solve(instance); t1 = clock()
    words = emit(result) -> hash                       # untimed
    release
until  (sum of (t1 - t0) >= budget and iterations >= min)  or  iterations == max
```

There is no iteration cap besides `LB_MAX_ITERS`. The runner adds a hard wall-clock timeout (120 s); a
benchmark that hits it is incomplete and not reported.

## Clock

`t0`/`t1` come from a monotonic clock with at least microsecond resolution (nanosecond where the language has
one; `CLOCK_MONOTONIC` on Linux). Times are integers in nanoseconds on that clock. The harness prints one wall-clock reading
(`CLOCK_REALTIME`, nanoseconds) next to the monotonic reading taken at the same moment; the host aligns its memory
samples with the timed regions through it. A language whose standard library has no suitable clock states its
substitute in the `LB` line (`clock=`).

## Output

Buffered, printed to standard output after the loop (outside any timed region):

```
LB 1 clock=<name>
START mono=<ns> wall=<ns>
ITER 1 t0=<ns> t1=<ns> check=<h1>:<h2>
ITER 2 ...
DONE iters=<n> kernel_ns=<sum of t1-t0> reason=<budget|iters|eof>
```

Exit status 0 when the loop ended normally. If the input ends early (`eof`) the exit status is 1.

## Conformance

`pnpm lb conformance <language>` builds the harness of every build setting with the `conformance` problem
(`languages/<id>/harness/conformance.*`, a tiny kernel over 4096 integers) in the language's Docker image and checks:
output format, `t1 >= t0`, monotonic timestamps, at least `LB_MIN_ITERS` iterations, the budget rule, `LB_MAX_ITERS`,
no reuse of instances (every `check` equals the reference hash of the right instance) and exit status. CI runs it in
`verify.yml` for every language whose harness changed.
