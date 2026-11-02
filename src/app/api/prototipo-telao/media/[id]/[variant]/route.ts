import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { db, isDisabled, MEDIA_DIR } from "@/lib/telaoDemo/store";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variant: string }> },
) {
  if (isDisabled()) return new NextResponse(null, { status: 404 });
  const { id, variant } = await params;
  const { searchParams } = request.nextUrl;
  const data = db();
  const post = data.posts.find((p) => p.id === id);
  if (!post || !post.original) return new NextResponse(null, { status: 404 });

  // Mídia ainda não aprovada só sai para o painel ou para o próprio autor.
  const credential = searchParams.get("k") ?? searchParams.get("t");
  const isAdmin = credential === data.adminKey;
  const isOwner = credential === data.guestToken && !!searchParams.get("d") && searchParams.get("d") === post.deviceId;
  const canSeeApproved =
    credential === data.wallToken || (credential === data.guestToken && data.settings.guestsSeeGallery);
  if (!isAdmin && !isOwner && !(canSeeApproved && post.status === "approved")) {
    return new NextResponse(null, { status: 403 });
  }

  // O original (com metadados) é só do painel.
  const file = variant === "original" && isAdmin ? post.original : variant === "thumb" ? post.thumb : post.display;
  const filePath = path.join(MEDIA_DIR, file);
  if (!fs.existsSync(filePath)) return new NextResponse(null, { status: 404 });
  const size = fs.statSync(filePath).size;
  const mime = file.endsWith("-display.jpg") || file.endsWith("-thumb.jpg") ? "image/jpeg" : post.mime;
  const base = { "Content-Type": mime, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600" };

  // Range: o player de vídeo do navegador (Safari em especial) depende disso.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const body = Readable.toWeb(fs.createReadStream(filePath, { start, end })) as ReadableStream;
    return new NextResponse(body, {
      status: 206,
      headers: { ...base, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${size}` },
    });
  }
  const body = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream;
  return new NextResponse(body, { headers: { ...base, "Content-Length": String(size) } });
}
