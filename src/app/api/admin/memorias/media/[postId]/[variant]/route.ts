import { NextResponse, type NextRequest } from "next/server";
import { requireEventAccess } from "@/lib/memorias/access";
import { BUCKET, db } from "@/lib/memorias/server";

export const dynamic = "force-dynamic";

/** Mídia para o painel, inclusive a ainda não aprovada. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ postId: string; variant: string }> }) {
  const { postId, variant } = await params;
  const { data: post } = await db().from("memorias_posts").select("event_id, thumb_path, display_path").eq("id", postId).maybeSingle();
  if (!post) return new NextResponse(null, { status: 404 });
  const access = await requireEventAccess(post.event_id);
  if ("error" in access) return access.error;
  const path = variant === "thumb" ? post?.thumb_path : post?.display_path;
  if (!path) return new NextResponse(null, { status: 404 });
  const { data } = await access.serviceClient.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (!data) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { "Cache-Control": "private, max-age=3000" } });
}
