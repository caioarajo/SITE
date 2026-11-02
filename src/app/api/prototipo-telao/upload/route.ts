import { NextResponse, type NextRequest } from "next/server";
import { db, isDisabled } from "@/lib/telaoDemo/store";
import { IngestError, ingestFile, ingestMessage, MAX_MESSAGE, rateLimited } from "@/lib/telaoDemo/ingest";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: NextRequest) {
  if (isDisabled()) return new NextResponse(null, { status: 404 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Envio incompleto. Tente de novo.", 400);
  }

  const data = db();
  if (form.get("token") !== data.guestToken) return fail("Link inválido ou expirado. Escaneie o QR code de novo.", 403);
  if (!data.settings.uploadsOpen) return fail("Os envios deste evento foram encerrados.", 403);

  // Honeypot: campo invisível que só robô preenche. Responde ok para não dar pista.
  if (form.get("website")) return NextResponse.json({ ok: true, ignored: true });
  if (form.get("consent") !== "true") return fail("É preciso aceitar o aviso de privacidade.", 400);

  const deviceId = String(form.get("deviceId") ?? "").slice(0, 64);
  if (!deviceId) return fail("Aparelho não identificado.", 400);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (rateLimited(`d:${deviceId}`, 40) || rateLimited(`ip:${ip}`, 240)) {
    return fail("Muitos envios em pouco tempo. Aguarde um minuto.", 429);
  }

  const author = {
    guestName: String(form.get("guestName") ?? "").trim(),
    caption: String(form.get("caption") ?? "").trim(),
    deviceId,
    ip,
  };

  const file = form.get("file");
  if (!(file instanceof File)) {
    if (!author.caption) return fail("Escreva um recado ou escolha uma foto.", 400);
    if (author.caption.length > MAX_MESSAGE) return fail(`O recado pode ter até ${MAX_MESSAGE} caracteres.`, 400);
    const post = ingestMessage(author);
    return NextResponse.json({ ok: true, id: post.id, status: post.status });
  }

  try {
    const { post, duplicate } = await ingestFile(Buffer.from(await file.arrayBuffer()), author);
    return NextResponse.json({ ok: true, id: post.id, status: post.status, duplicate });
  } catch (err) {
    if (err instanceof IngestError) return fail(err.message, err.status);
    console.error("[telao] falha no upload", err);
    return fail("Falha ao salvar o arquivo.", 500);
  }
}
