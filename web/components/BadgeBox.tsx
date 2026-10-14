"use client";
import { useState } from "react";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Snippet({ label, text }: { label: string; text: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {}
  };
  return (
    <div className="snippet-row">
      <span className="small muted">{label}</span>
      <code className="snippet">{text}</code>
      <button type="button" className="chip" onClick={copy}>{done ? "Copied" : "Copy"}</button>
    </div>
  );
}

/** Live preview of a language's README badge, with Markdown and HTML snippets to copy. */
export default function BadgeBox({ id, name, siteUrl }: { id: string; name: string; siteUrl: string }) {
  const url = `${siteUrl}/badges/${id}.svg`;
  const page = `${siteUrl}/languages/${id}/`;
  return (
    <div className="card badge-box">
      <div className="badge-preview">
        <span className="small muted">Preview</span>
        <img src={`${base}/badges/${id}.svg`} alt={`${name} rank on language-bench`} height={20} />
      </div>
      <Snippet label="Markdown" text={`[![${name} on language-bench](${url})](${page})`} />
      <Snippet label="HTML" text={`<a href="${page}"><img src="${url}" alt="${name} on language-bench"></a>`} />
    </div>
  );
}
