import { randomBytes } from "node:crypto";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AdminPost, AdminState, GuestState, WallSettings, WallState } from "./types";

// Armazenamento do protótipo: um JSON e arquivos em .telao-demo/ (fora do git).
// Não toca no Supabase. Fica em globalThis para sobreviver ao hot reload.

export const DATA_DIR = path.join(process.cwd(), ".telao-demo");
export const MEDIA_DIR = path.join(DATA_DIR, "media");
const DB_FILE = path.join(DATA_DIR, "db.json");

export interface StoredPost extends AdminPost {
  ip: string;
  sha: string;
  /** Arquivos em MEDIA_DIR; vazios em recados de texto. */
  original: string;
  display: string;
  thumb: string;
  mime: string;
  heartedBy: string[];
}

interface Db {
  guestToken: string;
  wallToken: string;
  adminKey: string;
  settings: WallSettings;
  posts: StoredPost[];
  blockedDevices: string[];
  showNow: { id: string; at: number } | null;
}

const DEFAULT_SETTINGS: WallSettings = {
  title: "Ana & Pedro",
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
  baseUrl: "",
};

const newToken = () => randomBytes(18).toString("base64url");

function freshDb(): Db {
  return {
    guestToken: newToken(),
    wallToken: newToken(),
    adminKey: newToken(),
    settings: { ...DEFAULT_SETTINGS },
    posts: [],
    blockedDevices: [],
    showNow: null,
  };
}

const holder = globalThis as unknown as { __telaoDb?: Db; __telaoBus?: EventEmitter };

export function bus(): EventEmitter {
  if (!holder.__telaoBus) {
    holder.__telaoBus = new EventEmitter();
    holder.__telaoBus.setMaxListeners(0);
  }
  return holder.__telaoBus;
}

export function db(): Db {
  if (!holder.__telaoDb) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
    let loaded: Db | null = null;
    if (fs.existsSync(DB_FILE)) loaded = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Db;
    holder.__telaoDb = loaded
      ? { ...loaded, settings: { ...DEFAULT_SETTINGS, ...loaded.settings } }
      : freshDb();
    if (!loaded) persist();
  }
  return holder.__telaoDb;
}

function persist() {
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(holder.__telaoDb));
  fs.renameSync(tmp, DB_FILE);
}

/** Grava e avisa quem está conectado ao stream (telão, painel, convidados). */
export function commit() {
  persist();
  bus().emit("changed");
}

export function removeFiles(post: StoredPost) {
  for (const file of new Set([post.original, post.display, post.thumb])) {
    if (file) fs.rmSync(path.join(MEDIA_DIR, file), { force: true });
  }
}

export function resetAll() {
  const current = db();
  fs.rmSync(MEDIA_DIR, { recursive: true, force: true });
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  current.posts = [];
  current.blockedDevices = [];
  current.showNow = null;
  current.settings = { ...DEFAULT_SETTINGS };
  commit();
}

export function rotateGuestToken() {
  db().guestToken = newToken();
  commit();
}

/** IP do computador na rede local: é o que vai no QR code, já que "localhost" no celular é o próprio celular. */
function lanAddress(): string | null {
  const all = Object.values(os.networkInterfaces())
    .flat()
    .filter((i): i is os.NetworkInterfaceInfo => !!i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
  return all.find((a) => a.startsWith("192.168.")) ?? all.find((a) => a.startsWith("10.")) ?? all[0] ?? null;
}

export function baseUrl(hostHeader: string | null): string {
  const custom = db().settings.baseUrl.trim().replace(/\/$/, "");
  if (custom) return custom;
  const host = hostHeader ?? "localhost:3000";
  const [name, port] = host.split(":");
  if (name === "localhost" || name === "127.0.0.1") {
    const lan = lanAddress();
    if (lan) return `http://${lan}${port ? `:${port}` : ""}`;
  }
  return `http://${host}`;
}

export const guestPath = () => `/prototipo-telao/convidado?t=${db().guestToken}`;
export const wallPath = () => `/prototipo-telao/telao?t=${db().wallToken}`;
export const panelPath = () => `/prototipo-telao/painel?k=${db().adminKey}`;

function toPublic(p: StoredPost, showNames = true, showCaptions = true) {
  return {
    id: p.id,
    kind: p.kind,
    status: p.status,
    pinned: p.pinned,
    flagged: p.flagged,
    guestName: showNames ? p.guestName : "",
    caption: showCaptions || p.kind === "message" ? p.caption : "",
    createdAt: p.createdAt,
    width: p.width,
    height: p.height,
    hearts: p.hearts,
    size: p.size,
    simulated: p.simulated,
  };
}

export function wallState(): WallState {
  const { settings, posts, showNow } = db();
  return {
    settings,
    posts: posts
      .filter((p) => p.status === "approved")
      .map((p) => toPublic(p, settings.showNames, settings.showCaptions)),
    showNow,
  };
}

export function guestState(deviceId: string): GuestState {
  const { settings, posts, blockedDevices } = db();
  const blocked = blockedDevices.includes(deviceId);
  return {
    settings: {
      title: settings.title,
      subtitle: settings.subtitle,
      uploadsOpen: settings.uploadsOpen,
      guestsSeeGallery: settings.guestsSeeGallery,
      moderation: settings.moderation,
    },
    gallery: settings.guestsSeeGallery
      ? posts.filter((p) => p.status === "approved").map((p) => toPublic(p)).reverse()
      : [],
    // Aparelho bloqueado continua vendo "aguardando": o bloqueio é silencioso.
    mine: posts
      .filter((p) => p.deviceId === deviceId)
      .map((p) => ({ ...toPublic(p), status: blocked ? ("pending" as const) : p.status }))
      .reverse(),
    heartedIds: deviceId ? posts.filter((p) => p.heartedBy.includes(deviceId)).map((p) => p.id) : [],
  };
}

export function adminState(hostHeader: string | null): AdminState {
  const { settings, posts, blockedDevices } = db();
  const base = baseUrl(hostHeader);
  const names = new Map<string, number>();
  for (const p of posts) {
    const name = p.guestName || "Sem nome";
    names.set(name, (names.get(name) ?? 0) + 1);
  }
  return {
    settings,
    posts: posts.map((p) => ({ ...toPublic(p), deviceId: p.deviceId })).reverse(),
    blockedDevices,
    guestUrl: base + guestPath(),
    wallUrl: base + wallPath(),
    stats: {
      total: posts.length,
      pending: posts.filter((p) => p.status === "pending").length,
      approved: posts.filter((p) => p.status === "approved").length,
      hidden: posts.filter((p) => p.status === "hidden").length,
      guests: new Set(posts.map((p) => p.deviceId)).size,
      hearts: posts.reduce((sum, p) => sum + p.hearts, 0),
      bytes: posts.reduce((sum, p) => sum + p.size, 0),
      top: [...names.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    },
  };
}

/** O protótipo não existe em produção, mesmo se este código for publicado. */
export function isDisabled() {
  return process.env.NODE_ENV === "production";
}
