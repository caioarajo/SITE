import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LOCAL_MODE, readLocal, siteByOwner, writeLocal, type Site } from "./store";

const LOCAL_COOKIE = "lp_casar_local";

export type CasarUser = { id: string; email: string };

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function currentUser(): Promise<CasarUser | null> {
  if (LOCAL_MODE) {
    const token = (await cookies()).get(LOCAL_COOKIE)?.value;
    const db = readLocal();
    const userId = token ? db.sessions[token] : undefined;
    const user = db.users.find((item) => item.id === userId);
    return user ? { id: user.id, email: user.email } : null;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? "" } : null;
}

async function startLocalSession(userId: string) {
  const db = readLocal();
  const token = randomUUID();
  db.sessions[token] = userId;
  writeLocal(db);
  (await cookies()).set(LOCAL_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
}

type AuthResult = { error?: string; needsConfirmation?: boolean };

/** `needsConfirmation`: conta criada, mas o projeto exige confirmar o e-mail antes de entrar. */
export async function signUp(email: string, password: string, origin: string, marketing: boolean): Promise<AuthResult> {
  const consent = { termsAt: new Date().toISOString(), marketing };
  if (LOCAL_MODE) {
    const db = readLocal();
    if (db.users.some((item) => item.email === email)) return { error: "Este e-mail já tem cadastro. Use Entrar." };
    const id = randomUUID();
    db.users.push({ id, email, passwordHash: hashPassword(password), consent });
    writeLocal(db);
    await startLocalSession(id);
    return {};
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/lp-casar/entrar`, data: { casar_consent: consent } } });
  if (error) return { error: "Não foi possível criar a conta. Confira o e-mail e use uma senha mais forte." };
  return { needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (LOCAL_MODE) {
    const user = readLocal().users.find((item) => item.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) return { error: "E-mail ou senha incorretos." };
    await startLocalSession(user.id);
    return {};
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { error: "E-mail ou senha incorretos, ou e-mail ainda não confirmado." } : {};
}

/** Nunca revela se o e-mail existe. No modo local não há envio: o link volta para a tela. */
export async function requestPasswordReset(email: string, origin: string): Promise<{ devLink?: string }> {
  if (LOCAL_MODE) {
    const db = readLocal();
    const user = db.users.find((item) => item.email === email);
    if (!user) return {};
    const token = randomUUID();
    db.resets = { ...db.resets, [token]: { userId: user.id, expires: Date.now() + 60 * 60 * 1000 } };
    writeLocal(db);
    return { devLink: `/lp-casar/redefinir?token=${token}` };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/api/casar/auth/callback` });
  if (error) console.error("[casar] redefinir senha:", error.message);
  return {};
}

/**
 * Quem chega aqui provou o acesso ao e-mail: pelo token local, pelo token do link ou pela sessão criada no callback.
 * O token do link só é gasto neste envio de formulário: o scanner do Outlook/Hotmail abre os links
 * antes de entregar a mensagem, e um link que consome o token ao abrir chega já vencido.
 */
export async function setNewPassword(password: string, token?: string, tokenHash?: string): Promise<AuthResult> {
  if (LOCAL_MODE) {
    const db = readLocal();
    const reset = token ? db.resets?.[token] : undefined;
    const user = db.users.find((item) => item.id === reset?.userId);
    if (!reset || !user || reset.expires < Date.now()) return { error: "Este link expirou. Peça um novo." };
    user.passwordHash = hashPassword(password);
    delete db.resets?.[token as string];
    writeLocal(db);
    await startLocalSession(user.id);
    return {};
  }
  const supabase = await createClient();
  if (tokenHash) {
    const verified = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (verified.error) return { error: "Este link expirou ou já foi usado. Peça um novo." };
  }
  const { error } = await supabase.auth.updateUser({ password });
  return error ? { error: "Não foi possível salvar. Use uma senha mais forte ou peça um novo link." } : {};
}

/** Confirma o cadastro só quando a pessoa clica no botão da página: ver a nota em setNewPassword. */
export async function confirmEmail(tokenHash: string): Promise<AuthResult> {
  if (LOCAL_MODE) return {};
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "signup" });
  return error ? { error: "Este link expirou ou já foi usado. Tente entrar com seu e-mail e senha." } : {};
}

export async function changePassword(email: string, current: string, next: string): Promise<AuthResult> {
  const check = await signIn(email, current);
  if (check.error) return { error: "A senha atual está incorreta." };
  if (LOCAL_MODE) {
    const db = readLocal();
    const user = db.users.find((item) => item.email === email);
    if (user) user.passwordHash = hashPassword(next);
    writeLocal(db);
    return {};
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: next });
  return error ? { error: "Não foi possível trocar a senha. Use uma senha mais forte." } : {};
}

export async function signOut() {
  if (LOCAL_MODE) {
    const store = await cookies();
    const token = store.get(LOCAL_COOKIE)?.value;
    const db = readLocal();
    if (token) delete db.sessions[token];
    writeLocal(db);
    store.delete(LOCAL_COOKIE);
    return;
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/** Para as rotas dos noivos: só libera quem é dono de um site. */
export async function requireOwnSite(): Promise<{ user: CasarUser; site: Site } | { error: NextResponse }> {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "Faça login para continuar." }, { status: 401 }) };
  const site = await siteByOwner(user.id);
  if (!site) return { error: NextResponse.json({ error: "Crie seu site primeiro." }, { status: 404 }) };
  return { user, site };
}

// Site com senha: o cookie guarda uma derivação da senha, então trocar a senha derruba quem já tinha entrado.
const unlockCookie = (site: Site) => `lp_casar_${site.id.replace(/-/g, "").slice(0, 16)}`;
const unlockValue = (site: Site) =>
  createHash("sha256").update(`${site.id}:${site.data.secret?.passwordHash ?? ""}`).digest("hex");

export async function isUnlocked(site: Site) {
  if (!site.data.secret?.passwordHash) return true;
  return (await cookies()).get(unlockCookie(site))?.value === unlockValue(site);
}

export async function unlock(site: Site, password: string) {
  const stored = site.data.secret?.passwordHash;
  if (!stored || !verifyPassword(password, stored)) return false;
  (await cookies()).set(unlockCookie(site), unlockValue(site), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
  return true;
}
