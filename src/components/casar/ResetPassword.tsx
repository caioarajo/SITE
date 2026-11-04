"use client";

import { useState, type FormEvent } from "react";
import { api, Field, Logo } from "./ui";

type Props = { token?: string; tokenHash?: string; expired: boolean };

export default function ResetPassword({ token, tokenHash, expired }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkDead, setLinkDead] = useState(expired);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/casar/auth", "POST", { action: "reset", password, token, tokenHash });
      window.location.href = "/lp-casar/entrar";
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      if (/expirou|já foi usado/i.test(message)) setLinkDead(true);
      setBusy(false);
    }
  };

  if (linkDead) {
    return (
      <main className="lc-root lc-gate">
        <div className="lc-auth lc-auth-note">
          <Logo />
          <h1>Este link não vale mais</h1>
          <p>Cada link de redefinição funciona uma vez e por tempo limitado. Peça um novo para criar sua senha.</p>
          <a className="lc-btn lc-btn-wide" href="/lp-casar/entrar">Pedir um novo link</a>
        </div>
      </main>
    );
  }

  return (
    <main className="lc-root lc-gate">
      <form className="lc-auth" onSubmit={(e) => void submit(e)}>
        <Logo />
        <h1>Criem uma nova senha</h1>
        <Field label="Nova senha" hint="Pelo menos 8 caracteres." type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="lc-error" role="alert">{error}</p>}
        <button className="lc-btn lc-btn-wide" disabled={busy}>{busy ? "Salvando…" : "Salvar nova senha"}</button>
      </form>
    </main>
  );
}
