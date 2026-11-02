import type { Metadata } from "next";
import { eventByWallToken, wallState } from "@/lib/memorias/server";
import WallClient from "./WallClient";
import "../memorias-app.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Telão | LP Memórias", robots: { index: false, follow: false } };

export default async function TelaoPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const event = await eventByWallToken(t);
  if (!event || !t) {
    return <main className="tl-root tl-hub"><h1 className="tl-serif">Link do telão inválido</h1></main>;
  }
  return <WallClient token={t} initial={await wallState(event)} />;
}
