"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: [string, string][] = [
  ["/", "Leaderboard"], ["/pick/", "Pick for me"], ["/problems/", "Problems"], ["/languages/", "Languages"],
  ["/timeline/", "Timeline"], ["/compare/", "Head-to-head"], ["/methodology/", "Methodology"],
];

export default function NavLinks() {
  const path = (usePathname() || "/").replace(/\/?$/, "/");
  return (
    <nav aria-label="Main">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={(href === "/" ? path === "/" : path.startsWith(href)) ? "page" : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
