import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/supabase/admin-guard";
import { BUCKET } from "@/lib/memorias/server";

export const dynamic = "force-dynamic";

/** Mídia para o painel, inclusive a ainda não aprovada. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ postId: string; variant: string }> }) {
  const guard = await requireStaff();
  if ("error" in guard) return guard.error;
  const { postId, variant } = await params;
  const { data: post } = await guard.serviceClient.from("memorias_posts").select("thumb_path, display_path").eq("id", postId).maybeSingle();
  const path = variant === "thumb" ? post?.thumb_path : post?.display_path;
  if (!path) return new NextResponse(null, { status: 404 });
  const { data } = await guard.serviceClient.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (!data) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { "Cache-Control": "private, max-age=3000" } });
}
