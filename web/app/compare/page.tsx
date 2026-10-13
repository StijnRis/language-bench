import Link from "next/link";
import ComparePicker from "@/components/ComparePicker";
import { LangIcon } from "@/components/Icons";
import { meta } from "@/lib/meta";
import { getModel } from "@/lib/model";


const names = getModel().languages.map((l) => l.spec.name);
const examples = names.length >= 4 ? `, such as ${names[0]} vs ${names[1]} or ${names[2]} vs ${names[3]},` : names.length >= 2 ? `, such as ${names[0]} vs ${names[1]},` : "";
export const metadata = meta("Language head-to-head comparisons", `Pick two languages${examples} and compare them on every benchmark.`, "/compare/");

export default function Compare() {
  const m = getModel();
  const langs = m.languages.map((l) => ({ id: l.spec.id, name: l.spec.name }));
  return (
    <>
      <h1>Head-to-head</h1>
      <p className="lead">Choose two languages to see a side-by-side comparison across all problems.</p>
      <ComparePicker languages={langs} />
      <h2>All comparisons</h2>
      <p className="muted">Pick a language to see every opponent.</p>
      <div className="compare-grid">
        {langs.map((a) => (
          <section className="card compare-card" key={a.id} aria-labelledby={`cmp-${a.id}`}>
            <h3 id={`cmp-${a.id}`}><LangIcon id={a.id} size={28} />{a.name}</h3>
            <div className="tags">
              {langs.filter((b) => b.id !== a.id).map((b) => (
                <Link key={b.id} className="tag" href={`/compare/${[a.id, b.id].sort().join("-vs-")}/`} title={`${a.name} vs ${b.name} performance`}>
                  <LangIcon id={b.id} size={16} />{b.name}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
