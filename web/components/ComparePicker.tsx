"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ComparePicker({ languages }: { languages: { id: string; name: string }[] }) {
  const router = useRouter();
  const [a, setA] = useState(languages[0]?.id ?? "");
  const [b, setB] = useState(languages[1]?.id ?? "");
  const go = () => a !== b && router.push(`/compare/${[a, b].sort().join("-vs-")}/`);
  return (
    <div className="controls">
      <select aria-label="First language" value={a} onChange={(e) => setA(e.target.value)}>{languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
      <span>vs</span>
      <select aria-label="Second language" value={b} onChange={(e) => setB(e.target.value)}>{languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
      <button className="chip" onClick={go} disabled={a === b}>Compare</button>
    </div>
  );
}
