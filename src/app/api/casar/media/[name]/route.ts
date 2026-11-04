import fs from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { LOCAL_DIR, LOCAL_MODE } from "@/lib/casar/store";

export const dynamic = "force-dynamic";

/** Só no modo local: em produção as fotos ficam no bucket público do Supabase. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!LOCAL_MODE || !/^[\w-]+\.jpg$/.test(name)) return new NextResponse(null, { status: 404 });
  const file = path.join(LOCAL_DIR, "media", name);
  if (!fs.existsSync(file)) return new NextResponse(null, { status: 404 });
  return new NextResponse(fs.readFileSync(file), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000" } });
}
