import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/Bits";
import { LangIcon } from "@/components/Icons";
import { getModel, repoUrl, siteUrl } from "@/lib/model";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const description = "Transparent, statistically combined speed and memory benchmarks of C, Rust, Go, Node.js and CPython, measured repeatedly on GitHub Actions. Every number links to its raw repetitions.";
const shareImage = { url: `${siteUrl}/share.png`, width: 1200, height: 630, alt: "Bar chart comparing the speed of C, Rust, Go, Node.js and Python" };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "language-bench: programming language speed benchmarks (C, Rust, Go, Node.js, Python)", template: "%s | language-bench" },
  description,
  applicationName: "language-bench",
  keywords: ["programming language benchmark", "language speed comparison", "C vs Rust", "Go vs Node.js", "Python performance", "benchmarks game alternative", "open benchmark data"],
  authors: [{ name: "language-bench", url: repoUrl }],
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: { type: "website", siteName: "language-bench", locale: "en_US", url: siteUrl, title: "How fast is each programming language, really?", description, images: [shareImage] },
  twitter: { card: "summary_large_image", title: "How fast is each programming language, really?", description, images: [shareImage.url] },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f3f5f8" }, { media: "(prefers-color-scheme: dark)", color: "#0a0d13" }],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const m = getModel();
  const dates = m.analysis.benchmarks.map((b) => b.lastDate).sort();
  const updated = dates[dates.length - 1]?.slice(0, 10);
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "language-bench", url: siteUrl, logo: `${siteUrl}/icon.svg`, sameAs: [repoUrl] }} />
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
          <div className="wrap footer-grid">
            <div className="footer-about">
              <Link href="/" className="brand">language-bench</Link>
              <p>Open, statistically grounded speed and memory benchmarks of programming languages. Every number links to its source code, flags and raw repetitions.</p>
              <p className="footer-langs" aria-label="Languages benchmarked">
                {m.languages.map((l) => <Link key={l.spec.id} href={`/languages/${l.spec.id}/`} title={l.spec.name}><LangIcon id={l.spec.id} size={24} /></Link>)}
              </p>
            </div>
            <nav aria-label="Explore">
              <h2>Explore</h2>
              <Link href="/">Leaderboard</Link>
              <Link href="/problems/">Problems</Link>
              <Link href="/languages/">Languages</Link>
              <Link href="/timeline/">Timeline</Link>
              <Link href="/compare/">Head-to-head</Link>
            </nav>
            <nav aria-label="Project">
              <h2>Project</h2>
              <Link href="/methodology/">Methodology</Link>
              <a href={repoUrl}>Source on GitHub</a>
              <a href={`${repoUrl}/tree/main/data/sessions`}>Raw data</a>
              <a href={`${repoUrl}/issues`}>Report an issue</a>
              <a href={`${siteUrl}/sitemap.xml`}>Sitemap</a>
            </nav>
          </div>
          <div className="wrap footer-bottom">
            <span>{m.hasData ? <>{m.analysis.sessionCount} sessions · {m.analysis.benchmarks.length} benchmarks{updated && <> · last measured {updated}</>}</> : "Waiting for the first benchmark session"}</span>
            <span>MIT licensed · measured on GitHub Actions</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
