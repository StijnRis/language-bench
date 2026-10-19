import { NoData } from "@/components/Bits";
import Breadcrumbs from "@/components/Breadcrumbs";
import Picker from "@/components/Picker";
import { meta } from "@/lib/meta";
import { getModel, latestVersion, snapshotCells } from "@/lib/model";

export const metadata = meta(
  "Which programming language should I pick? Weighted benchmark ranking",
  "Weigh the benchmark tasks that matter for your workload (numeric, JSON, hash maps, sorting, start-up, memory) and get a personal language ranking from measured data.",
  "/pick/",
);

export default function Pick() {
  const m = getModel();
  const cells = snapshotCells(m);
  return (
    <>
      <Breadcrumbs trail={[{ name: "Pick for me", href: "/pick/" }]} />
      <h1>Pick for me</h1>
      <p className="lead">The leaderboard weighs every task equally. Your workload probably does not: set how much each task matters, and how much memory matters next to speed, and the ranking updates live. The link keeps your settings, so you can share it.</p>
      {!m.hasData ? <NoData /> : (
        <Picker
          cells={cells.map((c) => ({ language: c.language, problem: c.problem, idx: { warm: c.by.warm?.index ?? null, cold: c.by.cold?.index ?? null, e2e: c.by.e2e?.index ?? null }, memoryMB: c.memoryMB }))}
          languages={m.languages.map((l) => ({ id: l.spec.id, name: l.spec.name, version: latestVersion(l) }))}
          problems={m.problems.filter((p) => p.spec.scored).map((p) => ({ id: p.spec.id, title: p.spec.title, tags: p.spec.tags }))}
        />
      )}
    </>
  );
}
