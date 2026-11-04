import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { coupleNames, normalizeData, type RecordData, type RecordKind, type Row, type SiteData } from "./types";

// Acesso aos dados da LP Casar. Usa a service role: as rotas que chamam estas
// funções conferem antes o dono do site ou a senha do site.
//
// Com LP_CASAR_LOCAL=1 (só em `next dev`) tudo fica em .data/lp-casar, sem tocar no
// Supabase: dá para testar o fluxo inteiro, inclusive cadastro, sem criar contas reais.

export const LOCAL_MODE = process.env.LP_CASAR_LOCAL === "1" && process.env.NODE_ENV !== "production";
export const BUCKET = "casar";
export const LOCAL_DIR = path.join(process.cwd(), ".data", "lp-casar");

export type Site = { id: string; ownerId: string; slug: string; data: SiteData; views: number };

export const RESERVED_SLUGS = new Set(["entrar", "encontrar", "criar", "painel", "redefinir", "confirmar", "termos", "api", "admin", "lp-casar"]);

type LocalRecord = { id: string; siteId: string; kind: RecordKind; createdAt: string; data: unknown };
type LocalSite = { id: string; ownerId: string; slug: string; data: unknown; views?: number };
export type LocalDb = {
  users: { id: string; email: string; passwordHash: string; consent?: { termsAt: string; marketing: boolean } }[];
  sessions: Record<string, string>;
  resets?: Record<string, { userId: string; expires: number }>;
  sites: LocalSite[];
  records: LocalRecord[];
};

const localFile = () => path.join(LOCAL_DIR, "db.json");

export function readLocal(): LocalDb {
  try {
    return JSON.parse(fs.readFileSync(localFile(), "utf8")) as LocalDb;
  } catch {
    return { users: [], sessions: {}, sites: [], records: [] };
  }
}

export function writeLocal(db: LocalDb) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  fs.writeFileSync(localFile(), JSON.stringify(db, null, 2));
}

// As tabelas casar_* ainda não estão em database.types.ts: regenerar depois de aplicar a migration 0019.
const db = () => createServiceRoleClient() as unknown as SupabaseClient;

const SITE_COLUMNS = "id, owner_id, slug, data, views";
type SiteRow = { id: string; owner_id: string; slug: string; data: unknown; views: number };
type RecordRow<K extends RecordKind> = { id: string; created_at: string; data: RecordData[K] };
const toSite = (row: SiteRow): Site => ({ id: row.id, ownerId: row.owner_id, slug: row.slug, data: normalizeData(row.data), views: row.views ?? 0 });
const fromLocal = (site: LocalSite): Site => ({ ...site, data: normalizeData(site.data), views: site.views ?? 0 });

const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const searchText = (data: SiteData) => plain(coupleNames(data, " "));

export async function siteByOwner(ownerId: string): Promise<Site | null> {
  if (LOCAL_MODE) {
    const site = readLocal().sites.find((item) => item.ownerId === ownerId);
    return site ? fromLocal(site) : null;
  }
  const { data, error } = await db().from("casar_sites").select(SITE_COLUMNS).eq("owner_id", ownerId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toSite(data as SiteRow) : null;
}

export async function siteBySlug(slug: string): Promise<Site | null> {
  if (LOCAL_MODE) {
    const site = readLocal().sites.find((item) => item.slug === slug);
    return site ? fromLocal(site) : null;
  }
  const { data, error } = await db().from("casar_sites").select(SITE_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toSite(data as SiteRow) : null;
}

export async function slugAvailable(slug: string, exceptSiteId?: string) {
  if (RESERVED_SLUGS.has(slug)) return false;
  const site = await siteBySlug(slug);
  return !site || site.id === exceptSiteId;
}

export async function createSite(ownerId: string, slug: string, data: SiteData): Promise<Site> {
  if (LOCAL_MODE) {
    const local = readLocal();
    const site = { id: randomUUID(), ownerId, slug, data, views: 0 };
    local.sites.push(site);
    writeLocal(local);
    return site;
  }
  const { data: row, error } = await db()
    .from("casar_sites")
    .insert({ owner_id: ownerId, slug, data, search_text: searchText(data), searchable: data.privacy.searchable })
    .select(SITE_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toSite(row as SiteRow);
}

export async function updateSite(site: Site, patch: { slug?: string; data?: SiteData }) {
  const data = patch.data ?? site.data;
  const slug = patch.slug ?? site.slug;
  if (LOCAL_MODE) {
    const local = readLocal();
    const target = local.sites.find((item) => item.id === site.id);
    if (target) Object.assign(target, { slug, data });
    writeLocal(local);
    return;
  }
  const { error } = await db()
    .from("casar_sites")
    .update({ slug, data, search_text: searchText(data), searchable: data.privacy.searchable, updated_at: new Date().toISOString() })
    .eq("id", site.id);
  if (error) throw new Error(error.message);
}

/** Convidados abrindo o site. No banco é uma função atômica, para não perder acessos simultâneos. */
export async function countView(siteId: string) {
  if (LOCAL_MODE) {
    const local = readLocal();
    const target = local.sites.find((item) => item.id === siteId);
    if (target) target.views = (target.views ?? 0) + 1;
    writeLocal(local);
    return;
  }
  const { error } = await db().rpc("casar_count_view", { target: siteId });
  if (error) console.error("[casar] contador de acessos:", error.message);
}

/** Os registros saem junto, por cascata no banco. As fotos do bucket têm o id do site no nome. */
export async function deleteSite(site: Site) {
  if (LOCAL_MODE) {
    const local = readLocal();
    local.sites = local.sites.filter((item) => item.id !== site.id);
    local.records = local.records.filter((item) => item.siteId !== site.id);
    writeLocal(local);
    const dir = path.join(LOCAL_DIR, "media");
    if (fs.existsSync(dir)) {
      for (const name of fs.readdirSync(dir)) if (name.startsWith(site.id)) fs.rmSync(path.join(dir, name));
    }
    return;
  }
  const { error } = await db().from("casar_sites").delete().eq("id", site.id);
  if (error) throw new Error(error.message);
  const storage = db().storage.from(BUCKET);
  const { data: files } = await storage.list("", { search: site.id, limit: 1000 });
  if (files?.length) await storage.remove(files.map((file) => file.name));
}

export async function searchSites(query: string, date = "") {
  const term = plain(query).replace(/[%_,()]/g, " ").trim();
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (term.length < 3 && !validDate) return [];
  let sites: Site[];
  if (LOCAL_MODE) {
    sites = readLocal().sites.map(fromLocal).filter((site) => site.data.privacy.searchable && searchText(site.data).includes(term));
  } else if (term.length < 3) {
    const { data, error } = await db().from("casar_sites").select(SITE_COLUMNS).eq("searchable", true).eq("data->wedding->>date", date).limit(20);
    if (error) throw new Error(error.message);
    sites = (data as SiteRow[]).map(toSite);
  } else {
    const { data, error } = await db()
      .from("casar_sites")
      .select(SITE_COLUMNS)
      .eq("searchable", true)
      .ilike("search_text", `%${term}%`)
      .limit(20);
    if (error) throw new Error(error.message);
    sites = (data as SiteRow[]).map(toSite);
  }
  if (validDate) sites = sites.filter((site) => site.data.wedding.date === date);
  return sites.slice(0, 20).map((site) => ({
    slug: site.slug,
    names: coupleNames(site.data),
    date: site.data.wedding.date,
    city: site.data.wedding.city,
  }));
}

export async function listRecords<K extends RecordKind>(siteId: string, kind: K): Promise<Row<K>[]> {
  if (LOCAL_MODE) {
    return readLocal()
      .records.filter((item) => item.siteId === siteId && item.kind === kind)
      .map((item) => ({ id: item.id, createdAt: item.createdAt, data: item.data as RecordData[K] }));
  }
  const { data, error } = await db()
    .from("casar_records")
    .select("id, created_at, data")
    .eq("site_id", siteId)
    .eq("kind", kind)
    .order("created_at", { ascending: true })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data as RecordRow<K>[]).map((row) => ({ id: row.id, createdAt: row.created_at, data: row.data }));
}

export async function addRecords<K extends RecordKind>(siteId: string, kind: K, items: RecordData[K][]): Promise<Row<K>[]> {
  if (LOCAL_MODE) {
    const local = readLocal();
    const rows = items.map((data) => ({ id: randomUUID(), siteId, kind, createdAt: new Date().toISOString(), data }));
    local.records.push(...rows);
    writeLocal(local);
    return rows.map(({ id, createdAt, data }) => ({ id, createdAt, data }));
  }
  const { data, error } = await db()
    .from("casar_records")
    .insert(items.map((item) => ({ site_id: siteId, kind, data: item })))
    .select("id, created_at, data");
  if (error) throw new Error(error.message);
  return (data as RecordRow<K>[]).map((row) => ({ id: row.id, createdAt: row.created_at, data: row.data }));
}

/** Sempre filtra pelo site: um id de outro casal simplesmente não encontra nada. */
export async function patchRecord<K extends RecordKind>(siteId: string, kind: K, id: string, patch: Partial<RecordData[K]>) {
  if (LOCAL_MODE) {
    const local = readLocal();
    const target = local.records.find((item) => item.id === id && item.siteId === siteId && item.kind === kind);
    if (target) target.data = { ...(target.data as object), ...patch };
    writeLocal(local);
    return;
  }
  const { data, error } = await db().from("casar_records").select("data").eq("id", id).eq("site_id", siteId).eq("kind", kind).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return;
  const update = await db().from("casar_records").update({ data: { ...(data.data as object), ...patch } }).eq("id", id).eq("site_id", siteId);
  if (update.error) throw new Error(update.error.message);
}

export async function deleteRecord(siteId: string, kind: RecordKind, id: string) {
  if (LOCAL_MODE) {
    const local = readLocal();
    local.records = local.records.filter((item) => !(item.id === id && item.siteId === siteId && item.kind === kind));
    writeLocal(local);
    return;
  }
  const { error } = await db().from("casar_records").delete().eq("id", id).eq("site_id", siteId).eq("kind", kind);
  if (error) throw new Error(error.message);
}

export async function saveImage(siteId: string, jpeg: Buffer) {
  const name = `${siteId}-${randomUUID()}.jpg`;
  if (LOCAL_MODE) {
    const dir = path.join(LOCAL_DIR, "media");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), jpeg);
    return `/api/casar/media/${name}`;
  }
  const storage = db().storage.from(BUCKET);
  const { error } = await storage.upload(name, jpeg, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return storage.getPublicUrl(name).data.publicUrl;
}
