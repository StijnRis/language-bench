import type { Metadata } from "next";
import { siteUrl } from "./model";

export function meta(title: string, description: string, path: string): Metadata {
  const url = `${siteUrl}${path}`;
  const image = { url: `${siteUrl}/share.png`, width: 1200, height: 630, alt: "Bar chart comparing the speed of C, Rust, Go, Node.js and Python" };
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "language-bench", locale: "en_US", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}
