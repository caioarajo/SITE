import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { requireOwnSite } from "@/lib/casar/auth";
import { saveImage } from "@/lib/casar/store";

export const dynamic = "force-dynamic";

/** O navegador já reduz a foto antes de enviar (a Vercel recusa corpos acima de 4,5 MB). */
export async function POST(request: NextRequest) {
  const guard = await requireOwnSite();
  if ("error" in guard) return guard.error;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Envie uma imagem." }, { status: 400 });

  try {
    // Regravar com o sharp valida pelos bytes e descarta metadados, como o GPS da foto.
    const jpeg = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    return NextResponse.json({ url: await saveImage(guard.site.id, jpeg) });
  } catch {
    return NextResponse.json({ error: "Não foi possível ler esta imagem. Use JPG, PNG ou WebP." }, { status: 400 });
  }
}
