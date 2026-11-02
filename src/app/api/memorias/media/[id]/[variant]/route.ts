import { NextResponse, type NextRequest } from "next/server";
import { BUCKET, db, eventById, settingsOf } from "@/lib/memorias/server";

export const dynamic = "force-dynamic";

const SIGNED_SECONDS = 3600;

/** Confere a permissão e redireciona para uma URL assinada. O endereço estável desta rota
 * evita que a foto recarregue no telão a cada atualização, já que a URL assinada sempre muda. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; variant: string }> }) {
  const { id, variant } = await params;
  const { searchParams } = request.nextUrl;
  const client = db();
  const { data: post } = await client.from("memorias_posts").select("*").eq("id", id).maybeSingle();
  if (!post?.display_path) return new NextResponse(null, { status: 404 });
  const event = await eventById(post.event_id);
  if (!event) return new NextResponse(null, { status: 404 });

  // Mídia ainda não aprovada só sai para o próprio autor.
  const token = searchParams.get("t");
  const isGuest = token === event.guest_token;
  const isOwner = isGuest && searchParams.get("d") === post.device_id;
  const canSeeApproved = token === event.wall_token || (isGuest && settingsOf(event).guestsSeeGallery);
  if (!isOwner && !(canSeeApproved && post.status === "approved")) return new NextResponse(null, { status: 403 });

  const path = variant === "thumb" ? post.thumb_path : post.display_path;
  const { data } = await client.storage.from(BUCKET).createSignedUrl(path as string, SIGNED_SECONDS);
  if (!data) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { "Cache-Control": "private, max-age=3000" } });
}
