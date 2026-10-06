import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { exchangeCodeForTokens } from "@/lib/googleCalendar";

export const runtime = "nodejs";

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${title}</title>
<body style="font-family:system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 20px;color:#352b22">
<h1 style="font-family:Georgia,serif;font-style:italic">${title}</h1>${body}</body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/** Troca o código do Google pelo refresh token. O token aparece UMA vez nesta
 * tela para ser colado na Vercel como GOOGLE_REFRESH_TOKEN — não é gravado
 * no banco, porque a tabela de configurações é de leitura pública. */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get("google_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) {
    return page("Autorização inválida", "<p>Refaça o processo a partir do painel.</p>", 400);
  }

  try {
    const redirectUri = `${request.nextUrl.origin}/api/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.refresh_token) {
      return page(
        "Google não devolveu o refresh token",
        "<p>Revogue o acesso do app em myaccount.google.com/permissions e tente de novo.</p>",
        400,
      );
    }
    return page(
      "Google Agenda conectado",
      `<p>Copie o valor abaixo e cole na Vercel como <b>GOOGLE_REFRESH_TOKEN</b> (Settings → Environment Variables, Production). Depois faça um novo deploy.</p>
<pre style="background:#f1e9dc;padding:14px;border-radius:6px;word-break:break-all;user-select:all">${tokens.refresh_token}</pre>
<p style="font-size:13px;color:#8f7c66">Esta tela só mostra o token uma vez. Não compartilhe.</p>`,
    );
  } catch (err) {
    return page("Não foi possível conectar", `<p>${err instanceof Error ? err.message : "Erro desconhecido."}</p>`, 500);
  }
}
