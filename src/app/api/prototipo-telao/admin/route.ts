import fs from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { commit, db, isDisabled, removeFiles, resetAll, rotateGuestToken } from "@/lib/telaoDemo/store";
import { ingestFile, ingestMessage } from "@/lib/telaoDemo/ingest";
import type { PostStatus, WallSettings } from "@/lib/telaoDemo/types";

export const dynamic = "force-dynamic";

// Simulador: as fotos do portfólio fazem o papel de fotos de convidados.
const SAMPLE_PHOTOS = ["01", "02", "03", "04", "05", "06", "07"].map((n) => `portfolio-${n}.jpg`);
const SAMPLE_NAMES = ["Marina", "Tio Carlos", "Juliana & Beto", "Prima Clara", "Rafael", "Vó Lourdes", "Dani", ""];
const SAMPLE_CAPTIONS = ["Que festa linda!", "Vivam os noivos!", "Melhor pista do ano", "", "Muito amor nesse dia", "", "Emocionada aqui"];
const SAMPLE_MESSAGES = [
  "Que Deus abençoe essa união. Felicidades, meus queridos!",
  "Obrigado por nos deixarem fazer parte deste dia. Amamos vocês!",
  "Que a vida a dois seja tão bonita quanto esta noite.",
];
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const simulatedDevice = () => `sim-${Math.floor(Math.random() * 6)}`;

const EDITABLE: (keyof WallSettings)[] = [
  "title", "subtitle", "uploadsOpen", "moderation", "wallPaused", "pauseMessage", "layout", "intervalSec",
  "showNames", "showCaptions", "showQr", "guestsSeeGallery", "blockedWords", "baseUrl",
];

function sanitizeSettings(patch: Partial<WallSettings>): Partial<WallSettings> {
  const clean: Record<string, unknown> = {};
  for (const key of EDITABLE) if (key in patch) clean[key] = patch[key];
  if (clean.intervalSec !== undefined) clean.intervalSec = Math.min(30, Math.max(3, Number(clean.intervalSec) || 7));
  if (clean.layout !== undefined && !["cinema", "mosaico", "polaroid"].includes(String(clean.layout))) delete clean.layout;
  if (clean.moderation !== undefined && !["manual", "auto"].includes(String(clean.moderation))) delete clean.moderation;
  return clean as Partial<WallSettings>;
}

export async function POST(request: NextRequest) {
  if (isDisabled()) return new NextResponse(null, { status: 404 });
  const data = db();
  if (request.headers.get("x-telao-key") !== data.adminKey) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    ids?: string[];
    id?: string;
    deviceId?: string;
    settings?: Partial<WallSettings>;
    count?: number;
    kind?: string;
  };
  const targets = () => data.posts.filter((p) => (body.ids ?? (body.id ? [body.id] : [])).includes(p.id));
  const setStatus = (status: PostStatus) => {
    targets().forEach((p) => (p.status = status));
    commit();
  };

  switch (body.action) {
    case "approve":
      setStatus("approved");
      break;
    case "hide":
      setStatus("hidden");
      break;
    case "pending":
      setStatus("pending");
      break;
    case "approveAllPending":
      data.posts.filter((p) => p.status === "pending").forEach((p) => (p.status = "approved"));
      commit();
      break;
    case "delete": {
      const list = targets();
      const ids = new Set(list.map((p) => p.id));
      data.posts = data.posts.filter((p) => !ids.has(p.id));
      list.forEach(removeFiles);
      commit();
      break;
    }
    case "pin":
      targets().forEach((p) => (p.pinned = !p.pinned));
      commit();
      break;
    case "showNow": {
      const post = targets()[0];
      if (!post) return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });
      post.status = "approved";
      data.showNow = { id: post.id, at: Date.now() };
      commit();
      break;
    }
    case "blockDevice":
      if (body.deviceId && !data.blockedDevices.includes(body.deviceId)) {
        data.blockedDevices.push(body.deviceId);
        data.posts.filter((p) => p.deviceId === body.deviceId).forEach((p) => (p.status = "hidden"));
        commit();
      }
      break;
    case "unblockDevice":
      data.blockedDevices = data.blockedDevices.filter((d) => d !== body.deviceId);
      commit();
      break;
    case "settings":
      data.settings = { ...data.settings, ...sanitizeSettings(body.settings ?? {}) };
      commit();
      break;
    case "rotateGuestToken":
      rotateGuestToken();
      break;
    case "simulate": {
      const count = Math.min(20, Math.max(1, body.count ?? 1));
      for (let i = 0; i < count; i++) {
        const author = {
          guestName: pick(SAMPLE_NAMES),
          caption: body.kind === "message" ? pick(SAMPLE_MESSAGES) : pick(SAMPLE_CAPTIONS),
          deviceId: simulatedDevice(),
          ip: "simulador",
          simulated: true,
        };
        if (body.kind === "message") ingestMessage(author);
        else await ingestFile(fs.readFileSync(path.join(process.cwd(), "public", "images", pick(SAMPLE_PHOTOS))), author);
      }
      break;
    }
    case "simulateHearts": {
      const approved = data.posts.filter((p) => p.status === "approved");
      for (let i = 0; i < 6 && approved.length; i++) {
        const post = pick(approved);
        post.heartedBy.push(`sim-heart-${Date.now()}-${i}`);
        post.hearts = post.heartedBy.length;
      }
      commit();
      break;
    }
    case "reset":
      resetAll();
      break;
    default:
      return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
