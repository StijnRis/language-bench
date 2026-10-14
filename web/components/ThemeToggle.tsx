"use client";
import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";
const NEXT: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };

/** Cycles system -> light -> dark; the choice is stored in localStorage and stamped on <html data-theme>. */
export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    try {
      const v = localStorage.getItem("lb-theme");
      if (v === "light" || v === "dark") setMode(v);
    } catch {}
  }, []);
  const apply = (m: Mode) => {
    setMode(m);
    const root = document.documentElement;
    if (m === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", m);
    try {
      if (m === "system") localStorage.removeItem("lb-theme");
      else localStorage.setItem("lb-theme", m);
    } catch {}
  };
  return (
    <button type="button" className="theme-toggle" onClick={() => apply(NEXT[mode])} aria-label={`Colour theme: ${mode}. Click to change.`} title="Switch colour theme">
      {mode === "system" ? "◐ Auto" : mode === "light" ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
