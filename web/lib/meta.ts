import type { Metadata } from "next";
import { siteUrl } from "./model";

export function meta(title: string, description: string, path: string): Metadata {
  const url = `${siteUrl}${path}`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "language-bench" },
    twitter: { card: "summary", title, description },
  };
}
