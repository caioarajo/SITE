"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { StaffRow } from "@/lib/types";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";
import { formatCurrency } from "@/lib/utils";
import { maskCPF, maskPhone } from "@/lib/masks";

const emptyForm: Partial<StaffRow> = {
  name: "",
  role_title: "",
  email: "",
  phone: "",
  document: "",
  hire_date: null,
  day_rate: null,
  is_active: true,
  notes: "",
};

function ColaboradoresPageContent() {
  const [items, setItems] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<StaffRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("staff").select("*").order("name", { ascending: true });
    setItems((data as StaffRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const payload = { ...form };
    const { id, ...rest } = payload;

    const { error } = id
      ? await supabase.from("staff").update(rest).eq("id", id)
      : await supabase.from("staff").insert({ ...rest, name: rest.name! });

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(id ? "Colaborador atualizado." : "Colaborador criado.");
    setForm(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar este colaborador?")) return;
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Colaborador removido.");
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Colaboradores</h1>
          <p>Equipe e prestadores que trabalham nos eventos</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => setForm(emptyForm)}>
          + Novo colaborador
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo/função</th>
                <th>Contato</th>
                <th>Diária</th>
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
                  <td style={{ whiteSpace: "nowrap" }}>{item.name}</td>
                  <td>{item.role_title || "—"}</td>
                  <td>{[item.email, item.phone].filter(Boolean).join(" · ") || "—"}</td>
                  <td>{item.day_rate != null ? formatCurrency(item.day_rate) : "—"}</td>
                  <td>
                    <span className={`status-badge ${item.is_active ? "status-confirmado" : "status-cancelado"}`}>
                      {item.is_active ? "Ativo" : "Inativo"}
                    </span>
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
          {!loading && items.length === 0 && <div className="empty-state">Nenhum colaborador cadastrado.</div>}
        </div>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar colaborador" : "Novo colaborador"}>
        {form && (
          <form onSubmit={save}>
            <div className="field-group">
              <label className="field-label">Nome</label>
              <input
                className="field-input"
                required
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Cargo/função</label>
                <input
                  className="field-input"
                  placeholder="Ex.: Fotógrafo, Cerimonialista..."
                  value={form.role_title ?? ""}
                  onChange={(e) => setForm({ ...form, role_title: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">CPF</label>
                <input
                  className="field-input"
                  value={form.document ?? ""}
                  onChange={(e) => setForm({ ...form, document: maskCPF(e.target.value) })}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">E-mail</label>
                <input
                  className="field-input"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Telefone</label>
                <input
                  className="field-input"
                  value={form.phone ?? ""}
                  onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Data de início</label>
                <input
                  className="field-input"
                  type="date"
                  value={form.hire_date ?? ""}
                  onChange={(e) => setForm({ ...form, hire_date: e.target.value || null })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Diária (R$)</label>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.day_rate ?? ""}
                  onChange={(e) => setForm({ ...form, day_rate: e.target.value ? Number(e.target.value) : null })}
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
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Colaborador ativo
            </label>

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

export default function ColaboradoresPage() {
  return (
    <ToastProvider>
      <ColaboradoresPageContent />
    </ToastProvider>
  );
}
