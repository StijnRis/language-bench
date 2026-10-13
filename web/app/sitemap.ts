import type { MetadataRoute } from "next";
import { allTags, benchPath, getModel, pairs, siteUrl } from "@/lib/model";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const m = getModel();
  const paths = [
    "/", "/problems/", "/languages/", "/timeline/", "/compare/", "/methodology/",
    ...m.problems.map((p) => `/problems/${p.spec.id}/`),
    ...m.languages.flatMap((l) => [`/languages/${l.spec.id}/`]),
    ...allTags(m).map((t) => `/tags/${t}/`),
    ...pairs(m.languages.map((l) => l.spec.id)).map((p) => `/compare/${p}/`),
    ...[...m.byId.values()].map(benchPath),
  ];
  const dates = m.analysis.benchmarks.map((b) => b.lastDate).sort();
  const lastModified = dates.length ? new Date(dates[dates.length - 1]!) : undefined;
  return paths.map((p) => ({ url: `${siteUrl}${p}`, lastModified, changeFrequency: "weekly", priority: p === "/" ? 1 : p.startsWith("/benchmarks/") ? 0.4 : 0.7 }));
}
