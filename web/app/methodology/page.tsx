import { meta } from "@/lib/meta";
import { MIN_SESSIONS_FOR_FINAL } from "@lb/core";
import { getModel, repoUrl } from "@/lib/model";

export const metadata = meta("Methodology: how language-bench measures speed", "How benchmarks are run on GitHub Actions, repeated on different days and hardware, normalised with a hardware anchor and combined statistically.", "/methodology/");

export default function Methodology() {
  const m = getModel();
  return (
    <>
      <h1>Methodology</h1>
      <p className="lead">Everything is meant to be checkable. Every number on this site links to the raw repetitions behind it, the exact source code, the build flags and the CI run that produced them.</p>

      <h2>What is a benchmark?</h2>
      <p>A benchmark is a unique combination of <strong>language version</strong> (for example Python 3.13), <strong>build setting</strong> (compiler, flags, runtime options; for example <code>gcc -O3 -march=native</code>) and <strong>problem</strong> (for example N-body). Each is measured many times:</p>
      <ul>
        <li><strong>Session</strong>: one GitHub Actions job on one fresh hosted VM at one moment. Its hardware, kernel, glibc and Docker image digest are recorded.</li>
        <li><strong>Repetition</strong>: one execution inside a session. Between 10 and 30 repetitions (after a warm-up) are made, as many as fit a time budget, recorded with <a href="https://github.com/sharkdp/hyperfine">hyperfine</a> 2.x which also reports peak resident memory per run.</li>
        <li>Sessions are scheduled several times a week at varying hours, so they land on different days and different hosts.</li>
      </ul>

      <h2>Fair play</h2>
      <ul>
        <li>Each language runs in the official Docker image of a pinned version, so toolchains are reproducible.</li>
        <li>Standard library only (except where noted per problem), same algorithm, same parameters, identical output. A CI workflow rebuilds and re-runs any implementation that changes and fails if its output differs from the reference.</li>
        <li>Fast-math and FMA contraction are disabled so floating-point results are identical in every language.</li>
        <li>Within a session the order of all benchmarks is randomised, so slow drift or noisy neighbours do not systematically favour one language.</li>
        <li>Every build setting is published, including ones that tie the binary to the CPU (<code>-march=native</code>).</li>
      </ul>

      <h2>Statistics</h2>
      <p>Repetitions in one session share the same VM and are correlated, so <strong>sessions are the independent samples</strong>. Repetitions reduce noise within a session; they do not remove systematic bias of a CPU, a host or a runtime, which is why we aggregate across independent sessions.</p>
      <ol>
        <li><strong>Per session</strong>: median, MAD, mean, standard deviation, min and max of the repetitions. Outliers (beyond 3 scaled MADs) are flagged but never removed.</li>
        <li><strong>Hardware anchor</strong>: every session also runs a frozen C program (<a href={`${repoUrl}/blob/main/runner/anchor/anchor.c`}>anchor.c</a>) three times (start, middle, end). Dividing a benchmark&apos;s median by the anchor median from the same VM yields a hardware-independent ratio. A limit of this approach: the anchor is compute-bound, so for memory- or I/O-bound problems it only partly corrects hardware differences.</li>
        <li><strong>Across sessions</strong>: the score is the geometric mean of the per-session ratios. The 95% confidence interval comes from a cluster bootstrap (1000 iterations, deterministic seed) that resamples sessions, then repetitions within each session.</li>
        <li><strong>Seconds on the reference machine</strong> = score × median anchor time of all sessions ({m.analysis.sessionCount} so far). Shown so that numbers have a unit; the ratios are what matter.</li>
        <li><strong>Index vs C</strong> = the score of a benchmark divided by the score of the newest C release (default build) on the same problem, with a bootstrap interval for the ratio. Composite scores over several problems are geometric means of indices.</li>
        <li><strong>Between-session spread</strong> and an intraclass-correlation style share of variance that is due to sessions (hosts and days) rather than repetition noise are shown on each detail page.</li>
        <li>Results with fewer than {MIN_SESSIONS_FOR_FINAL} sessions are labelled <em>provisional</em>.</li>
      </ol>

      <h2>Data and reproducibility</h2>
      <p>All sessions are stored append-only in <a href={`${repoUrl}/tree/main/data`}>data/&lt;language&gt;.json</a>, one file per language, with the raw per-repetition times and peak memory. Derived numbers are never stored; they are computed when the site is built using the open <a href={`${repoUrl}/tree/main/core/src`}>statistics code</a>, which is unit-tested on synthetic data with known hardware factors. You can re-run any benchmark locally with Docker.</p>

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
