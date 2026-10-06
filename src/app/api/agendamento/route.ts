import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  BOOKING_EVENT_TYPES,
  SLOT_MINUTES,
  freeSlots,
  isBookableDay,
  slotDate,
  type Busy,
} from "@/lib/bookingSlots";

export const runtime = "nodejs";

type BookingBody = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  date?: unknown;
  time?: unknown;
  eventType?: unknown;
  message?: unknown;
  website?: unknown; // honeypot: campo oculto que só bot preenche
};

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  let body: BookingBody;
  try {
    body = (await request.json()) as BookingBody;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  // Bot que preenche o campo oculto recebe um "ok" falso, sem criar nada.
  if (text(body.website, 200)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = text(body.name, 120);
  const phone = text(body.phone, 30);
  const email = text(body.email, 160);
  const date = text(body.date, 10);
  const time = text(body.time, 5);
  const eventType = text(body.eventType, 40);
  const message = text(body.message, 1000);

  if (name.length < 2) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "Informe um telefone com DDD." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }
  if (!(BOOKING_EVENT_TYPES as readonly string[]).includes(eventType)) {
    return NextResponse.json({ error: "Escolha o tipo de evento." }, { status: 400 });
  }
  if (!isBookableDay(date)) {
    return NextResponse.json({ error: "Data indisponível para agendamento." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Recalcula a disponibilidade no próprio servidor — não confia no que o
  // navegador mostrou, já que outra pessoa pode ter pego o horário antes.
  const dayStart = slotDate(date, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const { data: existing, error: readError } = await supabase
    .from("agenda_items")
    .select("start_at, end_at, all_day")
    .gte("start_at", dayStart.toISOString())
    .lt("start_at", dayEnd.toISOString());
  if (readError) {
    return NextResponse.json({ error: "Não foi possível confirmar o horário." }, { status: 500 });
  }

  const busy: Busy[] = (existing ?? []).map((row) => {
    const start = new Date(row.start_at);
    if (row.all_day) return { start, end: start };
    const end = row.end_at ? new Date(row.end_at) : new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
    return { start, end };
  });

  if (!freeSlots(date, busy).includes(time)) {
    return NextResponse.json(
      { error: "Esse horário acabou de ser reservado. Escolha outro, por favor." },
      { status: 409 },
    );
  }

  const start = slotDate(date, time);
  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

  const { error: oppError } = await supabase.from("opportunities").insert({
    name,
    phone,
    email: email || null,
    event_type: eventType,
    source: "site_form",
    stage: "novo",
    notes: `Reunião solicitada pelo site para ${date} às ${time}.${message ? `\n\n${message}` : ""}`,
  });
  if (oppError) {
    return NextResponse.json({ error: "Não foi possível registrar o pedido." }, { status: 500 });
  }

  const { error: agendaError } = await supabase.from("agenda_items").insert({
    title: `Reunião de apresentação — ${name}`,
    category: "reuniao",
    description: [
      `Tipo de evento: ${eventType}`,
      `Telefone: ${phone}`,
      email ? `E-mail: ${email}` : null,
      message ? `Mensagem: ${message}` : null,
      "Pedido feito pelo site. Confirmar pelo WhatsApp.",
    ]
      .filter(Boolean)
      .join("\n"),
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    location: "A definir (reunião de apresentação)",
    location_type: "presencial",
    priority: "normal",
    status: "pendente",
    visible_to_client: false,
  });
  if (agendaError) {
    return NextResponse.json({ error: "Não foi possível reservar o horário." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, date, time }, { status: 201 });
}
