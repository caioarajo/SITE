"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, Field } from "./ui";

export default function PasswordGate({ slug, names }: { slug: string; names: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/casar/public/${slug}`, "POST", { action: "unlock", password });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className="lc-root lc-gate">
      <form className="lc-auth" onSubmit={(e) => void submit(e)}>
        <h1>{names}</h1>
        <p>Este site é protegido. Digite a senha que os noivos enviaram para você.</p>
        <Field label="Senha do site" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="lc-error" role="alert">{error}</p>}
        <button className="lc-btn lc-btn-wide" disabled={busy}>{busy ? "Abrindo…" : "Entrar no site"}</button>
      </form>
    </main>
  );
}
