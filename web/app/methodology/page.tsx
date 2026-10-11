import { meta } from "@/lib/meta";
import { MIN_SESSIONS_FOR_FINAL } from "@lb/core";
import { getModel, repoUrl } from "@/lib/model";

export const metadata = meta("Methodology: how language-bench measures speed", "How benchmarks are run on GitHub Actions, repeated on different days and hardware, corrected for machine speed using overlapping benchmarks and combined statistically.", "/methodology/");

export default function Methodology() {
  const m = getModel();
  return (
    <>
      <h1>Methodology</h1>
      <p className="lead">Everything is meant to be checkable. Every number on this site links to the raw repetitions behind it, the exact source code, the build flags and the CI run that produced them.</p>

      <h2>What is a benchmark?</h2>
      <p>A benchmark is a unique combination of <strong>language version</strong> (for example Python 3.14), <strong>build setting</strong> (compiler, flags, runtime options; for example <code>gcc -O3 -march=native</code>) and <strong>problem</strong> (for example N-body). Each is measured many times:</p>
      <ul>
        <li><strong>Session</strong>: one GitHub Actions job on one fresh hosted VM. A session runs <em>many different benchmarks</em> (from all languages), each in the pinned official Docker image of its language. Hardware, kernel, OS image, Docker, hyperfine version and much more are recorded per session.</li>
        <li><strong>Repetition</strong>: one execution inside a session, recorded with <a href="https://github.com/sharkdp/hyperfine">hyperfine</a> 2.x (wall-clock time, user/system CPU time and peak resident memory of every run). The number of repetitions is configurable and bounded by a time budget.</li>
        <li><strong>Scheduling</strong>: the planner always picks the benchmarks with the <em>fewest</em> completed sessions, never the same benchmark twice in one session. A configurable share of every session re-runs already measured benchmarks. New sessions keep being started until every tracked benchmark has the configured number of sessions; then nothing runs until a new language release or build setting appears.</li>
        <li>New releases are discovered automatically (the newest N releases per language are tracked).</li>
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
      <p>Repetitions in one session share the same VM and are correlated, so <strong>sessions are the independent samples</strong>. Repetitions reduce noise within a session; they do not remove the systematic effect of a particular machine. We handle that effect statistically, without any calibration program:</p>
      <ol>
        <li><strong>Per session</strong>: median, MAD, mean, standard deviation, min and max of the repetitions. Outliers (beyond 3 scaled MADs) are flagged but never removed.</li>
        <li><strong>Machine factors from overlapping benchmarks</strong>: because the same benchmark is measured in several sessions, the speed difference between two machines is visible. We fit <code>log(time) = benchmark + machine</code> to all sessions simultaneously (alternating least squares). The machine factor says how much slower or faster a session&apos;s VM was than the average machine. This corrects for different CPU models and for slow or fast hosts on a given day. It assumes a machine is uniformly faster or slower across workloads; memory-bound and compute-bound workloads can scale differently, which shows up as residual noise.</li>
        <li><strong>Across sessions</strong>: each benchmark&apos;s time on the average machine is the geometric mean of (session median ÷ machine factor). The 95% confidence interval comes from a cluster bootstrap (1000 iterations, deterministic seed) that resamples sessions, then repetitions within each session.</li>
        <li><strong>Index vs C</strong> = time of a benchmark divided by the time of the newest C release (default build) on the same problem, with a bootstrap interval for the ratio. Composite scores over several problems are geometric means of indices.</li>
        <li><strong>Memory</strong> is the mean over repetitions of hyperfine&apos;s per-run peak resident set size, averaged over sessions.</li>
        <li>Benchmarks that are not (yet) linked to the main group of sessions through shared benchmarks, or that have fewer than {MIN_SESSIONS_FOR_FINAL} sessions, are labelled <em>provisional</em>.</li>
      </ol>

      <h2>Data and reproducibility</h2>
      <p>Everything is stored append-only in <a href={`${repoUrl}/tree/main/data`}>data/</a>: <code>sessions.json</code> (full environment of every session: hardware, OS, kernel, Docker, hyperfine, runner image, trigger, scheduler decisions) and one <code>&lt;language&gt;.json</code> per language with every measurement, including the verbatim hyperfine export, build and run commands, source hash, input hash and output hash. Derived numbers are never stored; they are computed when the site is built using the open <a href={`${repoUrl}/tree/main/core/src`}>statistics code</a>, which is unit-tested on synthetic data with known machine factors. You can re-run any benchmark locally with Docker.</p>

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
