import { NextResponse, type NextRequest } from "next/server";
import { changePassword, confirmEmail, currentUser, requestPasswordReset, setNewPassword, signIn, signOut, signUp } from "@/lib/casar/auth";
import { siteByOwner } from "@/lib/casar/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    email?: string;
    password?: string;
    current?: string;
    token?: string;
    tokenHash?: string;
    terms?: boolean;
    marketing?: boolean;
  };

  if (body.action === "logout") {
    await signOut();
    return NextResponse.json({ ok: true });
  }

  if (body.action === "confirm") {
    const result = await confirmEmail(String(body.tokenHash ?? ""));
    return result.error ? NextResponse.json({ error: result.error }, { status: 400 }) : NextResponse.json({ ok: true });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (body.action === "forgot") {
    if (!validEmail) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    return NextResponse.json({ ok: true, ...(await requestPasswordReset(email, request.nextUrl.origin)) });
  }

  if (!validEmail && body.action !== "reset" && body.action !== "change") return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });

  if (body.action === "reset" || body.action === "change") {
    let done;
    if (body.action === "reset") {
      done = await setNewPassword(password, body.token, body.tokenHash);
    } else {
      const user = await currentUser();
      if (!user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
      done = await changePassword(user.email, String(body.current ?? ""), password);
    }
    return done.error ? NextResponse.json({ error: done.error }, { status: 400 }) : NextResponse.json({ ok: true });
  }

  if (body.action === "signup" && !body.terms) {
    return NextResponse.json({ error: "Para criar a conta, é preciso aceitar os termos de uso." }, { status: 400 });
  }

  const result = body.action === "signup" ? await signUp(email, password, request.nextUrl.origin, Boolean(body.marketing)) : await signIn(email, password);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  if (result.needsConfirmation) return NextResponse.json({ needsConfirmation: true });
  return NextResponse.json({ ok: true });
}

/** Tela de entrada: decide se quem já está logado vai para o painel ou para o assistente. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null, hasSite: false });
  return NextResponse.json({ user, hasSite: Boolean(await siteByOwner(user.id)) });
}
