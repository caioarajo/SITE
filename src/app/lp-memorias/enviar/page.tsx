import type { Metadata, Viewport } from "next";
import { eventByGuestToken, guestState } from "@/lib/memorias/server";
import GuestClient from "./GuestClient";
import "../memorias-app.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Enviar fotos | LP Memórias", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function EnviarPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const event = await eventByGuestToken(t);
  if (!event || !t) {
    return (
      <main className="tl-root tl-hub">
        <h1 className="tl-serif">Link inválido</h1>
        <p>Escaneie de novo o QR code do evento.</p>
      </main>
    );
  }
  return (
    <div className="tl-root">
      <GuestClient token={t} initial={await guestState(event, "")} />
    </div>
  );
}
