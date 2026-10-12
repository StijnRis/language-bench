import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/model";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "language-bench: programming language speed benchmarks (C, Rust, Go, Node.js, Python)", template: "%s | language-bench" },
  description: "Transparent, statistically combined speed and memory benchmarks of C, Rust, Go, Node.js and CPython, measured repeatedly on GitHub Actions. Every number links to its raw repetitions.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="site">
          <div className="wrap">
            <Link href="/" className="brand">
              <svg className="logo" viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
                <rect width="64" height="64" rx="14" fill="#16181d" />
                <rect x="10" y="11" width="44" height="7" rx="3.5" fill="#9aa5bb" />
                <rect x="10" y="21" width="37" height="7" rx="3.5" fill="#fb923c" />
                <rect x="10" y="31" width="30" height="7" rx="3.5" fill="#22d3ee" />
                <rect x="10" y="41" width="22" height="7" rx="3.5" fill="#84cc16" />
                <rect x="10" y="51" width="14" height="7" rx="3.5" fill="#facc15" />
              </svg>
              language-bench
            </Link>
            <nav aria-label="Main">
              <Link href="/">Leaderboard</Link>
              <Link href="/problems/">Problems</Link>
              <Link href="/languages/">Languages</Link>
              <Link href="/timeline/">Timeline</Link>
              <Link href="/compare/">Head-to-head</Link>
              <Link href="/methodology/">Methodology</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site">
          <div className="wrap">
            Open data and code: every measurement is stored raw in the repository and re-measured on different days and machines.
            {" "}<Link href="/methodology/">How we measure</Link>.
          </div>
        </footer>
      </body>
    </html>
  );
}
