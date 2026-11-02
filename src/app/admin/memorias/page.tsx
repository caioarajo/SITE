"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { EventSummary } from "@/lib/memorias/types";
import "@/app/lp-memorias/memorias-app.css";

const inAYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};
const formatDate = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "Sem data");

export default function MemoriasEventosPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [retentionUntil, setRetentionUntil] = useState(inAYear);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/memorias")
      .then(async (res) => {
        const data = (await res.json()) as { events?: EventSummary[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Não foi possível carregar os eventos.");
        setEvents(data.events ?? []);
      })
      .catch((err: Error) => {
        setEvents([]);
        setError(err.message);
      });
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/memorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, eventDate, retentionUntil }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) {
      setError(data.error ?? "Não foi possível criar o evento.");
      setSaving(false);
      return;
    }
    router.push(`/admin/memorias/${data.id}`);
  };

  return (
    <div className="tl-root tl-panel">
      <p className="tl-eyebrow">LP Memórias</p>
      <h1 className="tl-serif tl-list-title">Eventos</h1>
      {error && <p className="tl-error tl-panel-error" role="alert">{error}</p>}

      <div className="tl-panel-grid">
        <div className="tl-card">
          {events === null ? (
            <p className="tl-empty">Carregando…</p>
          ) : events.length === 0 ? (
            <p className="tl-empty">Nenhum evento ainda. Crie o primeiro ao lado.</p>
          ) : (
            <ul className="tl-event-list">
              {events.map((event) => (
                <li key={event.id}>
                  <Link href={`/admin/memorias/${event.id}`}>
                    <strong>{event.title}</strong>
                    <span>
                      {formatDate(event.eventDate)} · {event.total} publicações
                      {event.pending > 0 && ` · ${event.pending} pendentes`}
                      {!event.uploadsOpen && " · envios encerrados"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="tl-card" onSubmit={(e) => void create(e)}>
          <h2 className="tl-serif">Novo evento</h2>
          <label className="tl-field">
            <span>Nome no telão</span>
            <input required maxLength={80} value={title} placeholder="Ana & Pedro" onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="tl-field">
            <span>Data do evento</span>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </label>
          <label className="tl-field">
            <span>Guardar as fotos até</span>
            <input type="date" value={retentionUntil} onChange={(e) => setRetentionUntil(e.target.value)} />
          </label>
          <div className="tl-row-wrap">
            <button type="submit" className="tl-btn tl-btn-primary" disabled={saving}>{saving ? "Criando…" : "Criar evento"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
