import Link from "next/link";
import { meta } from "@/lib/meta";
import { MIN_SESSIONS_FOR_FINAL } from "@lb/core";
import { getModel, latestVersion, repoUrl } from "@/lib/model";

export const metadata = meta("Methodology: how language-bench measures speed", "How benchmarks are run on GitHub Actions, repeated on different days and hardware, corrected for machine speed using overlapping benchmarks and combined statistically.", "/methodology/");

export default function Methodology() {
  const m = getModel();
  const first = m.languages[0]!;
  const ex = { name: first.spec.name, version: latestVersion(first), variant: first.spec.variants.find((v) => v.default)!.name };
  return (
    <>
      <h1>Methodology</h1>
      <p className="lead">Everything is meant to be checkable. Every number on this site links to the raw iterations behind it, the exact source code, the build flags and the CI run that produced them.</p>

      <h2>What is a benchmark?</h2>
      <p>A benchmark is a unique combination of <strong>language version</strong> (for example {ex.name} {ex.version}), <strong>build setting</strong> (compiler, flags, runtime options; for example <code>{ex.variant}</code>) and <strong>problem</strong> (for example {m.problems[0]?.spec.title}). Each is measured many times:</p>
      <ul>
        <li><strong>Session</strong>: one GitHub Actions job on one fresh hosted VM. A session runs <em>many different benchmarks</em> (from all languages), each in the pinned official Docker image of its language. Hardware, kernel, OS image, Docker, hyperfine version and much more are recorded per session.</li>
        <li><strong>Iteration</strong>: one solve of one instance inside the language&apos;s harness (see below). A session runs a benchmark&apos;s kernel loop until it has accumulated ten seconds of kernel time, so fast kernels yield thousands of iterations and slow ones a handful. A separate one-iteration run, timed with <a href="https://github.com/sharkdp/hyperfine">hyperfine</a> 2.x, gives the end-to-end time of the whole process.</li>
        <li><strong>Scheduling</strong>: the planner always picks the benchmarks with the <em>fewest</em> completed sessions, never the same benchmark twice in one session. A configurable share of every session re-runs already measured benchmarks. New sessions keep being started until every tracked benchmark has the configured number of sessions; then nothing runs until a new language release or build setting appears.</li>
        <li>New releases are discovered automatically. For every language the first release of every calendar year since its oldest supported release is tracked (one release per year, as long as an official Docker image exists), plus the newest release; this is what the timelines show.</li>
      </ul>

      <h2>How one benchmark is timed</h2>
      <p>Every language has <strong>one harness</strong> that all its problems share; a problem implementation only decodes an instance and solves it. The <a href={`${repoUrl}/blob/main/harness/CONTRACT.md`}>harness contract</a> fixes the clock, the loop and the output, and a conformance test on a dummy problem checks every harness in CI.</p>
      <ul>
        <li><strong>The timer wraps only <code>solve</code>.</strong> Reading and decoding the instance, hashing the result and everything else happen outside the timed region, with the language&apos;s monotonic clock (nanoseconds where it has one). Anything that would otherwise reward a language for hiding work, such as lazy evaluation or unused results, is avoided because the result is fully hashed after every iteration.</li>
        <li><strong>The loop.</strong> Iterate until the summed kernel time reaches 10 s and at least 3 iterations ran. There is no other iteration cap; a hard timeout of 120 s marks a benchmark incomplete. Every iteration is recorded.</li>
        <li><strong>Cold, warm and end-to-end.</strong> <em>Cold</em> is the first iteration (JIT compilation, class loading, caches, lazy initialisation). <em>Warm</em> is the median of the iterations after the first 2 s of kernel time, which is what steady-state throughput looks like once a runtime has settled. <em>End-to-end</em> is a single iteration from process start to exit, so it contains the runtime&apos;s start-up. The leaderboard defaults to warm kernel time; cold and end-to-end are one click away. The start-up problem is measured end-to-end only.</li>
        <li><strong>Inputs.</strong> A new instance for every iteration, never reused, from one deterministic generator written once in C (<a href={`${repoUrl}/blob/main/tools/lbgen.c`}>lbgen</a>; instance <em>i</em> is a pure function of <em>i</em>, so every language solves the same sequence). It streams the instance to the program&apos;s standard input as length-prefixed little-endian binary and blocks while the timer runs, so it does not compete for the CPU. The file-processing task is the exception: a fresh CSV is written to tmpfs before each iteration. For JSON the harness reads the bytes untimed and only parsing is timed. Sieve, fannkuch, binary trees, n-body steps and the parallel reduction have no instance and run the same parameters each iteration.</li>
        <li><strong>Memory</strong> is measured from outside the process: a sampler on the host reads the anonymous memory of the container&apos;s cgroup every few milliseconds. We report the time-weighted average over the timed kernel regions (so instance generation and decoding do not count) and the peak.</li>
        <li><strong>Correctness</strong> is checked separately: after every iteration the harness hashes the complete, ordered result (floating-point values rounded) and the runner compares the hashes of the first iterations with the references from the generator. A benchmark whose result differs counts as failed and never enters the statistics.</li>
        <li><strong>Automatic flags</strong> mark suspicious results: a checksum mismatch, fewer than five iterations, an iteration far faster than the median (possible caching or skipped work), a warm-up curve that never settles, or a timeout. They are shown on the benchmark page and in the CSV.</li>
      </ul>

      <h2>Fair play</h2>
      <ul>
        <li>Each language runs in the official Docker image of a pinned version, so toolchains are reproducible.</li>
        <li>Standard library only (except where noted per problem), same algorithm, same parameters, identical results. A CI workflow rebuilds and re-runs any implementation that changes and fails if its results differ from the generator&apos;s references.</li>
        <li>Fast-math and FMA contraction are disabled so floating-point results are identical in every language.</li>
        <li>Within a session the order of all benchmarks is randomised, so slow drift or noisy neighbours do not systematically favour one language.</li>
        <li>Every build setting is published, including ones that tie the binary to the CPU (<code>-march=native</code>).</li>
      </ul>

      <h2>Statistics</h2>
      <p>Iterations in one session share the same VM and are correlated, so <strong>sessions are the independent samples</strong>. Iterations reduce noise within a session; they do not remove the systematic effect of a particular machine. We handle that effect statistically, without any calibration program:</p>
      <ol>
        <li><strong>Per session</strong>: median, MAD, mean, standard deviation, min and max of the iterations (the warm ones for kernel time). Outliers (beyond 3 scaled MADs) are flagged but never removed.</li>
        <li><strong>Machine factors from overlapping benchmarks</strong>: because the same benchmark is measured in several sessions, the speed difference between two machines is visible. Think of it as asking, for every machine, “how much longer does the same program take here than elsewhere?”. Formally, we fit <code>log(time) = benchmark + machine</code> to all sessions simultaneously (alternating least squares): each time is explained as the benchmark&apos;s own difficulty plus a per-machine offset, on a log scale so that offsets become multiplicative factors. The machine factor says how much slower or faster a session&apos;s VM was than the average machine. This corrects for different CPU models and for slow or fast hosts on a given day. It assumes a machine is uniformly faster or slower across workloads; memory-bound and compute-bound workloads can scale differently, which shows up as residual noise.</li>
        <li><strong>Operating-system effect</strong>: GitHub&apos;s <code>ubuntu-latest</code> image changes over time (Ubuntu 24 today, Ubuntu 26 from October 2026), and a different kernel or libc can favour some workloads (file I/O, process start-up, memory allocation) more than others. Every session records its OS image. The model gets one extra term, <code>log(time) = benchmark + machine + os[image, problem]</code>, shared by <em>all</em> sessions on the same image, so many sessions on one image pin down its effect together. The term is shrunk towards zero and centred per problem: a general speed shift of an image stays in the machine factors, and only the workload-specific deviation is attributed to the OS. With a single image the term is zero.</li>
        <li><strong>Across sessions</strong>: each benchmark&apos;s time on the average machine is the geometric mean of (session median ÷ machine factor ÷ OS factor). The 95% confidence interval comes from a cluster bootstrap (1000 iterations, deterministic seed) that resamples sessions, then iterations within each session. At most 100 evenly spaced iterations per session enter the bootstrap.</li>
        <li><strong>Index vs fastest</strong> = time of a benchmark divided by the time of the fastest benchmark on the same problem (whichever language, release or build that is, so the baseline is not always C), with a bootstrap interval for the ratio. Composite scores over several problems are geometric means of indices.</li>
        <li><strong>Memory</strong> is the time-weighted average memory of the timed kernel regions (and the peak), averaged over sessions; for the start-up task, the mean peak resident set size of hyperfine&apos;s runs.</li>
        <li>Does the correction work? The <Link href="/validation/">validation page</Link> shows how much the same benchmark disagrees between sessions before and after it.</li>
        <li>Benchmarks that are not (yet) linked to the main group of sessions through shared benchmarks, or that have fewer than {MIN_SESSIONS_FOR_FINAL} sessions, are labelled <em>provisional</em>.</li>
      </ol>

      <h2>Data and reproducibility</h2>
      <p>Everything is stored append-only in <a href={`${repoUrl}/tree/main/data`}>data/</a>: one <code>sessions/&lt;session&gt;.json</code> file per session with its full environment (hardware, OS, kernel, Docker, hyperfine, runner image, trigger, scheduler decisions) and every measurement of that session: the kernel time of every iteration (so cold, warm and the whole warm-up curve), memory statistics and flags, the wall-clock, CPU, memory and exit-code values of the end-to-end run from hyperfine&apos;s JSON export, build and run commands and the source hash. Derived numbers are never stored; they are computed when the site is built using the open <a href={`${repoUrl}/tree/main/core/src`}>statistics code</a>, which is unit-tested on synthetic data with known machine factors. You can re-run any benchmark locally with Docker.</p>

      <h2>Limits</h2>
      <ul>
        <li>GitHub-hosted runners are shared VMs: expect noise, and different CPU models over time. That is exactly why every benchmark is repeated across sessions.</li>
        <li>Micro-benchmarks measure specific workloads. A language&apos;s result on one problem says little about a real application.</li>
        <li>Implementations are idiomatic-but-reasonable, not the most extreme hand-tuned versions. Pull requests with better implementations are welcome; CI verifies correctness.</li>
        <li>Check GitHub&apos;s Actions usage limits and terms before forking: public repositories use free standard runners, jobs are limited to 6 hours.</li>
      </ul>
    </>
  );
}
