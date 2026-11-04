"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api, Field, Logo } from "./ui";

type Session = { user: unknown; hasSite: boolean };
type Mode = "login" | "signup" | "forgot";

const TITLES: Record<Mode, string> = {
  signup: "Vamos criar o site de vocês",
  login: "Que bom ter vocês de volta",
  forgot: "Redefinir a senha",
};

export default function AuthForm({ initialMode }: { initialMode: "login" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");

  const goToApp = async () => {
    const { hasSite } = await api<Session>("/api/casar/auth", "GET");
    router.replace(hasSite ? "/lp-casar/painel" : "/lp-casar/criar");
  };

  useEffect(() => {
    void api<Session>("/api/casar/auth", "GET").then(({ user, hasSite }) => {
      if (user) router.replace(hasSite ? "/lp-casar/painel" : "/lp-casar/criar");
    });
  }, [router]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setSent(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "forgot") {
        const result = await api<{ devLink?: string }>("/api/casar/auth", "POST", { action: "forgot", email });
        setDevLink(result.devLink ?? "");
        setSent(true);
        return;
      }
      const result = await api<{ needsConfirmation?: boolean }>("/api/casar/auth", "POST", { action: mode, email, password, terms, marketing });
      if (result.needsConfirmation) {
        setConfirmEmail(true);
      } else {
        await goToApp();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="lc-root lc-split">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="lc-split-art"><img src="/images/casar/art-4.jpg" alt="" /></div>
      <div className="lc-split-body">
        <Logo />
        {confirmEmail ? (
          <div className="lc-step-box" role="status">
            <h1>Falta confirmar o e-mail</h1>
            {/* O Supabase não avisa quando o e-mail já tem conta, de propósito: a tela precisa valer para os dois casos. */}
            <p>Se <strong>{email}</strong> ainda não tiver cadastro, enviamos um link de confirmação. Confira também a caixa de spam.</p>
            <p>Se este e-mail já tiver conta, nenhuma mensagem é enviada: entre com a senha ou redefina.</p>
            <button type="button" className="lc-btn" onClick={() => { setConfirmEmail(false); switchMode("login"); }}>Ir para entrar</button>
            <button type="button" className="lc-text-btn" onClick={() => { setConfirmEmail(false); switchMode("forgot"); }}>Esqueci minha senha</button>
          </div>
        ) : (
          <form className="lc-auth" onSubmit={(e) => void submit(e)}>
            <h1>{TITLES[mode]}</h1>
            {sent ? (
              <div role="status">
                <p>Se este e-mail tiver cadastro, enviamos um link para criar uma nova senha. Confira também a caixa de spam.</p>
                {devLink && <p className="lc-muted">Modo local, sem envio de e-mail: <a className="lc-inline-link" href={devLink}>abrir o link</a></p>}
              </div>
            ) : (
              <>
                <Field label="E-mail" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {mode !== "forgot" && (
                  <Field
                    label="Senha"
                    type="password"
                    required
                    minLength={8}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    hint={mode === "signup" ? "Pelo menos 8 caracteres." : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
                {mode === "signup" && (
                  <>
                    <label className="lc-check">
                      <input type="checkbox" required checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                      <span>Li e concordo com os <a className="lc-inline-link" href="/lp-casar/termos" target="_blank" rel="noopener noreferrer">termos de uso e a política de privacidade</a>.</span>
                    </label>
                    <label className="lc-check">
                      <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                      <span>Quero receber novidades e promoções por e-mail (opcional).</span>
                    </label>
                  </>
                )}
                {error && <p className="lc-error" role="alert">{error}</p>}
                <button className="lc-btn lc-btn-wide" disabled={busy}>
                  {busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : mode === "login" ? "Entrar" : "Enviar link"}
                </button>
              </>
            )}
            {mode === "login" && <button type="button" className="lc-text-btn" onClick={() => switchMode("forgot")}>Esqueci minha senha</button>}
            {mode === "forgot" && <button type="button" className="lc-text-btn" onClick={() => switchMode("login")}>Voltar para entrar</button>}
            {mode !== "forgot" && (
              <button type="button" className="lc-text-btn" onClick={() => switchMode(mode === "signup" ? "login" : "signup")}>
                {mode === "signup" ? "Já tem conta? Entrar" : "Ainda não tem site? Criar conta"}
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
