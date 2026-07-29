"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const URL_ERROR_MESSAGES: Record<string, string> = {
  conta_desativada: "Sua conta foi desativada. Fale com um administrador.",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    URL_ERROR_MESSAGES[searchParams.get("error") ?? ""] ?? null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha inválidos. Confira e tente novamente.");
      setLoading(false);
      return;
    }

    const redirectTo = searchParams.get("redirectTo") || "/admin";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/logo-icon-navy.png" alt="LP" className="logo" />
        <h1>Área administrativa</h1>
        <p className="sub">Entre com sua conta para gerenciar o site</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="field-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="field-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {error && <div className="login-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
