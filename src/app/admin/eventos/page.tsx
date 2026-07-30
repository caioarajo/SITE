"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { EventRow, EventCategory, EventRecordStatus, ClientRow } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";

const emptyForm: Partial<EventRow> = {
  client_id: "",
  title: "",
  event_type: "casamento",
  event_date: null,
  location: "",
  guest_count: null,
  budget_total: null,
  status: "planejamento",
  notes: "",
};

const STATUS_LABELS: Record<EventRecordStatus, string> = {
  planejamento: "Planejamento",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const TYPE_LABELS: Record<EventCategory, string> = {
  casamento: "Casamento",
  debutante: "15 anos",
  corporativo: "Corporativo",
  aniversario: "Aniversário",
  outro: "Outro",
};

function EventosPageContent() {
  const [items, setItems] = useState<EventRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<EventRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  async function load() {
    setLoading(true);
    const [eventsRes, clientsRes] = await Promise.all([
      supabase.from("events").select("*").order("event_date", { ascending: true }),
      supabase.from("clients").select("*").order("name", { ascending: true }),
    ]);
    setItems((eventsRes.data as EventRow[]) ?? []);
    setClients((clientsRes.data as ClientRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clientName(id: string) {
    return clients.find((c) => c.id === id)?.name ?? "—";
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.client_id) {
      toast.error("Selecione um cliente.");
      return;
    }
    setSaving(true);
    const payload = { ...form };
    const { id, ...rest } = payload;

    const { error } = id
      ? await supabase.from("events").update(rest).eq("id", id)
      : await supabase.from("events").insert({ ...rest, client_id: rest.client_id!, title: rest.title! });

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(id ? "Evento atualizado." : "Evento criado.");
    setForm(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar este evento?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Evento removido.");
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Eventos</h1>
          <p>Eventos vinculados a um cliente</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => setForm(emptyForm)}>
          + Novo evento
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Data</th>
                <th>Status</th>
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
                  <td style={{ whiteSpace: "nowrap" }}>{item.title}</td>
                  <td>{clientName(item.client_id)}</td>
                  <td>{TYPE_LABELS[item.event_type]}</td>
                  <td>{item.event_date ? formatDate(item.event_date) : "—"}</td>
                  <td>
                    <span className={`status-badge status-${item.status}`}>{STATUS_LABELS[item.status]}</span>
                  </td>
                  <td className="row-actions">
                    <button className="admin-btn admin-btn-line admin-btn-sm" onClick={() => setForm(item)}>
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
          {!loading && items.length === 0 && <div className="empty-state">Nenhum evento cadastrado.</div>}
        </div>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar evento" : "Novo evento"}>
        {form && (
          <form onSubmit={save}>
            <div className="field-group">
              <label className="field-label">Cliente</label>
              <select
                className="field-select"
                required
                value={form.client_id ?? ""}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              >
                <option value="" disabled>
                  Selecione um cliente
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Título do evento</label>
              <input
                className="field-input"
                required
                value={form.title ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Tipo</label>
                <select
                  className="field-select"
                  value={form.event_type ?? "casamento"}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value as EventCategory })}
                >
                  {(Object.entries(TYPE_LABELS) as [EventCategory, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Data do evento</label>
                <input
                  className="field-input"
                  type="date"
                  value={form.event_date ?? ""}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value || null })}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Local</label>
                <input
                  className="field-input"
                  value={form.location ?? ""}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Nº de convidados</label>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  value={form.guest_count ?? ""}
                  onChange={(e) => setForm({ ...form, guest_count: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Orçamento total (R$)</label>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.budget_total ?? ""}
                  onChange={(e) => setForm({ ...form, budget_total: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Status</label>
                <select
                  className="field-select"
                  value={form.status ?? "planejamento"}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EventRecordStatus })}
                >
                  {(Object.entries(STATUS_LABELS) as [EventRecordStatus, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Notas</label>
              <textarea
                className="field-textarea"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
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

export default function EventosPage() {
  return (
    <ToastProvider>
      <EventosPageContent />
    </ToastProvider>
  );
}
