"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { validatePasswordComplexity } from "@/lib/utils";

/** Cabeçalho da área do cliente, com a logo da LP Memórias e o botão de sair. */
export function AccountShell({ name, children }: { name: string; children: ReactNode }) {
  const router = useRouter();
  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/lp-memorias/entrar");
  };
  return (
    <div className="tl-root">
      <header className="tl-account-head">
        <a href="/lp-memorias/conta">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-lp-memorias-navy.png" alt="LP Memórias" />
        </a>
        <div className="tl-account-user">
          <span>{name}</span>
          <button type="button" className="tl-btn" onClick={() => void signOut()}>Sair</button>
        </div>
      </header>
      {children}
    </div>
  );
}

export function ChangePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = validatePasswordComplexity(password);
    if (invalid) return setError(invalid);
    if (password !== confirm) return setError("As senhas não são iguais.");
    setSaving(true);
    setError("");
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) {
      setError("Não foi possível trocar a senha. Escolha uma senha diferente da provisória.");
      setSaving(false);
      return;
    }
    await fetch("/api/memorias/conta", { method: "POST" });
    router.refresh();
  };

  return (
    <main className="tl-auth tl-auth-inner">
      <form className="tl-auth-card" onSubmit={(e) => void submit(e)}>
        <h1 className="tl-serif">Crie sua senha</h1>
        <p className="tl-hint">Para sua segurança, troque a senha provisória antes do primeiro acesso.</p>
        <label className="tl-field">
          <span>Nova senha</span>
          <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <p className="tl-hint">Use pelo menos 8 caracteres, com letra, número e símbolo.</p>
        <label className="tl-field">
          <span>Repita a nova senha</span>
          <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error && <p className="tl-error tl-auth-error" role="alert">{error}</p>}
        <button type="submit" className="tl-btn tl-btn-primary tl-btn-wide tl-auth-submit" disabled={saving}>
          {saving ? "Salvando…" : "Salvar senha"}
        </button>
      </form>
    </main>
  );
}
