import { NextResponse, type NextRequest } from "next/server";
import { requireEventAccess } from "@/lib/memorias/access";
import { adminState, BUCKET, newToken, notifyChanged, pathsOf, removeEventFiles, settingsOf } from "@/lib/memorias/server";
import type { WallSettings } from "@/lib/memorias/types";
import type { Database, Json } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const EDITABLE: (keyof WallSettings)[] = [
  "title", "subtitle", "uploadsOpen", "moderation", "wallPaused", "pauseMessage", "layout", "intervalSec",
  "showNames", "showCaptions", "showQr", "guestsSeeGallery", "blockedWords",
];

function sanitizeSettings(patch: Partial<WallSettings>): Partial<WallSettings> {
  const clean: Record<string, unknown> = {};
  for (const key of EDITABLE) if (key in patch) clean[key] = patch[key];
  if (clean.intervalSec !== undefined) clean.intervalSec = Math.min(30, Math.max(3, Number(clean.intervalSec) || 7));
  if (clean.layout !== undefined && !["cinema", "mosaico", "polaroid"].includes(String(clean.layout))) delete clean.layout;
  if (clean.moderation !== undefined && !["manual", "auto"].includes(String(clean.moderation))) delete clean.moderation;
  return clean as Partial<WallSettings>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const access = await requireEventAccess((await params).id);
  if ("error" in access) return access.error;
  return NextResponse.json(await adminState(access.event, request.nextUrl.origin));
}

export async function POST(request: NextRequest, { params }: Params) {
  const access = await requireEventAccess((await params).id);
  if ("error" in access) return access.error;
  const { event, account } = access;
  const client = access.serviceClient;

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    ids?: string[];
    id?: string;
    deviceId?: string;
    settings?: Partial<WallSettings>;
    eventDate?: string | null;
    retentionUntil?: string | null;
    clientId?: string | null;
  };
  // O cliente modera o próprio evento; prazo, vínculo e exclusão ficam com a equipe.
  if (account.kind === "client" && ["dates", "assignClient", "deleteEvent"].includes(String(body.action))) {
    return NextResponse.json({ error: "Fale com a equipe da LP para esta alteração." }, { status: 403 });
  }
  const ids = body.ids ?? (body.id ? [body.id] : []);
  const posts = () => client.from("memorias_posts");
  const updateEvent = (patch: Database["public"]["Tables"]["memorias_events"]["Update"]) =>
    client.from("memorias_events").update(patch).eq("id", event.id);
  const setStatus = async (status: string) => {
    if (ids.length) await posts().update({ status }).eq("event_id", event.id).in("id", ids);
  };

  switch (body.action) {
    case "approve":
      await setStatus("approved");
      break;
    case "hide":
      await setStatus("hidden");
      break;
    case "approveAllPending":
      await posts().update({ status: "approved" }).eq("event_id", event.id).eq("status", "pending");
      break;
    case "delete": {
      const { data } = await posts().select("*").eq("event_id", event.id).in("id", ids);
      await posts().delete().eq("event_id", event.id).in("id", ids);
      const paths = (data ?? []).flatMap(pathsOf);
      if (paths.length) await client.storage.from(BUCKET).remove(paths);
      break;
    }
    case "pin": {
      const { data } = await posts().select("id, pinned").eq("event_id", event.id).in("id", ids);
      await Promise.all((data ?? []).map((p) => posts().update({ pinned: !p.pinned }).eq("id", p.id)));
      break;
    }
    case "showNow": {
      const { error } = await posts().update({ status: "approved" }).eq("event_id", event.id).eq("id", body.id ?? "");
      if (error) return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });
      await updateEvent({ show_now: { id: body.id, at: Date.now() } as unknown as Json });
      break;
    }
    case "blockDevice":
      if (body.deviceId && !event.blocked_devices.includes(body.deviceId)) {
        await updateEvent({ blocked_devices: [...event.blocked_devices, body.deviceId] });
        await posts().update({ status: "hidden" }).eq("event_id", event.id).eq("device_id", body.deviceId);
      }
      break;
    case "unblockDevice":
      await updateEvent({ blocked_devices: event.blocked_devices.filter((d) => d !== body.deviceId) });
      break;
    case "settings":
      await updateEvent({ settings: { ...settingsOf(event), ...sanitizeSettings(body.settings ?? {}) } as unknown as Json });
      break;
    case "dates":
      await updateEvent({ event_date: body.eventDate || null, retention_until: body.retentionUntil || null });
      break;
    case "assignClient": {
      const clientId = body.clientId || null;
      if (clientId) {
        const { data: owner } = await client.from("memorias_clients").select("id").eq("id", clientId).maybeSingle();
        if (!owner) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
      }
      await updateEvent({ client_id: clientId });
      break;
    }
    case "rotateGuestToken":
      await updateEvent({ guest_token: newToken() });
      break;
    case "deleteEvent":
      await removeEventFiles(event.id);
      await client.from("memorias_events").delete().eq("id", event.id);
      await notifyChanged(event.id);
      return NextResponse.json({ ok: true, deleted: true });
    default:
      return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  }
  await notifyChanged(event.id);
  return NextResponse.json({ ok: true });
}
