import Link from "next/link";
import { codeToHtml } from "shiki";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export async function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const html = await codeToHtml(code, { lang, themes: { light: "github-light", dark: "github-dark" }, defaultColor: false });
  return <div className="shiki-wrap" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Tags({ tags }: { tags: string[] }) {
  return <>{tags.map((t) => <Link key={t} className="tag" href={`/tags/${t}/`}>{t}</Link>)}</>;
}

export function NoData() {
  return (
    <div className="card empty">
      <strong>No benchmark sessions have been recorded yet.</strong>
      <p>The first scheduled GitHub Actions run will publish real measurements here. Everything on this page is computed from raw repetitions in <code>data/</code>.</p>
    </div>
  );
}
