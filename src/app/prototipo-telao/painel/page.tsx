import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { adminState, db, isDisabled } from "@/lib/telaoDemo/store";
import PanelClient from "./PanelClient";

export const dynamic = "force-dynamic";

export default async function PainelPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  // Antes de db(): em produção o disco é somente leitura.
  if (isDisabled()) notFound();
  const { k } = await searchParams;
  if (k !== db().adminKey) {
    return <main className="tl-hub"><h1 className="tl-serif">Link do painel inválido</h1></main>;
  }
  const host = (await headers()).get("host");
  return <PanelClient adminKey={k} initial={adminState(host)} />;
}
