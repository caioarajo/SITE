import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import convert from "heic-convert";
import sharp from "sharp";
import { isHeicSignature } from "@/lib/heic";
import { commit, db, MEDIA_DIR, type StoredPost } from "./store";

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const MAX_NAME = 60;
export const MAX_CAPTION = 140;
export const MAX_MESSAGE = 280;

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

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function hasBlockedWord(text: string) {
  const haystack = normalize(text);
  return db().settings.blockedWords.some((w) => w && haystack.includes(normalize(w)));
}

/** Decide o status inicial: bloqueado some em silêncio; palavra proibida sempre vai para revisão. */
function initialStatus(deviceId: string, text: string) {
  const { settings, blockedDevices } = db();
  const flagged = hasBlockedWord(text);
  if (blockedDevices.includes(deviceId)) return { status: "hidden" as const, flagged };
  if (flagged || settings.moderation === "manual") return { status: "pending" as const, flagged };
  return { status: "approved" as const, flagged };
}

interface Author {
  guestName: string;
  caption: string;
  deviceId: string;
  ip: string;
  simulated?: boolean;
}

export async function ingestFile(bytes: Buffer, author: Author): Promise<{ post: StoredPost; duplicate: boolean }> {
  const type = sniff(bytes);
  if (!type) throw new IngestError("Formato não aceito. Envie foto (JPG, PNG, WebP, HEIC) ou vídeo (MP4, MOV, WebM).", 415);
  const limit = type.kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (bytes.length > limit) throw new IngestError(`Arquivo acima do limite de ${limit / 1024 / 1024} MB.`, 413);

  // O reenvio automático em rede ruim não pode duplicar a foto no telão.
  const sha = createHash("sha256").update(bytes).digest("hex");
  const data = db();
  if (!author.simulated) {
    const existing = data.posts.find((p) => p.sha === sha && p.deviceId === author.deviceId);
    if (existing) return { post: existing, duplicate: true };
  }

  const id = randomUUID();
  const original = `${id}-original.${type.ext}`;
  let display = original;
  let thumb = original;
  let width = 0;
  let height = 0;

  if (type.kind === "photo") {
    try {
      const source = type.heic
        ? Buffer.from(await convert({ buffer: bytes, format: "JPEG", quality: 0.92 }))
        : bytes;
      // rotate() aplica a orientação do EXIF; o resultado sai sem metadados (inclusive GPS).
      const big = await sharp(source)
        .rotate()
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 84, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
      width = big.info.width;
      height = big.info.height;
      display = `${id}-display.jpg`;
      thumb = `${id}-thumb.jpg`;
      fs.writeFileSync(path.join(MEDIA_DIR, display), big.data);
      await sharp(big.data).resize({ width: 480, height: 480, fit: "inside" }).jpeg({ quality: 72 }).toFile(path.join(MEDIA_DIR, thumb));
    } catch {
      throw new IngestError("Não foi possível ler esta imagem.", 415);
    }
  }
  fs.writeFileSync(path.join(MEDIA_DIR, original), bytes);

  const post: StoredPost = {
    id,
    kind: type.kind,
    ...initialStatus(author.deviceId, `${author.guestName} ${author.caption}`),
    pinned: false,
    guestName: author.guestName.slice(0, MAX_NAME),
    caption: author.caption.slice(0, MAX_CAPTION),
    createdAt: Date.now(),
    width,
    height,
    hearts: 0,
    size: bytes.length,
    simulated: !!author.simulated,
    deviceId: author.deviceId,
    ip: author.ip,
    sha,
    original,
    display,
    thumb,
    mime: type.mime,
    heartedBy: [],
  };
  data.posts.push(post);
  commit();
  return { post, duplicate: false };
}

export function ingestMessage(author: Author): StoredPost {
  const post: StoredPost = {
    id: randomUUID(),
    kind: "message",
    ...initialStatus(author.deviceId, `${author.guestName} ${author.caption}`),
    pinned: false,
    guestName: author.guestName.slice(0, MAX_NAME),
    caption: author.caption.slice(0, MAX_MESSAGE),
    createdAt: Date.now(),
    width: 0,
    height: 0,
    hearts: 0,
    size: 0,
    simulated: !!author.simulated,
    deviceId: author.deviceId,
    ip: author.ip,
    sha: "",
    original: "",
    display: "",
    thumb: "",
    mime: "",
    heartedBy: [],
  };
  db().posts.push(post);
  commit();
  return post;
}

export class IngestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Limite simples por aparelho e por IP, em memória.
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
