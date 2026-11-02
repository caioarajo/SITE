import { NextResponse, type NextRequest } from "next/server";
import { commit, db, isDisabled, removeFiles } from "@/lib/telaoDemo/store";
import { rateLimited } from "@/lib/telaoDemo/ingest";

export const dynamic = "force-dynamic";

/** Ações do convidado: curtir uma foto e apagar a própria foto. */
export async function POST(request: NextRequest) {
  if (isDisabled()) return new NextResponse(null, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    deviceId?: string;
    action?: string;
    postId?: string;
  };
  const data = db();
  if (body.token !== data.guestToken || !body.deviceId) {
    return NextResponse.json({ error: "Link inválido." }, { status: 403 });
  }
  const post = data.posts.find((p) => p.id === body.postId);
  if (!post) return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });

  if (body.action === "heart") {
    if (post.status !== "approved") return NextResponse.json({ error: "Publicação indisponível." }, { status: 404 });
    if (rateLimited(`h:${body.deviceId}`, 120)) return NextResponse.json({ error: "Calma!" }, { status: 429 });
    const index = post.heartedBy.indexOf(body.deviceId);
    if (index >= 0) post.heartedBy.splice(index, 1);
    else post.heartedBy.push(body.deviceId);
    post.hearts = post.heartedBy.length;
    commit();
    return NextResponse.json({ ok: true, hearts: post.hearts });
  }

  if (body.action === "delete") {
    if (post.deviceId !== body.deviceId) return NextResponse.json({ error: "Só quem enviou pode apagar." }, { status: 403 });
    data.posts = data.posts.filter((p) => p.id !== post.id);
    removeFiles(post);
    commit();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
}
