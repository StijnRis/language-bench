import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/Bits";
import { LangIcon, LangSprite } from "@/components/Icons";
import NavLinks from "@/components/NavLinks";
import ThemeToggle from "@/components/ThemeToggle";
import { getModel, repoUrl, siteUrl } from "@/lib/model";
import { languageCss, languageList } from "@/lib/text";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const model = getModel();
const names = languageList(model);
const description = `Transparent, statistically combined speed and memory benchmarks of ${names}, measured repeatedly on GitHub Actions. Every number links to its raw repetitions.`;
const langNames = model.languages.map((l) => l.spec.name);
const updated = model.analysis.benchmarks.map((b) => b.lastDate).sort().pop()?.slice(0, 10);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `language-bench: programming language speed benchmarks (${langNames.join(", ")})`, template: "%s | language-bench" },
  description,
  applicationName: "language-bench",
  keywords: ["programming language benchmark", "language speed comparison", ...langNames.slice(0, -1).map((n, i) => `${n} vs ${langNames[i + 1]}`), ...langNames.map((n) => `${n} performance`), "benchmarks game alternative", "open benchmark data"],
  authors: [{ name: "language-bench", url: repoUrl }],
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: { type: "website", siteName: "language-bench", locale: "en_US", url: siteUrl, title: "How fast is each programming language, really?", description, images: [{ url: `${siteUrl}/og/site/home.png`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "How fast is each programming language, really?", description, images: [`${siteUrl}/og/site/home.png`] },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f3f5f8" }, { media: "(prefers-color-scheme: dark)", color: "#0a0d13" }],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const m = getModel();
  const logoLangs = m.languages.slice(0, 5);
    return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("lb-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}` }} />
      </head>
      <body>
        <a href="#main" className="skip">Skip to content</a>
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Dataset", name: "language-bench: programming language benchmark measurements", description: `Repeated speed and memory measurements of ${names} on a set of workloads, measured on GitHub Actions. Includes every raw repetition.`, url: siteUrl, license: "https://opensource.org/license/mit", isAccessibleForFree: true, creator: { "@type": "Organization", name: "language-bench", url: repoUrl }, ...(updated ? { dateModified: updated } : {}), keywords: ["programming languages", "benchmark", "performance", ...langNames], distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${siteUrl}/results.csv` }, { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${repoUrl}/tree/main/data/sessions` }] }} />
        <style dangerouslySetInnerHTML={{ __html: languageCss(m) }} />
        <LangSprite languages={m.languages.map((l) => ({ id: l.spec.id, icon: l.icon }))} />
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "language-bench", url: siteUrl, logo: `${siteUrl}/icon.svg`, sameAs: [repoUrl] }} />
        <header className="site">
          <div className="wrap">
            <Link href="/" className="brand">
              <svg className="logo" viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
                <rect width="64" height="64" rx="14" fill="#16181d" />
                {logoLangs.map((l, i) => <rect key={l.spec.id} x="10" y={11 + i * 10} width={[44, 37, 30, 22, 14][i]} height="7" rx="3.5" fill={l.spec.color?.dark ?? "#9aa5bb"} />)}
              </svg>
              language-bench
            </Link>
            <NavLinks />
            <ThemeToggle />
          </div>
        </header>
        <main className="wrap" id="main">{children}</main>
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
              <Link href="/pick/">Pick for me</Link>
              <Link href="/problems/">Problems</Link>
              <Link href="/languages/">Languages</Link>
              <Link href="/timeline/">Timeline</Link>
              <Link href="/compare/">Head-to-head</Link>
              <Link href="/sessions/">Sessions</Link>
            </nav>
            <nav aria-label="Project">
              <h2>Project</h2>
              <Link href="/methodology/">Methodology</Link>
              <Link href="/validation/">Validation</Link>
              <a href={`${siteUrl}/results.csv`}>Results (CSV)</a>
              <a href={repoUrl}>Source on GitHub</a>
              <a href={`${repoUrl}/tree/main/data/sessions`}>Raw data</a>
              <a href={`${repoUrl}/issues`}>Report an issue</a>
              <a href={`${siteUrl}/sitemap.xml`}>Sitemap</a>
            </nav>
          </div>
          <div className="wrap footer-bottom">
            <span>{m.hasData ? <>{m.analysis.benchmarks.length} benchmarks{updated && <> · last measured {updated}</>}</> : "Waiting for the first benchmark session"}</span>
            <span>MIT licensed</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
