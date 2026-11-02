import { randomUUID } from "node:crypto";
import convert from "heic-convert";
import sharp from "sharp";
import { isHeicSignature } from "@/lib/heic";
import { BUCKET, db, notifyChanged, settingsOf, type EventRow, type PostRow } from "./server";
import { MAX_CAPTION, MAX_IMAGE_BYTES, MAX_MESSAGE, MAX_NAME, MAX_VIDEO_BYTES } from "./types";

type Sniffed = { kind: "photo" | "video"; ext: string; mime: string; heic: boolean } | null;

/** Identifica o tipo pelos bytes, nunca pela extensão ou content-type informados. */
export function sniff(b: Buffer): Sniffed {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: "photo", ext: "jpg", mime: "image/jpeg", heic: false };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { kind: "photo", ext: "png", mime: "image/png", heic: false };
  }
  if (b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") {
    return { kind: "photo", ext: "webp", mime: "image/webp", heic: false };
  }
  if (isHeicSignature(b)) return { kind: "photo", ext: "heic", mime: "image/heic", heic: true };
  if (b.toString("latin1", 4, 8) === "ftyp") {
    const qt = b.toString("latin1", 8, 10) === "qt";
    return { kind: "video", ext: qt ? "mov" : "mp4", mime: qt ? "video/quicktime" : "video/mp4", heic: false };
  }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) {
    return { kind: "video", ext: "webm", mime: "video/webm", heic: false };
  }
  return null;
}

export class IngestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Decide o status inicial: bloqueado some em silêncio; palavra proibida sempre vai para revisão. */
function initialStatus(event: EventRow, deviceId: string, text: string) {
  const settings = settingsOf(event);
  const haystack = normalize(text);
  const flagged = settings.blockedWords.some((w) => w && haystack.includes(normalize(w)));
  if (event.blocked_devices.includes(deviceId)) return { status: "hidden", flagged };
  if (flagged || settings.moderation === "manual") return { status: "pending", flagged };
  return { status: "approved", flagged };
}

export interface Author {
  guestName: string;
  caption: string;
  deviceId: string;
}

export const incomingPath = (eventId: string, deviceId: string, clientId: string) =>
  `${eventId}/incoming/${deviceId}-${clientId}`;

async function findExisting(eventId: string, deviceId: string, clientId: string) {
  const { data } = await db()
    .from("memorias_posts")
    .select("*")
    .eq("event_id", eventId)
    .eq("device_id", deviceId)
    .eq("client_id", clientId)
    .maybeSingle();
  return data;
}

/** Processa o arquivo que o navegador já subiu direto para o Storage e cria a publicação. */
export async function finishUpload(event: EventRow, author: Author, clientId: string): Promise<{ post: PostRow; duplicate: boolean }> {
  const existing = await findExisting(event.id, author.deviceId, clientId);
  if (existing) return { post: existing, duplicate: true };

  const storage = db().storage.from(BUCKET);
  const source = incomingPath(event.id, author.deviceId, clientId);
  const { data: signed } = await storage.createSignedUrl(source, 300);
  if (!signed) throw new IngestError("Arquivo não encontrado. Tente enviar de novo.", 409);

  const head = await fetch(signed.signedUrl, { headers: { Range: "bytes=0-63" } });
  if (!head.ok) throw new IngestError("Arquivo não encontrado. Tente enviar de novo.", 409);
  const total = Number(head.headers.get("content-range")?.split("/")[1] ?? 0);
  const type = sniff(Buffer.from(await head.arrayBuffer()));

  const reject = async (message: string, status: number) => {
    await storage.remove([source]);
    return new IngestError(message, status);
  };
  if (!type) throw await reject("Formato não aceito. Envie foto (JPG, PNG, WebP, HEIC) ou vídeo (MP4, MOV, WebM).", 415);
  const limit = type.kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (total > limit) throw await reject(`Arquivo acima do limite de ${limit / 1024 / 1024} MB.`, 413);

  const id = randomUUID();
  const original = `${event.id}/${id}-original.${type.ext}`;
  let display = original;
  let thumb = original;
  let width = 0;
  let height = 0;

  if (type.kind === "photo") {
    try {
      const bytes = Buffer.from(await (await fetch(signed.signedUrl)).arrayBuffer());
      const decoded = type.heic ? Buffer.from(await convert({ buffer: bytes, format: "JPEG", quality: 0.92 })) : bytes;
      // rotate() aplica a orientação do EXIF; o resultado sai sem metadados (inclusive GPS).
      const big = await sharp(decoded)
        .rotate()
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 84, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
      const small = await sharp(big.data).resize({ width: 480, height: 480, fit: "inside" }).jpeg({ quality: 72 }).toBuffer();
      width = big.info.width;
      height = big.info.height;
      display = `${event.id}/${id}-display.jpg`;
      thumb = `${event.id}/${id}-thumb.jpg`;
      const [a, b] = await Promise.all([
        storage.upload(display, big.data, { contentType: "image/jpeg", cacheControl: "31536000" }),
        storage.upload(thumb, small, { contentType: "image/jpeg", cacheControl: "31536000" }),
      ]);
      if (a.error || b.error) throw new Error((a.error ?? b.error)?.message);
    } catch (err) {
      console.error("[memorias] processamento", err);
      throw await reject("Não foi possível ler esta imagem.", 415);
    }
  }

  const moved = await storage.move(source, original);
  if (moved.error) throw new IngestError("Falha ao salvar o arquivo. Tente de novo.", 500);

  const { data: post, error } = await db()
    .from("memorias_posts")
    .insert({
      id,
      event_id: event.id,
      kind: type.kind,
      ...initialStatus(event, author.deviceId, `${author.guestName} ${author.caption}`),
      guest_name: author.guestName.slice(0, MAX_NAME),
      caption: author.caption.slice(0, MAX_CAPTION),
      width,
      height,
      size_bytes: total,
      device_id: author.deviceId,
      client_id: clientId,
      original_path: original,
      display_path: display,
      thumb_path: thumb,
      mime: type.mime,
    })
    .select("*")
    .single();

  if (error || !post) {
    await storage.remove([...new Set([original, display, thumb])]);
    // Duas tentativas simultâneas do mesmo arquivo: vale a que chegou primeiro.
    const again = await findExisting(event.id, author.deviceId, clientId);
    if (again) return { post: again, duplicate: true };
    throw new IngestError("Falha ao salvar a publicação. Tente de novo.", 500);
  }
  await notifyChanged(event.id);
  return { post, duplicate: false };
}

export async function createMessage(event: EventRow, author: Author) {
  const { data: post, error } = await db()
    .from("memorias_posts")
    .insert({
      event_id: event.id,
      kind: "message",
      ...initialStatus(event, author.deviceId, `${author.guestName} ${author.caption}`),
      guest_name: author.guestName.slice(0, MAX_NAME),
      caption: author.caption.slice(0, MAX_MESSAGE),
      device_id: author.deviceId,
    })
    .select("*")
    .single();
  if (error || !post) throw new IngestError("Falha ao salvar o recado.", 500);
  await notifyChanged(event.id);
  return post;
}

/** Quantos envios o aparelho fez no último minuto. Fica no banco porque a Vercel roda várias instâncias. */
export async function deviceOverLimit(eventId: string, deviceId: string, maxPerMinute: number) {
  const { count } = await db()
    .from("memorias_posts")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("device_id", deviceId)
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());
  return (count ?? 0) >= maxPerMinute;
}

// Limite por instância, em memória, para frear rajadas em rotas sem escrita pesada.
const hits = new Map<string, number[]>();
export function rateLimited(key: string, maxPerMinute: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= maxPerMinute) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export const validDeviceId = (id: unknown): id is string => typeof id === "string" && /^[a-f0-9]{16,64}$/.test(id);
export const validClientId = (id: unknown): id is string => typeof id === "string" && /^[a-f0-9]{32}$/.test(id);
