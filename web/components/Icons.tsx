import { colorOf } from "@/lib/fmt";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Simplified, original marks that hint at each language's identity; sized by the `size` prop. */
const MARKS: Record<string, React.ReactNode> = {
  c: (
    <>
      <path d="M32 3 57 17.500v29L32 61 7 46.500v-29Z" fill="#5c6bc0" />
      <path d="M42.500 23.500a13 13 0 1 0 0 17" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  rust: (
    <>
      <circle cx="32" cy="32" r="22" fill="none" stroke="#f26a1b" strokeWidth="8" strokeDasharray="7.2 4.5" />
      <circle cx="32" cy="32" r="17" fill="#f26a1b" />
      <path d="M26 41V23h9a5 5 0 0 1 0 10h-9m8 0 4 8" fill="none" stroke="#fff" strokeWidth="3.500" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  go: (
    <>
      <rect x="3" y="12" width="58" height="40" rx="20" fill="#00acd7" />
      <circle cx="23" cy="29" r="7" fill="#fff" /><circle cx="41" cy="29" r="7" fill="#fff" />
      <circle cx="24.500" cy="29" r="3" fill="#0d3b4a" /><circle cx="42.500" cy="29" r="3" fill="#0d3b4a" />
      <path d="M27 39q5 5 10 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  node: (
    <>
      <path d="M32 3 57 17.500v29L32 61 7 46.500v-29Z" fill="#5fa04e" />
      <path d="M22 44V21l20 22V20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  python: (
    <>
      <path d="M31 6c-10 0-9 4.500-9 4.500V16h10v2H17.500S9 17 9 30s7.500 12.500 7.500 12.500H21V36s-.5-7.500 7.500-7.500h9.500s7 .1 7-6.800V12.500S46 6 31 6Z" fill="#3b78ad" />
      <path d="M33 58c10 0 9-4.500 9-4.500V48H32v-2h14.500S55 47 55 34s-7.500-12.500-7.500-12.500H43V28s.5 7.500-7.500 7.500H26s-7-.1-7 6.800V51.500S18 58 33 58Z" fill="#fcc933" />
      <circle cx="26" cy="12" r="2.200" fill="#fff" /><circle cx="38" cy="52" r="2.200" fill="#fff" />
    </>
  ),
};

export function LangIcon({ id, size = 22, className = "" }: { id: string; size?: number; className?: string }) {
  const mark = MARKS[id];
  if (!mark) return <span className="dot" style={{ background: colorOf(id) }} aria-hidden="true" />;
  return (
    <svg className={`lang-icon ${className}`} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      {mark}
    </svg>
  );
}

/** Generated icon of a problem, rendered in both colour schemes (CSS shows the matching one). */
export function ProblemIcon({ id, size = 40, className = "" }: { id: string; size?: number; className?: string }) {
  return (
    <span className={`problem-icon ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <img className="pi-light" src={`${base}/problems/${id}-light.svg`} alt="" width={size} height={size} loading="lazy" />
      <img className="pi-dark" src={`${base}/problems/${id}-dark.svg`} alt="" width={size} height={size} loading="lazy" />
    </span>
  );
}
