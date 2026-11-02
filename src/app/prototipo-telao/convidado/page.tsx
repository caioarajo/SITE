import { notFound } from "next/navigation";
import { db, guestState, isDisabled } from "@/lib/telaoDemo/store";
import GuestClient from "./GuestClient";

export const dynamic = "force-dynamic";

export default async function ConvidadoPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  // Antes de db(): em produção o disco é somente leitura.
  if (isDisabled()) notFound();
  const { t } = await searchParams;
  if (t !== db().guestToken) {
    return (
      <main className="tl-hub">
        <h1 className="tl-serif">Link inválido</h1>
        <p>Escaneie de novo o QR code do evento.</p>
      </main>
    );
  }
  return <GuestClient token={t} initial={guestState("")} />;
}
