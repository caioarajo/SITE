import { randomBytes } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { AdminPost, AdminState, EventSummary, GuestState, Post, PostKind, PostStatus, WallSettings, WallState } from "./types";

// Acesso aos dados da LP Memórias. Usa a service role: as rotas e páginas que
// chamam estas funções validam antes o token do link ou o papel do usuário.

export const BUCKET = "memorias";

export type EventRow = Database["public"]["Tables"]["memorias_events"]["Row"];
export type PostRow = Database["public"]["Tables"]["memorias_posts"]["Row"];

export const DEFAULT_SETTINGS: WallSettings = {
  title: "",
  subtitle: "Compartilhe este momento com a gente",
  uploadsOpen: true,
  moderation: "manual",
  wallPaused: false,
  pauseMessage: "Já voltamos com as fotos de vocês",
  layout: "cinema",
  intervalSec: 7,
  showNames: true,
  showCaptions: true,
  showQr: true,
  guestsSeeGallery: true,
  blockedWords: [],
};

export const newToken = () => randomBytes(18).toString("base64url");
export const db = () => createServiceRoleClient();

export const settingsOf = (event: EventRow): WallSettings => ({
  ...DEFAULT_SETTINGS,
  ...(event.settings as unknown as Partial<WallSettings>),
});

export async function eventByGuestToken(token: string | null | undefined) {
  if (!token) return null;
  const { data } = await db().from("memorias_events").select("*").eq("guest_token", token).maybeSingle();
  return data;
}

export async function eventByWallToken(token: string | null | undefined) {
  if (!token) return null;
  const { data } = await db().from("memorias_events").select("*").eq("wall_token", token).maybeSingle();
  return data;
}

export async function eventById(id: string) {
  const { data } = await db().from("memorias_events").select("*").eq("id", id).maybeSingle();
  return data;
}

/** A API devolve no máximo 1000 linhas por consulta; casamentos grandes passam disso. */
async function allPosts(eventId: string, approvedOnly = false): Promise<PostRow[]> {
  const rows: PostRow[] = [];
  for (let from = 0; ; from += 1000) {
    let query = db().from("memorias_posts").select("*").eq("event_id", eventId);
    if (approvedOnly) query = query.eq("status", "approved");
    const { data, error } = await query.order("created_at", { ascending: true }).range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

function toPublic(p: PostRow, showNames = true, showCaptions = true): Post {
  return {
    id: p.id,
    kind: p.kind as PostKind,
    status: p.status as PostStatus,
    pinned: p.pinned,
    flagged: p.flagged,
    guestName: showNames ? p.guest_name : "",
    caption: showCaptions || p.kind === "message" ? p.caption : "",
    createdAt: new Date(p.created_at).getTime(),
    width: p.width,
    height: p.height,
    hearts: p.hearts,
    size: p.size_bytes,
  };
}

export async function wallState(event: EventRow): Promise<WallState> {
  const settings = settingsOf(event);
  const posts = await allPosts(event.id, true);
  return {
    eventId: event.id,
    settings,
    posts: posts.map((p) => toPublic(p, settings.showNames, settings.showCaptions)),
    showNow: event.show_now as WallState["showNow"],
  };
}

const GUEST_GALLERY_LIMIT = 200;

export async function guestState(event: EventRow, deviceId: string): Promise<GuestState> {
  const settings = settingsOf(event);
  const client = db();
  const [gallery, mine, hearts] = await Promise.all([
    settings.guestsSeeGallery
      ? client.from("memorias_posts").select("*").eq("event_id", event.id).eq("status", "approved").order("created_at", { ascending: false }).limit(GUEST_GALLERY_LIMIT)
      : Promise.resolve({ data: [] as PostRow[] }),
    deviceId
      ? client.from("memorias_posts").select("*").eq("event_id", event.id).eq("device_id", deviceId).order("created_at", { ascending: false }).limit(GUEST_GALLERY_LIMIT)
      : Promise.resolve({ data: [] as PostRow[] }),
    deviceId
      ? client.from("memorias_hearts").select("post_id").eq("device_id", deviceId).limit(1000)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);
  const blocked = event.blocked_devices.includes(deviceId);
  return {
    settings: {
      title: settings.title,
      subtitle: settings.subtitle,
      uploadsOpen: settings.uploadsOpen,
      guestsSeeGallery: settings.guestsSeeGallery,
      moderation: settings.moderation,
    },
    gallery: (gallery.data ?? []).map((p) => toPublic(p)),
    // Aparelho bloqueado continua vendo "aguardando": o bloqueio é silencioso.
    mine: (mine.data ?? []).map((p) => ({ ...toPublic(p), status: blocked ? ("pending" as const) : (p.status as PostStatus) })),
    heartedIds: (hearts.data ?? []).map((h) => h.post_id),
  };
}

export const guestPath = (event: EventRow) => `/lp-memorias/enviar?t=${event.guest_token}`;
export const wallPath = (event: EventRow) => `/lp-memorias/telao?t=${event.wall_token}`;

export async function adminState(event: EventRow, origin: string): Promise<AdminState> {
  const posts = await allPosts(event.id);
  const names = new Map<string, number>();
  for (const p of posts) {
    const name = p.guest_name || "Sem nome";
    names.set(name, (names.get(name) ?? 0) + 1);
  }
  const adminPosts: AdminPost[] = posts.map((p) => ({ ...toPublic(p), deviceId: p.device_id })).reverse();
  return {
    eventId: event.id,
    settings: settingsOf(event),
    posts: adminPosts,
    blockedDevices: event.blocked_devices,
    guestUrl: origin + guestPath(event),
    wallUrl: origin + wallPath(event),
    eventDate: event.event_date,
    retentionUntil: event.retention_until,
    stats: {
      total: posts.length,
      pending: posts.filter((p) => p.status === "pending").length,
      approved: posts.filter((p) => p.status === "approved").length,
      hidden: posts.filter((p) => p.status === "hidden").length,
      guests: new Set(posts.map((p) => p.device_id)).size,
      hearts: posts.reduce((sum, p) => sum + p.hearts, 0),
      bytes: posts.reduce((sum, p) => sum + p.size_bytes, 0),
      top: [...names.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    },
  };
}

export async function eventSummaries(): Promise<EventSummary[]> {
  const client = db();
  const { data: events, error } = await client.from("memorias_events").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return Promise.all(
    (events ?? []).map(async (event) => {
      const [total, pending] = await Promise.all([
        client.from("memorias_posts").select("id", { count: "exact", head: true }).eq("event_id", event.id),
        client.from("memorias_posts").select("id", { count: "exact", head: true }).eq("event_id", event.id).eq("status", "pending"),
      ]);
      const settings = settingsOf(event);
      return {
        id: event.id,
        title: settings.title,
        eventDate: event.event_date,
        retentionUntil: event.retention_until,
        uploadsOpen: settings.uploadsOpen,
        total: total.count ?? 0,
        pending: pending.count ?? 0,
      };
    }),
  );
}

export async function approvedOriginals(eventId: string) {
  const posts = (await allPosts(eventId, true)).filter((p) => p.original_path);
  return posts.map((p) => ({ id: p.id, name: p.guest_name, path: p.original_path as string }));
}

export function pathsOf(post: PostRow) {
  return [...new Set([post.original_path, post.display_path, post.thumb_path].filter((p): p is string => !!p))];
}

export async function removeEventFiles(eventId: string) {
  const storage = db().storage.from(BUCKET);
  for (const prefix of [eventId, `${eventId}/incoming`]) {
    for (;;) {
      const { data } = await storage.list(prefix, { limit: 500 });
      const files = (data ?? []).filter((f) => f.id).map((f) => `${prefix}/${f.name}`);
      if (!files.length) break;
      const { error } = await storage.remove(files);
      if (error) throw new Error(error.message);
    }
  }
}

/** Avisa telão e painel pelo Realtime Broadcast. O canal só diz "mudou", sem nenhum dado. */
export async function notifyChanged(eventId: string) {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ messages: [{ topic: `memorias-${eventId}`, event: "changed", payload: {} }] }),
      signal: AbortSignal.timeout(2500),
    });
  } catch (err) {
    // A consulta periódica do telão e do painel cobre uma falha aqui.
    console.error("[memorias] broadcast", err);
  }
}
