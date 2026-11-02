import { NextResponse, type NextRequest } from "next/server";
import { BUCKET, db, eventByGuestToken, notifyChanged, pathsOf, settingsOf } from "@/lib/memorias/server";
import { createMessage, deviceOverLimit, IngestError, rateLimited, validDeviceId } from "@/lib/memorias/ingest";
import { MAX_MESSAGE } from "@/lib/memorias/types";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Ações do convidado: deixar recado, curtir uma foto e apagar o que enviou. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    deviceId?: string;
    action?: string;
    postId?: string;
    guestName?: string;
    caption?: string;
    consent?: boolean;
    website?: string;
  };
  const event = await eventByGuestToken(body.token);
  if (!event) return fail("Link inválido.", 403);
  if (!validDeviceId(body.deviceId)) return fail("Aparelho não identificado.", 400);
  const client = db();

  if (body.action === "message") {
    if (!settingsOf(event).uploadsOpen) return fail("Os envios deste evento foram encerrados.", 403);
    if (body.website) return NextResponse.json({ ok: true, ignored: true });
    if (body.consent !== true) return fail("É preciso aceitar o aviso de privacidade.", 400);
    const caption = String(body.caption ?? "").trim();
    if (!caption) return fail("Escreva um recado.", 400);
    if (caption.length > MAX_MESSAGE) return fail(`O recado pode ter até ${MAX_MESSAGE} caracteres.`, 400);
    if (await deviceOverLimit(event.id, body.deviceId, 40)) return fail("Muitos envios em pouco tempo. Aguarde um minuto.", 429);
    try {
      const post = await createMessage(event, { guestName: String(body.guestName ?? "").trim(), caption, deviceId: body.deviceId });
      return NextResponse.json({ ok: true, id: post.id, status: post.status });
    } catch (err) {
      return fail(err instanceof IngestError ? err.message : "Falha ao salvar o recado.", 500);
    }
  }

  const { data: post } = await client.from("memorias_posts").select("*").eq("id", body.postId ?? "").eq("event_id", event.id).maybeSingle();
  if (!post) return fail("Publicação não encontrada.", 404);

  if (body.action === "heart") {
    if (post.status !== "approved") return fail("Publicação indisponível.", 404);
    if (rateLimited(`h:${body.deviceId}`, 120)) return fail("Calma!", 429);
    const removed = await client.from("memorias_hearts").delete().eq("post_id", post.id).eq("device_id", body.deviceId).select("post_id");
    if (!removed.data?.length) await client.from("memorias_hearts").insert({ post_id: post.id, device_id: body.deviceId });
    await notifyChanged(event.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    if (post.device_id !== body.deviceId) return fail("Só quem enviou pode apagar.", 403);
    await client.from("memorias_posts").delete().eq("id", post.id);
    const paths = pathsOf(post);
    if (paths.length) await client.storage.from(BUCKET).remove(paths);
    await notifyChanged(event.id);
    return NextResponse.json({ ok: true });
  }

  return fail("Ação desconhecida.", 400);
}
