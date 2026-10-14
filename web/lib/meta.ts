import type { Metadata } from "next";
import { siteUrl } from "./model";
import { ogPath } from "./og";

type Kind = "site" | "language" | "problem" | "compare";

/** Page metadata; `og` picks the share card (/og/<kind>/<id>.png), default is the site card. */
export function meta(title: string, description: string, path: string, og: { kind: Kind; id: string } = { kind: "site", id: "home" }): Metadata {
  const url = `${siteUrl}${path}`;
  const images = [{ url: `${siteUrl}${ogPath(og.kind, og.id)}`, width: 1200, height: 630, alt: title }];
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "language-bench", locale: "en_US", images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}
