"use client";

import { useState } from "react";
import { api, Logo } from "./ui";

/** O link do e-mail só abre esta página; quem confirma é o clique no botão (ver setNewPassword). */
export default function ConfirmEmail({ tokenHash }: { tokenHash?: string }) {
  const [error, setError] = useState(tokenHash ? "" : "Este link está incompleto. Tente entrar com seu e-mail e senha.");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await api("/api/casar/auth", "POST", { action: "confirm", tokenHash });
      window.location.href = "/lp-casar/entrar";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className="lc-root lc-gate">
      <div className="lc-auth lc-auth-note">
        <Logo />
        <h1>Falta só um clique</h1>
        {error ? (
          <>
            <p className="lc-error" role="alert">{error}</p>
            <a className="lc-btn lc-btn-wide" href="/lp-casar/entrar">Ir para entrar</a>
          </>
        ) : (
          <>
            <p>Confirme seu e-mail para começar a criar o site de vocês.</p>
            <button type="button" className="lc-btn lc-btn-wide" disabled={busy} onClick={() => void confirm()}>{busy ? "Confirmando…" : "Confirmar e-mail"}</button>
          </>
        )}
      </div>
    </main>
  );
}
