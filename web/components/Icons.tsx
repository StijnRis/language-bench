
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Language marks live in languages/<id>/icon.svg and are inlined once per page by <LangSprite/> (see layout). */
export function LangIcon({ id, size = 22, className = "" }: { id: string; size?: number; className?: string }) {
  return (
    <svg className={`lang-icon ${className}`} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      <use href={`#lang-${id}`} />
    </svg>
  );
}

/** Hidden SVG sprite with one <symbol> per language; languages without an icon.svg get a coloured disc. */
export function LangSprite({ languages }: { languages: { id: string; icon?: string }[] }) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      {languages.map((l) => (
        <symbol key={l.id} id={`lang-${l.id}`} viewBox="0 0 64 64" dangerouslySetInnerHTML={{ __html: l.icon ?? `<circle cx="32" cy="32" r="22" fill="var(--c-${l.id})"/>` }} />
      ))}
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
