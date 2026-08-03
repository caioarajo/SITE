"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { GuestListRow, EventRow, RsvpStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { EVENT_TYPE_LABELS } from "@/lib/eventLabels";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";

interface FormState {
  id?: string;
  name: string;
  description: string;
  eventIds: string[];
}

const emptyForm: FormState = { name: "", description: "", eventIds: [] };

interface ListStats {
  total: number;
  confirmado: number;
  pendente: number;
  recusado: number;
  companions: number;
}

const emptyStats: ListStats = { total: 0, confirmado: 0, pendente: 0, recusado: 0, companions: 0 };

function addStats(a: ListStats, b: ListStats): ListStats {
  return {
    total: a.total + b.total,
    confirmado: a.confirmado + b.confirmado,
    pendente: a.pendente + b.pendente,
    recusado: a.recusado + b.recusado,
    companions: a.companions + b.companions,
  };
}

function ListasConvidadosPageContent() {
  const searchParams = useSearchParams();
  const highlightEventId = searchParams.get("evento");
  const [lists, setLists] = useState<GuestListRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [statsByList, setStatsByList] = useState<Record<string, ListStats>>({});
  const [eventIdsByList, setEventIdsByList] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  async function load() {
    setLoading(true);
    const [listsRes, eventsRes, guestsRes, linksRes] = await Promise.all([
      supabase.from("guest_lists").select("*").order("name", { ascending: true }),
      supabase.from("events").select("*").order("event_date", { ascending: true }),
      supabase.from("guests").select("guest_list_id, rsvp_status, companions"),
      supabase.from("event_guest_lists").select("event_id, guest_list_id"),
    ]);
    setLists((listsRes.data as GuestListRow[]) ?? []);
    setEvents((eventsRes.data as EventRow[]) ?? []);

    const stats: Record<string, ListStats> = {};
    ((guestsRes.data ?? []) as { guest_list_id: string; rsvp_status: RsvpStatus; companions: number }[]).forEach(
      (g) => {
        const s = (stats[g.guest_list_id] ??= { ...emptyStats });
        s.total += 1;
        s[g.rsvp_status] += 1;
        s.companions += g.companions;
      },
    );
    setStatsByList(stats);

    const evIdsByList: Record<string, string[]> = {};
    ((linksRes.data ?? []) as { event_id: string; guest_list_id: string }[]).forEach((l) => {
      (evIdsByList[l.guest_list_id] ??= []).push(l.event_id);
    });
    setEventIdsByList(evIdsByList);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!highlightEventId || loading) return;
    const el = document.getElementById(`event-guest-${highlightEventId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightEventId, loading]);

  async function openForm(item?: GuestListRow) {
    if (!item) {
      setForm(emptyForm);
      return;
    }
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      eventIds: eventIdsByList[item.id] ?? [],
    });
  }

  function toggleEvent(eventId: string) {
    if (!form) return;
    const has = form.eventIds.includes(eventId);
    setForm({
      ...form,
      eventIds: has ? form.eventIds.filter((id) => id !== eventId) : [...form.eventIds, eventId],
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);

    let listId = form.id;
    if (listId) {
      const { error } = await supabase
        .from("guest_lists")
        .update({ name: form.name, description: form.description || null })
        .eq("id", listId);
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("guest_lists")
        .insert({ name: form.name, description: form.description || null })
        .select("id")
        .single();
      if (error || !data) {
        setSaving(false);
        toast.error(error?.message ?? "Não foi possível criar a lista.");
        return;
      }
      listId = data.id;
    }

    // Sincroniza os vínculos com eventos: apaga todos e recria com a
    // seleção atual — simples e correto para o tamanho desses conjuntos.
    await supabase.from("event_guest_lists").delete().eq("guest_list_id", listId);
    if (form.eventIds.length > 0) {
      const { error: linkError } = await supabase
        .from("event_guest_lists")
        .insert(form.eventIds.map((eventId) => ({ event_id: eventId, guest_list_id: listId! })));
      if (linkError) {
        setSaving(false);
        toast.error(linkError.message);
        return;
      }
    }

    setSaving(false);
    toast.success(form.id ? "Lista atualizada." : "Lista criada.");
    setForm(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar esta lista de convidados? Os convidados dela também serão apagados.")) return;
    const { error } = await supabase.from("guest_lists").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Lista removida.");
    load();
  }

  function csvEscape(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }

  async function exportConfirmed(ev: EventRow, listIds: string[], format: "csv" | "pdf") {
    const { data, error } = await supabase
      .from("guests")
      .select("name, category, companions, guest_list_id")
      .in("guest_list_id", listIds)
      .eq("rsvp_status", "confirmado")
      .order("name", { ascending: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    const rows = (data ?? []) as { name: string; category: string | null; companions: number; guest_list_id: string }[];
    if (rows.length === 0) {
      toast.error("Nenhum convidado confirmado para exportar.");
      return;
    }
    const listNameOf = (id: string) => lists.find((l) => l.id === id)?.name ?? "—";
    const safeTitle = ev.title.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase();

    if (format === "csv") {
      const header = ["Nome", "Lista", "Categoria", "Acompanhantes"];
      const lines = [header, ...rows.map((r) => [r.name, listNameOf(r.guest_list_id), r.category ?? "", String(r.companions)])];
      const csv = "﻿" + lines.map((line) => line.map((v) => csvEscape(v)).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `confirmados-${safeTitle}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`Confirmados — ${ev.title}`, 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(ev.event_date ? formatDate(ev.event_date) : "Sem data definida", 14, 24);
      const totalCompanions = rows.reduce((s, r) => s + r.companions, 0);
      autoTable(doc, {
        startY: 30,
        head: [["Nome", "Lista", "Categoria", "Acompanhantes"]],
        body: rows.map((r) => [r.name, listNameOf(r.guest_list_id), r.category ?? "—", String(r.companions)]),
        foot: [["Total", "", `${rows.length} confirmados`, `${totalCompanions} acompanhantes`]],
        headStyles: { fillColor: [24, 44, 82] },
        footStyles: { fillColor: [241, 233, 220], textColor: [53, 43, 34] },
        styles: { fontSize: 10 },
      });
      doc.save(`confirmados-${safeTitle}.pdf`);
    }
  }

  const listIdsByEvent: Record<string, string[]> = {};
  for (const list of lists) {
    for (const eventId of eventIdsByList[list.id] ?? []) {
      (listIdsByEvent[eventId] ??= []).push(list.id);
    }
  }
  const unlinkedLists = lists.filter((l) => (eventIdsByList[l.id] ?? []).length === 0);

  function ListsTable({ listIds, currentEventId }: { listIds: string[]; currentEventId?: string }) {
    const rows = lists.filter((l) => listIds.includes(l.id));
    return (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Convidados</th>
              <th>Acompanhantes</th>
              <th>Também usada em</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, i) => {
              const s = statsByList[item.id] ?? emptyStats;
              const otherEvents = (eventIdsByList[item.id] ?? [])
                .filter((id) => id !== currentEventId)
                .map((id) => events.find((e) => e.id === id))
                .filter((e): e is EventRow => !!e);
              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03, ease: [0.16, 0.84, 0.36, 1] }}
                >
                  <td style={{ whiteSpace: "nowrap" }}>{item.name}</td>
                  <td style={{ maxWidth: 260 }}>{item.description || "—"}</td>
                  <td>
                    <Link
                      href={`/admin/convidados?lista=${item.id}`}
                      className="admin-btn admin-btn-line admin-btn-sm"
                      style={{ marginRight: 8 }}
                    >
                      {s.total} convidados
                    </Link>
                    {s.total > 0 && (
                      <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        <span className="status-badge status-confirmado">{s.confirmado} conf.</span>
                        <span className="status-badge status-pendente">{s.pendente} pend.</span>
                        {s.recusado > 0 && <span className="status-badge status-recusado">{s.recusado} rec.</span>}
                      </span>
                    )}
                  </td>
                  <td>{s.companions}</td>
                  <td style={{ fontSize: 12.5, color: "var(--taupe-deep)" }}>
                    {otherEvents.length > 0 ? otherEvents.map((e) => e.title).join(", ") : "—"}
                  </td>
                  <td className="row-actions">
                    <button className="admin-btn admin-btn-line admin-btn-sm" onClick={() => openForm(item)}>
                      Editar
                    </button>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => remove(item.id)}>
                      Apagar
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Listas de Convidados</h1>
          <p>Organizadas por evento — crie uma lista e reaproveite-a em um ou mais eventos</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => openForm()}>
          + Nova lista
        </button>
      </div>

      {!loading && lists.length === 0 && (
        <div className="admin-card">
          <div className="empty-state">Nenhuma lista cadastrada ainda.</div>
        </div>
      )}

      {events.map((ev) => {
        const listIds = listIdsByEvent[ev.id] ?? [];
        const totals = listIds
          .map((id) => statsByList[id] ?? emptyStats)
          .reduce((acc, s) => addStats(acc, s), { ...emptyStats });

        return (
          <div
            className={`admin-card event-guest-group${ev.id === highlightEventId ? " event-guest-group-highlight" : ""}`}
            id={`event-guest-${ev.id}`}
            key={ev.id}
          >
            <div className="event-guest-group-head">
              <div>
                <b>{ev.title}</b>
                <span>
                  {ev.event_date ? formatDate(ev.event_date) : "Sem data definida"} · {EVENT_TYPE_LABELS[ev.event_type]}
                  {ev.guest_count ? ` · previsão de ${ev.guest_count} convidados` : ""}
                </span>
              </div>
              {listIds.length > 0 && (
                <div className="event-guest-group-totals">
                  <span className="status-badge status-confirmado">{totals.confirmado} confirmados</span>
                  <span className="status-badge status-pendente">{totals.pendente} pendentes</span>
                  {totals.recusado > 0 && <span className="status-badge status-recusado">{totals.recusado} recusados</span>}
                  <span style={{ fontSize: 12.5, color: "var(--taupe-deep)" }}>
                    {totals.total + totals.companions} pessoas no total (com acompanhantes)
                  </span>
                  {totals.confirmado > 0 && (
                    <span style={{ display: "inline-flex", gap: 8 }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-line admin-btn-sm"
                        onClick={() => exportConfirmed(ev, listIds, "csv")}
                      >
                        Exportar CSV
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-line admin-btn-sm"
                        onClick={() => exportConfirmed(ev, listIds, "pdf")}
                      >
                        Exportar PDF
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {listIds.length === 0 ? (
              <div className="empty-state">Nenhuma lista vinculada a este evento ainda.</div>
            ) : (
              <ListsTable listIds={listIds} currentEventId={ev.id} />
            )}
          </div>
        );
      })}

      {unlinkedLists.length > 0 && (
        <div className="admin-card event-guest-group">
          <div className="event-guest-group-head">
            <div>
              <b>Sem evento vinculado</b>
              <span>Listas criadas mas ainda não associadas a nenhum evento</span>
            </div>
          </div>
          <ListsTable listIds={unlinkedLists.map((l) => l.id)} />
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar lista" : "Nova lista"}>
        {form && (
          <form onSubmit={save}>
            <div className="field-group">
              <label className="field-label">Nome da lista</label>
              <input
                className="field-input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Descrição</label>
              <textarea
                className="field-textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Eventos que usam esta lista</label>
              <div className="checklist-editor">
                {events.map((ev) => (
                  <label className="toggle-row" key={ev.id}>
                    <input
                      type="checkbox"
                      checked={form.eventIds.includes(ev.id)}
                      onChange={() => toggleEvent(ev.id)}
                    />
                    {ev.title}
                  </label>
                ))}
                {events.length === 0 && (
                  <p style={{ fontSize: 12.5, color: "var(--taupe-deep)" }}>Nenhum evento cadastrado ainda.</p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="admin-btn admin-btn-line" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="admin-btn admin-btn-gold" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

export default function ListasConvidadosPage() {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <ListasConvidadosPageContent />
      </Suspense>
    </ToastProvider>
  );
}
