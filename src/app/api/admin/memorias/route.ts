import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/supabase/admin-guard";
import { DEFAULT_SETTINGS, eventSummaries, newToken } from "@/lib/memorias/server";
import type { Json } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireStaff();
  if ("error" in guard) return guard.error;
  return NextResponse.json({ events: await eventSummaries() });
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if ("error" in guard) return guard.error;
  const body = (await request.json().catch(() => ({}))) as { title?: string; eventDate?: string; retentionUntil?: string };
  const title = String(body.title ?? "").trim().slice(0, 80);
  if (!title) return NextResponse.json({ error: "Informe o nome do evento." }, { status: 400 });

  const { data, error } = await guard.serviceClient
    .from("memorias_events")
    .insert({
      guest_token: newToken(),
      wall_token: newToken(),
      settings: { ...DEFAULT_SETTINGS, title } as unknown as Json,
      event_date: body.eventDate || null,
      retention_until: body.retentionUntil || null,
      created_by: guard.user.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[memorias] criar evento", error);
    return NextResponse.json({ error: "Não foi possível criar o evento." }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
