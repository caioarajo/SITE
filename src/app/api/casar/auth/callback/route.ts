import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Destino do link do e-mail de redefinição: troca o código por uma sessão e abre a tela de nova senha. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const target = new URL("/lp-casar/redefinir", request.url);
  if (!code) {
    target.searchParams.set("erro", "1");
    return NextResponse.redirect(target);
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) target.searchParams.set("erro", "1");
  return NextResponse.redirect(target);
}
