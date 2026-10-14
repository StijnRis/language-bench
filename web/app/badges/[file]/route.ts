import { getModel } from "@/lib/model";
import { ranking } from "@/lib/text";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getModel().languages.map((l) => ({ file: `${l.spec.id}.svg` }));
}

const width = (s: string) => Math.round(s.length * 6.3 + 14);

/** shields-style SVG badge: overall speed rank of a language, for README embedding. */
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = file.replace(/\.svg$/, "");
  const m = getModel();
  const l = m.languages.find((x) => x.spec.id === id);
  const order = ranking(m);
  const at = order.findIndex((r) => r.id === id);
  const left = "language-bench";
  const right = l && at >= 0 ? `${l.spec.name} #${at + 1} of ${order.length} · ${order[at]!.value.toFixed(1)}×` : `${l?.spec.name ?? id}: no data`;
  const color = l?.spec.color?.light ?? "#2457f5";
  const wl = width(left), wr = width(right), w = wl + wr;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${left}: ${right}"><title>${left}: ${right}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${wl}" height="20" fill="#555"/><rect x="${wl}" width="${wr}" height="20" fill="${color}"/><rect width="${w}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11"><text x="${wl / 2}" y="14">${left}</text><text x="${wl + wr / 2}" y="14">${right}</text></g></svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" } });
}
