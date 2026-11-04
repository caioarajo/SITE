"use client";

import { useState, type FormEvent } from "react";
import { formatDate } from "@/lib/casar/types";
import { api, Logo } from "./ui";

type Result = { slug: string; names: string; date: string; city: string };

export default function FindWedding() {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 3 && !date) {
      setError("Digite ao menos 3 letras de um nome ou escolha a data.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { results: found } = await api<{ results: Result[] }>(`/api/casar/search?q=${encodeURIComponent(query)}&date=${date}`, "GET");
      setResults(found);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="lc-root lc-find">
      <Logo />
      <h1>Encontre um casamento</h1>
      <p>Procure pelo nome de um dos noivos, pela data do casamento ou pelos dois.</p>
      <form className="lc-find-form" role="search" onSubmit={(e) => void search(e)}>
        <input aria-label="Nome de um dos noivos" placeholder="Nome de um dos noivos" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input aria-label="Data do casamento (opcional)" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="lc-btn" disabled={busy}>{busy ? "Buscando…" : "Buscar"}</button>
      </form>
      {error && <p className="lc-error" role="alert">{error}</p>}
      {results && (
        results.length ? (
          <ul className="lc-find-list">
            {results.map((result) => (
              <li key={result.slug}>
                <a href={`/lp-casar/${result.slug}`}>
                  <strong>{result.names}</strong>
                  <span>{[formatDate(result.date), result.city].filter(Boolean).join(" · ")}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="lc-empty" role="status">Nenhum casamento encontrado. Confira os dados ou peça o link aos noivos.</p>
        )
      )}
    </main>
  );
}
