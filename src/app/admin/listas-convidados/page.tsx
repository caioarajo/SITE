"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { GuestListRow, EventRow } from "@/lib/types";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";

interface FormState {
  id?: string;
  name: string;
  description: string;
  eventIds: string[];
}

const emptyForm: FormState = { name: "", description: "", eventIds: [] };

function ListasConvidadosPageContent() {
  const [items, setItems] = useState<GuestListRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [guestCounts, setGuestCounts] = useState<Record<string, number>>({});
  const [linkCounts, setLinkCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  async function load() {
    setLoading(true);
    const [listsRes, eventsRes, guestsRes, linksRes] = await Promise.all([
      supabase.from("guest_lists").select("*").order("name", { ascending: true }),
      supabase.from("events").select("*").order("title", { ascending: true }),
      supabase.from("guests").select("guest_list_id"),
      supabase.from("event_guest_lists").select("guest_list_id"),
    ]);
    setItems((listsRes.data as GuestListRow[]) ?? []);
    setEvents((eventsRes.data as EventRow[]) ?? []);

    const gCounts: Record<string, number> = {};
    (guestsRes.data ?? []).forEach((g: { guest_list_id: string }) => {
      gCounts[g.guest_list_id] = (gCounts[g.guest_list_id] ?? 0) + 1;
    });
    setGuestCounts(gCounts);

    const lCounts: Record<string, number> = {};
    (linksRes.data ?? []).forEach((l: { guest_list_id: string }) => {
      lCounts[l.guest_list_id] = (lCounts[l.guest_list_id] ?? 0) + 1;
    });
    setLinkCounts(lCounts);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openForm(item?: GuestListRow) {
    if (!item) {
      setForm(emptyForm);
      return;
    }
    const { data } = await supabase.from("event_guest_lists").select("event_id").eq("guest_list_id", item.id);
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      eventIds: (data ?? []).map((r) => r.event_id as string),
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
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Lista removida.");
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Listas de Convidados</h1>
          <p>Crie listas e reaproveite a mesma lista em um ou mais eventos</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => openForm()}>
          + Nova lista
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Convidados</th>
                <th>Eventos vinculados</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03, ease: [0.16, 0.84, 0.36, 1] }}
                >
                  <td style={{ whiteSpace: "nowrap" }}>{item.name}</td>
                  <td style={{ maxWidth: 300 }}>{item.description || "—"}</td>
                  <td>
                    <Link href={`/admin/convidados?lista=${item.id}`} className="admin-btn admin-btn-line admin-btn-sm">
                      {guestCounts[item.id] ?? 0} convidados
                    </Link>
                  </td>
                  <td>{linkCounts[item.id] ?? 0}</td>
                  <td className="row-actions">
                    <button className="admin-btn admin-btn-line admin-btn-sm" onClick={() => openForm(item)}>
                      Editar
                    </button>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => remove(item.id)}>
                      Apagar
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && <div className="empty-state">Nenhuma lista cadastrada.</div>}
        </div>
      </div>

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
      <ListasConvidadosPageContent />
    </ToastProvider>
  );
}
