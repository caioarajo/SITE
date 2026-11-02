import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/supabase/admin-guard";
import { adminState, eventById } from "@/lib/memorias/server";
import PanelClient from "./PanelClient";
import "@/app/lp-memorias/memorias-app.css";

export const dynamic = "force-dynamic";

export default async function MemoriasPainelPage({ params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if ("error" in guard) notFound();
  const event = await eventById((await params).id);
  if (!event) notFound();

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return (
    <div className="tl-root">
      <PanelClient initial={await adminState(event, `${protocol}://${host}`)} />
    </div>
  );
}
