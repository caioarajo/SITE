import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Wizard from "@/components/casar/Wizard";
import { currentUser } from "@/lib/casar/auth";
import { siteByOwner } from "@/lib/casar/store";
import "../lp-casar.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Criar site | LP Casar", robots: { index: false, follow: false } };

export default async function CriarPage() {
  const user = await currentUser();
  if (!user) redirect("/lp-casar/entrar?modo=criar");
  if (await siteByOwner(user.id)) redirect("/lp-casar/painel");
  return <Wizard />;
}
