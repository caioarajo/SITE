"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { PayableRow, PayableStatus, SupplierRow, StaffRow, EventRow } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";

const emptyForm: Partial<PayableRow> = {
  description: "",
  supplier_id: null,
  staff_id: null,
  event_id: null,
  category: "",
  amount: 0,
  due_date: new Date().toISOString().slice(0, 10),
  paid_date: null,
  status: "pendente",
  payment_method: "",
  notes: "",
};

function isOverdue(item: PayableRow) {
  return item.status === "pendente" && item.due_date < new Date().toISOString().slice(0, 10);
}

function displayStatus(item: PayableRow): { key: string; label: string } {
  if (isOverdue(item)) return { key: "atrasado", label: "Atrasado" };
  if (item.status === "pago") return { key: "pago", label: "Pago" };
  if (item.status === "cancelado") return { key: "cancelado", label: "Cancelado" };
  return { key: "pendente", label: "Pendente" };
}

function ContasAPagarPageContent() {
  const [items, setItems] = useState<PayableRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [form, setForm] = useState<Partial<PayableRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  async function load() {
    setLoading(true);
    const [payableRes, suppliersRes, staffRes, eventsRes] = await Promise.all([
      supabase.from("accounts_payable").select("*").order("due_date", { ascending: true }),
      supabase.from("suppliers").select("*").order("name", { ascending: true }),
      supabase.from("staff").select("*").order("name", { ascending: true }),
      supabase.from("events").select("*").order("title", { ascending: true }),
    ]);
    setItems((payableRes.data as PayableRow[]) ?? []);
    setSuppliers((suppliersRes.data as SupplierRow[]) ?? []);
    setStaff((staffRes.data as StaffRow[]) ?? []);
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

  function supplierName(id: string | null) {
    return suppliers.find((s) => s.id === id)?.name ?? "—";
  }
  function staffName(id: string | null) {
    return staff.find((s) => s.id === id)?.name ?? "—";
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
      ? await supabase.from("accounts_payable").update(rest).eq("id", id)
      : await supabase
          .from("accounts_payable")
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

  async function markPaid(item: PayableRow) {
    const { error } = await supabase
      .from("accounts_payable")
      .update({ status: "pago", paid_date: new Date().toISOString().slice(0, 10) })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta marcada como paga.");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar esta conta a pagar?")) return;
    const { error } = await supabase.from("accounts_payable").delete().eq("id", id);
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
          <h1>Contas a Pagar</h1>
          <p>Pagamentos a fornecedores, colaboradores e despesas de eventos</p>
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
            <option value="pago">Pago</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Vínculo</th>
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
                    <td>
                      {item.supplier_id
                        ? supplierName(item.supplier_id)
                        : item.staff_id
                          ? staffName(item.staff_id)
                          : item.event_id
                            ? eventTitle(item.event_id)
                            : "—"}
                    </td>
                    <td>{formatDate(item.due_date)}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td>
                      <span className={`status-badge status-${status.key}`}>{status.label}</span>
                    </td>
                    <td className="row-actions">
                      {item.status === "pendente" && (
                        <button className="admin-btn admin-btn-line admin-btn-sm" onClick={() => markPaid(item)}>
                          Marcar pago
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

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar conta" : "Nova conta a pagar"}>
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
            <div className="field-group">
              <label className="field-label">Categoria</label>
              <input
                className="field-input"
                value={form.category ?? ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Fornecedor</label>
                <select
                  className="field-select"
                  value={form.supplier_id ?? ""}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value || null })}
                >
                  <option value="">—</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Colaborador</label>
                <select
                  className="field-select"
                  value={form.staff_id ?? ""}
                  onChange={(e) => setForm({ ...form, staff_id: e.target.value || null })}
                >
                  <option value="">—</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
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
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Status</label>
                <select
                  className="field-select"
                  value={form.status ?? "pendente"}
                  onChange={(e) => setForm({ ...form, status: e.target.value as PayableStatus })}
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
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

export default function ContasAPagarPage() {
  return (
    <ToastProvider>
      <ContasAPagarPageContent />
    </ToastProvider>
  );
}
