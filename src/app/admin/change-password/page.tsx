"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validatePasswordComplexity } from "@/lib/utils";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const complexityError = validatePasswordComplexity(password);
    if (complexityError) {
      setError(complexityError);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Não foi possível trocar a senha. Tente novamente.");
      setLoading(false);
      return;
    }

    await fetch("/api/admin/me/complete-password-change", { method: "POST" });

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/logo-icon-navy.png" alt="LP" className="logo" />
        <h1>Troca de senha obrigatória</h1>
        <p className="sub">Defina uma nova senha para continuar acessando o painel</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label" htmlFor="password">
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              className="field-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="confirm-password">
              Confirme a nova senha
            </label>
            <input
              id="confirm-password"
              type="password"
              className="field-input"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <p className="inquiry-note">Mínimo de 8 caracteres, com letras, números e símbolos.</p>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
          {error && <div className="login-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
