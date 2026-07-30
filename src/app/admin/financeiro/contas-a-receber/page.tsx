"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { ReceivableRow, ReceivableStatus, ClientRow, EventRow } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";

const emptyForm: Partial<ReceivableRow> = {
  description: "",
  client_id: null,
  event_id: null,
  amount: 0,
  due_date: new Date().toISOString().slice(0, 10),
  received_date: null,
  status: "pendente",
  payment_method: "",
  notes: "",
};

function isOverdue(item: ReceivableRow) {
  return item.status === "pendente" && item.due_date < new Date().toISOString().slice(0, 10);
}

function displayStatus(item: ReceivableRow): { key: string; label: string } {
  if (isOverdue(item)) return { key: "atrasado", label: "Atrasado" };
  if (item.status === "recebido") return { key: "recebido", label: "Recebido" };
  if (item.status === "cancelado") return { key: "cancelado", label: "Cancelado" };
  return { key: "pendente", label: "Pendente" };
}

function ContasAReceberPageContent() {
  const [items, setItems] = useState<ReceivableRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [form, setForm] = useState<Partial<ReceivableRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  async function load() {
    setLoading(true);
    const [receivableRes, clientsRes, eventsRes] = await Promise.all([
      supabase.from("accounts_receivable").select("*").order("due_date", { ascending: true }),
      supabase.from("clients").select("*").order("name", { ascending: true }),
      supabase.from("events").select("*").order("title", { ascending: true }),
    ]);
    setItems((receivableRes.data as ReceivableRow[]) ?? []);
    setClients((clientsRes.data as ClientRow[]) ?? []);
    setEvents((eventsRes.data as EventRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (filter === "todos") return items;
    return items.filter((item) => displayStatus(item).key === filter);
  }, [items, filter]);

  function clientName(id: string | null) {
    return clients.find((c) => c.id === id)?.name ?? "—";
  }
  function eventTitle(id: string | null) {
    return events.find((e) => e.id === id)?.title ?? "—";
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const payload = { ...form };
    const { id, ...rest } = payload;

    const { error } = id
      ? await supabase.from("accounts_receivable").update(rest).eq("id", id)
      : await supabase
          .from("accounts_receivable")
          .insert({ ...rest, description: rest.description!, amount: rest.amount!, due_date: rest.due_date! });

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(id ? "Conta atualizada." : "Conta criada.");
    setForm(null);
    load();
  }

  async function markReceived(item: ReceivableRow) {
    const { error } = await supabase
      .from("accounts_receivable")
      .update({ status: "recebido", received_date: new Date().toISOString().slice(0, 10) })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta marcada como recebida.");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar esta conta a receber?")) return;
    const { error } = await supabase.from("accounts_receivable").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Conta removida.");
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Contas a Receber</h1>
          <p>Recebimentos de clientes por evento</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => setForm(emptyForm)}>
          + Nova conta
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-filters-bar">
          <select className="field-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="atrasado">Atrasado</option>
            <option value="recebido">Recebido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Cliente</th>
                <th>Evento</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const status = displayStatus(item);
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03, ease: [0.16, 0.84, 0.36, 1] }}
                  >
                    <td>{item.description}</td>
                    <td>{clientName(item.client_id)}</td>
                    <td>{eventTitle(item.event_id)}</td>
                    <td>{formatDate(item.due_date)}</td>
                    <td>R$ {item.amount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${status.key}`}>{status.label}</span>
                    </td>
                    <td className="row-actions">
                      {item.status === "pendente" && (
                        <button className="admin-btn admin-btn-line admin-btn-sm" onClick={() => markReceived(item)}>
                          Marcar recebido
                        </button>
                      )}
                      <button className="admin-btn admin-btn-line admin-btn-sm" onClick={() => setForm(item)}>
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
          {!loading && filtered.length === 0 && <div className="empty-state">Nenhuma conta encontrada.</div>}
        </div>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar conta" : "Nova conta a receber"}>
        {form && (
          <form onSubmit={save}>
            <div className="field-group">
              <label className="field-label">Descrição</label>
              <input
                className="field-input"
                required
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Valor (R$)</label>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={form.amount ?? 0}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Vencimento</label>
                <input
                  className="field-input"
                  type="date"
                  required
                  value={form.due_date ?? ""}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Cliente</label>
                <select
                  className="field-select"
                  value={form.client_id ?? ""}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value || null })}
                >
                  <option value="">—</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Evento</label>
                <select
                  className="field-select"
                  value={form.event_id ?? ""}
                  onChange={(e) => setForm({ ...form, event_id: e.target.value || null })}
                >
                  <option value="">—</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Status</label>
                <select
                  className="field-select"
                  value={form.status ?? "pendente"}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ReceivableStatus })}
                >
                  <option value="pendente">Pendente</option>
                  <option value="recebido">Recebido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Forma de pagamento</label>
                <input
                  className="field-input"
                  value={form.payment_method ?? ""}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                />
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

export default function ContasAReceberPage() {
  return (
    <ToastProvider>
      <ContasAReceberPageContent />
    </ToastProvider>
  );
}
