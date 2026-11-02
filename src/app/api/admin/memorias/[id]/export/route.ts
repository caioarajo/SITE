import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/supabase/admin-guard";
import { approvedOriginals, BUCKET } from "@/lib/memorias/server";

export const dynamic = "force-dynamic";

/** Lista os originais aprovados com URLs assinadas; o painel monta o ZIP no navegador. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if ("error" in guard) return guard.error;
  const items = await approvedOriginals((await params).id);
  if (!items.length) return NextResponse.json({ files: [] });

  const { data, error } = await guard.serviceClient.storage.from(BUCKET).createSignedUrls(items.map((i) => i.path), 3600);
  if (error || !data) return NextResponse.json({ error: "Não foi possível preparar o download." }, { status: 500 });

  const files = items.flatMap((item, i) => {
    const url = data[i]?.signedUrl;
    if (!url) return [];
    const who = (item.name || "convidado").normalize("NFD").replace(/[^\w-]+/g, "-").slice(0, 40);
    return [{ name: `${String(i + 1).padStart(4, "0")}-${who}${path.extname(item.path)}`, url }];
  });
  return NextResponse.json({ files });
}
