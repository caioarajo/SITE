import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PasswordGate from "@/components/casar/PasswordGate";
import SiteView from "@/components/casar/SiteView";
import { isUnlocked } from "@/lib/casar/auth";
import { countView, listRecords, siteBySlug } from "@/lib/casar/store";
import { coupleNames, toPublicData } from "@/lib/casar/types";
import "../lp-casar.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await siteBySlug(slug);
  return { title: site ? coupleNames(site.data) : "Site não encontrado", robots: { index: false, follow: false } };
}

export default async function CoupleSitePage({ params }: Props) {
  const { slug } = await params;
  const site = await siteBySlug(slug);
  if (!site) notFound();
  if (!(await isUnlocked(site))) return <PasswordGate slug={slug} names={coupleNames(site.data)} />;

  await countView(site.id);
  const messages = site.data.sections.mural ? await listRecords(site.id, "messages") : [];
  return (
    <SiteView
      slug={slug}
      data={toPublicData(site.data)}
      messages={messages
        .filter((row) => !row.data.hidden)
        .reverse()
        .map((row) => ({ id: row.id, author: row.data.author, text: row.data.text, createdAt: row.createdAt }))}
    />
  );
}
