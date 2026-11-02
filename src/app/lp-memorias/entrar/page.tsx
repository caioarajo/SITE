"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import "../memorias-app.css";

const destination = (kind: string | null) => (kind === "staff" ? "/admin/memorias" : "/lp-memorias/conta");

async function accountKind() {
  const res = await fetch("/api/memorias/conta", { cache: "no-store" });
  return ((await res.json()) as { kind: string | null }).kind;
}

/** Entrada única da LP Memórias: atende quem contratou o serviço e a equipe do site. */
export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Entrar | LP Memórias";
    void accountKind().then((kind) => {
      if (kind) router.replace(destination(kind));
    });
  }, [router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError("E-mail ou senha incorretos, ou acesso desativado.");
      setLoading(false);
      return;
    }
    const kind = await accountKind();
    if (!kind) {
      await supabase.auth.signOut();
      setError("Esta conta não tem acesso à LP Memórias.");
      setLoading(false);
      return;
    }
    router.replace(destination(kind));
  };

  return (
    <main className="tl-root tl-auth">
      <form className="tl-auth-card" onSubmit={(e) => void submit(e)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="tl-auth-logo" src="/logo-lp-memorias-navy.png" alt="LP Memórias" />
        <label className="tl-field">
          <span>E-mail</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="tl-field">
          <span>Senha</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="tl-error tl-auth-error" role="alert">{error}</p>}
        <button type="submit" className="tl-btn tl-btn-primary tl-btn-wide tl-auth-submit" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
        <a className="tl-back tl-auth-back" href="/lp-memorias">← Voltar para a LP Memórias</a>
      </form>
    </main>
  );
}
