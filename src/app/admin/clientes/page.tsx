"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { ClientRow, ClientType } from "@/lib/types";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";
import { maskCPF, maskCNPJ, maskCEP, maskPhone } from "@/lib/masks";

const emptyForm: Partial<ClientRow> = {
  name: "",
  client_type: "pessoa_fisica",
  document: "",
  email: "",
  phone: "",
  zip_code: "",
  address: "",
  notes: "",
  is_active: true,
};

function ClientesPageContent() {
  const [items, setItems] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<ClientRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("name", { ascending: true });
    setItems((data as ClientRow[]) ?? []);
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
      ? await supabase.from("clients").update(rest).eq("id", id)
      : await supabase.from("clients").insert({ ...rest, name: rest.name! });

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(id ? "Cliente atualizado." : "Cliente criado.");
    setForm(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar este cliente?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Cliente removido.");
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Clientes</h1>
          <p>Cadastro de clientes da assessoria</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => setForm(emptyForm)}>
          + Novo cliente
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Contato</th>
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
                  <td>{item.client_type === "pessoa_juridica" ? "Pessoa Jurídica" : "Pessoa Física"}</td>
                  <td>{[item.email, item.phone].filter(Boolean).join(" · ") || "—"}</td>
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
          {!loading && items.length === 0 && <div className="empty-state">Nenhum cliente cadastrado.</div>}
        </div>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar cliente" : "Novo cliente"}>
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
                <label className="field-label">Tipo</label>
                <select
                  className="field-select"
                  value={form.client_type ?? "pessoa_fisica"}
                  onChange={(e) => setForm({ ...form, client_type: e.target.value as ClientType })}
                >
                  <option value="pessoa_fisica">Pessoa Física</option>
                  <option value="pessoa_juridica">Pessoa Jurídica</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">{form.client_type === "pessoa_juridica" ? "CNPJ" : "CPF"}</label>
                <input
                  className="field-input"
                  value={form.document ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      document:
                        form.client_type === "pessoa_juridica" ? maskCNPJ(e.target.value) : maskCPF(e.target.value),
                    })
                  }
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
                <label className="field-label">CEP</label>
                <input
                  className="field-input"
                  value={form.zip_code ?? ""}
                  onChange={(e) => setForm({ ...form, zip_code: maskCEP(e.target.value) })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Endereço</label>
                <input
                  className="field-input"
                  value={form.address ?? ""}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
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
              Cliente ativo
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

export default function ClientesPage() {
  return (
    <ToastProvider>
      <ClientesPageContent />
    </ToastProvider>
  );
}
