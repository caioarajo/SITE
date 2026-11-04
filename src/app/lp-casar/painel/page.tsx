import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Editor from "@/components/casar/Editor";
import { currentUser } from "@/lib/casar/auth";
import { siteByOwner } from "@/lib/casar/store";
import { getSiteSettings } from "@/lib/data";
import "../lp-casar.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Editar meu site | LP Casar", robots: { index: false, follow: false } };

export default async function PainelPage() {
  const user = await currentUser();
  if (!user) redirect("/lp-casar/entrar");
  const site = await siteByOwner(user.id);
  if (!site) redirect("/lp-casar/criar");
  const settings = await getSiteSettings();
  const { secret: _secret, ...data } = site.data;
  return <Editor email={user.email} initialSlug={site.slug} initialData={data} whatsapp={settings.whatsapp} />;
}
