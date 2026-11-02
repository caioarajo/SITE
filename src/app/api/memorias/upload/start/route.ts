import { NextResponse, type NextRequest } from "next/server";
import { BUCKET, db, eventByGuestToken, settingsOf } from "@/lib/memorias/server";
import { deviceOverLimit, incomingPath, rateLimited, validClientId, validDeviceId } from "@/lib/memorias/ingest";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/memorias/types";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Autoriza um envio e devolve a URL assinada: o arquivo vai do navegador direto para o
 * Storage, porque as funções da Vercel recusam corpos acima de cerca de 4,5 MB. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    deviceId?: string;
    clientId?: string;
    consent?: boolean;
    website?: string;
    size?: number;
    isVideo?: boolean;
  };

  const event = await eventByGuestToken(body.token);
  if (!event) return fail("Link inválido ou expirado. Escaneie o QR code de novo.", 403);
  if (!settingsOf(event).uploadsOpen) return fail("Os envios deste evento foram encerrados.", 403);

  // Honeypot: campo invisível que só robô preenche. Responde ok para não dar pista.
  if (body.website) return NextResponse.json({ ok: true, ignored: true });
  if (body.consent !== true) return fail("É preciso aceitar o aviso de privacidade.", 400);
  if (!validDeviceId(body.deviceId) || !validClientId(body.clientId)) return fail("Envio inválido.", 400);

  const limit = body.isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (typeof body.size !== "number" || body.size <= 0 || body.size > limit) {
    return fail(`Arquivo acima do limite de ${limit / 1024 / 1024} MB.`, 413);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (rateLimited(`ip:${ip}`, 300) || (await deviceOverLimit(event.id, body.deviceId, 40))) {
    return fail("Muitos envios em pouco tempo. Aguarde um minuto.", 429);
  }

  const { data, error } = await db()
    .storage.from(BUCKET)
    .createSignedUploadUrl(incomingPath(event.id, body.deviceId, body.clientId), { upsert: true });
  if (error || !data) {
    console.error("[memorias] upload/start", error);
    return fail("Não foi possível iniciar o envio.", 500);
  }
  return NextResponse.json({ ok: true, signedUrl: data.signedUrl });
}
