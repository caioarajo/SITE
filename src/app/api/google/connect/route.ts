import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { buildConsentUrl } from "@/lib/googleCalendar";

export const runtime = "nodejs";

/** Começa a autorização do Google Agenda. Só o admin logado pode iniciar. */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: "Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET primeiro." }, { status: 500 });
  }

  const state = crypto.randomUUID();
  const redirectUri = `${request.nextUrl.origin}/api/google/callback`;
  const response = NextResponse.redirect(buildConsentUrl(redirectUri, state));
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/google",
    maxAge: 600,
  });
  return response;
}
