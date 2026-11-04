import { NextResponse, type NextRequest } from "next/server";
import { requireOwnSite } from "@/lib/casar/auth";
import { addRecords, deleteRecord, listRecords, patchRecord } from "@/lib/casar/store";
import type { GiftStatus, Guest, RecordKind } from "@/lib/casar/types";

export const dynamic = "force-dynamic";

const KINDS: RecordKind[] = ["guests", "rsvps", "messages", "gifts"];
const kindOf = (value: unknown) => (KINDS.includes(value as RecordKind) ? (value as RecordKind) : null);

const cleanGuest = (raw: Partial<Guest>): Guest => ({
  name: String(raw.name ?? "").trim().slice(0, 120),
  phone: String(raw.phone ?? "").trim().slice(0, 30),
  group: String(raw.group ?? "").trim().slice(0, 60),
  companions: Math.min(Math.max(Math.floor(Number(raw.companions) || 0), 0), 20),
});

export async function GET(request: NextRequest) {
  const guard = await requireOwnSite();
  if ("error" in guard) return guard.error;
  const kind = kindOf(request.nextUrl.searchParams.get("kind"));
  if (!kind) return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  return NextResponse.json({ rows: await listRecords(guard.site.id, kind) });
}

/** Os noivos só criam convidados; confirmações, recados e presentes vêm do site público. */
export async function POST(request: NextRequest) {
  const guard = await requireOwnSite();
  if ("error" in guard) return guard.error;
  const body = (await request.json().catch(() => ({}))) as { guests?: Partial<Guest>[] };
  const guests = (body.guests ?? []).slice(0, 1000).map(cleanGuest).filter((guest) => guest.name);
  if (!guests.length) return NextResponse.json({ error: "Informe ao menos um nome." }, { status: 400 });
  return NextResponse.json({ rows: await addRecords(guard.site.id, "guests", guests) });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireOwnSite();
  if ("error" in guard) return guard.error;
  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    id?: string;
    guest?: Partial<Guest>;
    hidden?: boolean;
    status?: GiftStatus;
    thanked?: boolean;
  };
  const id = String(body.id ?? "");
  const siteId = guard.site.id;

  switch (kindOf(body.kind)) {
    case "guests":
      await patchRecord(siteId, "guests", id, cleanGuest(body.guest ?? {}));
      break;
    case "messages":
      await patchRecord(siteId, "messages", id, { hidden: Boolean(body.hidden) });
      break;
    case "gifts":
      if (body.thanked !== undefined) {
        await patchRecord(siteId, "gifts", id, { thanked: Boolean(body.thanked) });
        break;
      }
      if (!["pending", "confirmed", "rejected"].includes(String(body.status))) {
        return NextResponse.json({ error: "Situação inválida." }, { status: 400 });
      }
      await patchRecord(siteId, "gifts", id, { status: body.status });
      break;
    default:
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireOwnSite();
  if ("error" in guard) return guard.error;
  const kind = kindOf(request.nextUrl.searchParams.get("kind"));
  const id = request.nextUrl.searchParams.get("id");
  if (!kind || !id) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  await deleteRecord(guard.site.id, kind, id);
  return NextResponse.json({ ok: true });
}
