import { NextResponse } from "next/server";
import { requireOwnSite } from "@/lib/casar/auth";
import { listRecords } from "@/lib/casar/store";

export const dynamic = "force-dynamic";

/** Totais do painel: acessos e avisos de novas respostas, recados e presentes. */
export async function GET() {
  const guard = await requireOwnSite();
  if ("error" in guard) return guard.error;
  const { site } = guard;
  const [rsvps, messages, gifts] = await Promise.all([
    listRecords(site.id, "rsvps"),
    listRecords(site.id, "messages"),
    listRecords(site.id, "gifts"),
  ]);
  return NextResponse.json({ views: site.views, rsvps: rsvps.length, messages: messages.length, gifts: gifts.length });
}
