import { notFound } from "next/navigation";
import { db, isDisabled, wallState } from "@/lib/telaoDemo/store";
import WallClient from "./WallClient";

export const dynamic = "force-dynamic";

export default async function TelaoPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  // Antes de db(): em produção o disco é somente leitura.
  if (isDisabled()) notFound();
  const { t } = await searchParams;
  if (t !== db().wallToken) {
    return <main className="tl-hub"><h1 className="tl-serif">Link do telão inválido</h1></main>;
  }
  return <WallClient token={t} initial={wallState()} />;
}
