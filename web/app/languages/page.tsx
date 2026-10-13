import Link from "next/link";
import { meta } from "@/lib/meta";
import { getModel, latestVersion } from "@/lib/model";
import { LangIcon } from "@/components/Icons";
import { languageList } from "@/lib/text";

export const metadata = meta("Languages benchmarked", `${languageList()}: versions, compiler flags and runtimes covered by language-bench.`, "/languages/");

export default function Languages() {
  const m = getModel();
  return (
    <>
      <h1>Languages</h1>
      <p className="lead">Each language is benchmarked in a pinned official Docker image, for several releases and several build settings.</p>
      <div className="grid">
        {m.languages.map((l) => (
          <div className="card" key={l.spec.id}>
            <h2 className="with-lang" style={{ margin: "0 0 6px", fontSize: "1.2rem" }}><LangIcon id={l.spec.id} size={30} /><Link href={`/languages/${l.spec.id}/`}>{l.spec.name}</Link></h2>
            <p className="small muted">{l.spec.description}</p>
            <p className="small">Latest: <strong>{latestVersion(l)}</strong> · {l.spec.versions.length} versions · {l.spec.variants.length} build setting{l.spec.variants.length === 1 ? "" : "s"}</p>
            <Link href={`/languages/${l.spec.id}/`}>Results &amp; version timeline →</Link>
          </div>
        ))}
      </div>
    </>
  );
}
