import Link from "next/link";
import ComparePicker from "@/components/ComparePicker";
import { meta } from "@/lib/meta";
import { getModel, pairs } from "@/lib/model";

export const metadata = meta("Language head-to-head comparisons", "Pick two languages, such as Rust vs Go or Node.js vs Python, and compare them on every benchmark.", "/compare/");

export default function Compare() {
  const m = getModel();
  const langs = m.languages.map((l) => ({ id: l.spec.id, name: l.spec.name }));
  return (
    <>
      <h1>Head-to-head</h1>
      <p className="lead">Choose two languages to see a side-by-side comparison across all problems.</p>
      <ComparePicker languages={langs} />
      <h2>All comparisons</h2>
      <ul>{pairs(langs.map((l) => l.id)).map((p) => {
        const [a, b] = p.split("-vs-").map((id) => langs.find((l) => l.id === id)!.name);
        return <li key={p}><Link href={`/compare/${p}/`}>{a} vs {b} performance</Link></li>;
      })}</ul>
    </>
  );
}
