import Link from "next/link";
import { siteUrl } from "@/lib/model";
import { JsonLd } from "./Bits";

export default function Breadcrumbs({ trail }: { trail: { name: string; href: string }[] }) {
  const all = [{ name: "Home", href: "/" }, ...trail];
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: all.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: `${siteUrl}${t.href}` })) }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        {all.map((t, i) => (
          <span key={t.href}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === all.length - 1 ? <span aria-current="page">{t.name}</span> : <Link href={t.href}>{t.name}</Link>}
          </span>
        ))}
      </nav>
    </>
  );
}
