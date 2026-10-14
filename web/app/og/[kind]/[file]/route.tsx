import { ogImage, ogParams } from "@/lib/og";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ogParams();
}

export async function GET(_: Request, { params }: { params: Promise<{ kind: string; file: string }> }) {
  const { kind, file } = await params;
  return ogImage(kind, file.replace(/\.png$/, ""));
}
