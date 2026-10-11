import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/model";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "language-bench: programming language speed benchmarks (C, Rust, Go, Node.js, Python)", template: "%s | language-bench" },
  description: "Transparent, statistically combined speed and memory benchmarks of C, Rust, Go, Node.js and CPython, measured repeatedly on GitHub Actions. Every number links to its raw repetitions.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site">
          <div className="wrap">
            <Link href="/" className="brand">language-bench</Link>
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
