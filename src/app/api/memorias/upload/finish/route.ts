import { NextResponse, type NextRequest } from "next/server";
import { eventByGuestToken } from "@/lib/memorias/server";
import { finishUpload, IngestError, validClientId, validDeviceId } from "@/lib/memorias/ingest";

export const dynamic = "force-dynamic";
// Converter um HEIC grande leva alguns segundos.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    deviceId?: string;
    clientId?: string;
    guestName?: string;
    caption?: string;
  };
  const event = await eventByGuestToken(body.token);
  if (!event) return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 403 });
  if (!validDeviceId(body.deviceId) || !validClientId(body.clientId)) {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  try {
    const { post, duplicate } = await finishUpload(
      event,
      { guestName: String(body.guestName ?? "").trim(), caption: String(body.caption ?? "").trim(), deviceId: body.deviceId },
      body.clientId,
    );
    return NextResponse.json({ ok: true, id: post.id, status: post.status, duplicate });
  } catch (err) {
    if (err instanceof IngestError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[memorias] upload/finish", err);
    return NextResponse.json({ error: "Falha ao salvar o arquivo." }, { status: 500 });
  }
}
