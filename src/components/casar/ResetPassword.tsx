"use client";

import { useState, type FormEvent } from "react";
import { api, Field, Logo } from "./ui";

export default function ResetPassword({ token, expired }: { token?: string; expired: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(expired ? "Este link expirou ou já foi usado. Peça um novo na tela de entrada." : "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/casar/auth", "POST", { action: "reset", password, token });
      window.location.href = "/lp-casar/entrar";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

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
