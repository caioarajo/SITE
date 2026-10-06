import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { SLOT_MINUTES, freeSlots, isBookableDay, slotDate, type Busy } from "@/lib/bookingSlots";

export const runtime = "nodejs";

/** Devolve só os horários livres de um dia — nunca título, cliente ou
 * detalhe da agenda, que é interna. */
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!isBookableDay(date)) {
    return NextResponse.json({ error: "Data indisponível para agendamento." }, { status: 400 });
  }

  const dayStart = slotDate(date, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("agenda_items")
    .select("start_at, end_at, all_day")
    .gte("start_at", dayStart.toISOString())
    .lt("start_at", dayEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: "Não foi possível consultar a agenda." }, { status: 500 });
  }

  const busy: Busy[] = (data ?? []).map((row) => {
    const start = new Date(row.start_at);
    if (row.all_day) return { start, end: start };
    const end = row.end_at ? new Date(row.end_at) : new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
    return { start, end };
  });

  return NextResponse.json({ date, slots: freeSlots(date, busy) });
}
