import { NextResponse, type NextRequest } from "next/server";
import convert from "heic-convert";
import { requireStaff } from "@/lib/supabase/admin-guard";
import { isHeicSignature } from "@/lib/heic";

export const runtime = "nodejs";

/**
 * Recebe um arquivo de imagem do upload do portfólio e, se os bytes forem
 * HEIC/HEIF de verdade (independente da extensão), converte para JPEG antes
 * de subir no storage — evita o caso de foto de iPhone salva como ".jpg"
 * sem conversão real, que fica com a miniatura quebrada no navegador.
 * Vídeos e imagens que já não são HEIC passam batido pelo client direto
 * (ver uploadFiles em admin/portfolio/page.tsx) e nunca chegam aqui.
 */
export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if ("error" in guard) return guard.error;
  const { serviceClient } = guard;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }

  let bytes = new Uint8Array(await file.arrayBuffer());
  let ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  let contentType = file.type || "application/octet-stream";

  if (isHeicSignature(bytes)) {
    try {
      const outputBuffer = await convert({ buffer: Buffer.from(bytes), format: "JPEG", quality: 0.9 });
      bytes = new Uint8Array(outputBuffer);
      ext = "jpg";
      contentType = "image/jpeg";
    } catch {
      return NextResponse.json(
        { error: "Não foi possível converter essa foto (HEIC/HEIF). Exporte como JPEG e tente de novo." },
        { status: 422 },
      );
    }
  }

  const path = `uploads/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await serviceClient.storage.from("portfolio").upload(path, bytes, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = serviceClient.storage.from("portfolio").getPublicUrl(path);
  return NextResponse.json({ path, url: publicUrlData.publicUrl });
}
