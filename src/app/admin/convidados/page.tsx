"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { GuestRow, GuestListRow, RsvpStatus } from "@/lib/types";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";

const emptyForm: Partial<GuestRow> = {
  name: "",
  email: "",
  phone: "",
  category: "",
  companions: 0,
  rsvp_status: "pendente",
  notes: "",
};

const RSVP_LABELS: Record<RsvpStatus, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recusado: "Recusado",
};

function ConvidadosPageContent() {
  const searchParams = useSearchParams();
  const [lists, setLists] = useState<GuestListRow[]>([]);
  const [selectedList, setSelectedList] = useState<string>("");
  const [items, setItems] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<GuestRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    async function loadLists() {
      const { data } = await supabase.from("guest_lists").select("*").order("name", { ascending: true });
      const rows = (data as GuestListRow[]) ?? [];
      setLists(rows);
      const fromUrl = searchParams.get("lista");
      if (fromUrl && rows.some((l) => l.id === fromUrl)) {
        setSelectedList(fromUrl);
      } else if (rows.length > 0) {
        setSelectedList(rows[0].id);
      } else {
        setLoading(false);
      }
    }
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadGuests(listId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("guests")
      .select("*")
      .eq("guest_list_id", listId)
      .order("name", { ascending: true });
    setItems((data as GuestRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (selectedList) loadGuests(selectedList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedList]);

  const confirmedCount = items.filter((g) => g.rsvp_status === "confirmado").length;
  const pendingCount = items.filter((g) => g.rsvp_status === "pendente").length;
  const declinedCount = items.filter((g) => g.rsvp_status === "recusado").length;
  const totalCompanions = items.reduce((s, g) => s + g.companions, 0);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form || !selectedList) return;
    setSaving(true);
    const payload = { ...form };
    const { id, ...rest } = payload;

    const { error } = id
      ? await supabase.from("guests").update(rest).eq("id", id)
      : await supabase.from("guests").insert({ ...rest, name: rest.name!, guest_list_id: selectedList });

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(id ? "Convidado atualizado." : "Convidado adicionado.");
    setForm(null);
    loadGuests(selectedList);
  }

  async function updateRsvp(id: string, rsvp_status: RsvpStatus) {
    setItems((prev) => prev.map((g) => (g.id === id ? { ...g, rsvp_status } : g)));
    const { error } = await supabase.from("guests").update({ rsvp_status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      loadGuests(selectedList);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remover este convidado?")) return;
    const { error } = await supabase.from("guests").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Convidado removido.");
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Convidados</h1>
          <p>Convidados de uma lista — a mesma lista pode valer para vários eventos</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => setForm(emptyForm)} disabled={!selectedList}>
          + Novo convidado
        </button>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="field-group" style={{ marginBottom: 0, maxWidth: 360 }}>
          <label className="field-label">Lista</label>
          <select className="field-select" value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
            {lists.length === 0 && <option value="">Nenhuma lista cadastrada</option>}
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedList && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="label">Total de convidados</div>
            <div className="value">{items.length}</div>
          </div>
          <div className="admin-stat-card">
            <div className="label">Confirmados</div>
            <div className="value">{confirmedCount}</div>
          </div>
          <div className="admin-stat-card">
            <div className="label">Pendentes</div>
            <div className="value">{pendingCount}</div>
          </div>
          <div className="admin-stat-card">
            <div className="label">Acompanhantes</div>
            <div className="value">{totalCompanions}</div>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Contato</th>
                <th>Acompanhantes</th>
                <th>RSVP</th>
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
                  <td>{item.category || "—"}</td>
                  <td>{[item.email, item.phone].filter(Boolean).join(" · ") || "—"}</td>
                  <td>{item.companions}</td>
                  <td>
                    <select
                      className="field-select"
                      style={{ padding: "6px 10px", fontSize: 12.5 }}
                      value={item.rsvp_status}
                      onChange={(e) => updateRsvp(item.id, e.target.value as RsvpStatus)}
                    >
                      {(Object.entries(RSVP_LABELS) as [RsvpStatus, string][]).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
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
          {!loading && items.length === 0 && (
            <div className="empty-state">
              {selectedList ? "Nenhum convidado nesta lista ainda." : "Crie uma lista de convidados primeiro."}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar convidado" : "Novo convidado"}>
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
                <label className="field-label">Categoria</label>
                <input
                  className="field-input"
                  placeholder="Ex.: Família, Amigos, Trabalho..."
                  value={form.category ?? ""}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Acompanhantes</label>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  value={form.companions ?? 0}
                  onChange={(e) => setForm({ ...form, companions: Number(e.target.value) })}
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
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">RSVP</label>
              <select
                className="field-select"
                value={form.rsvp_status ?? "pendente"}
                onChange={(e) => setForm({ ...form, rsvp_status: e.target.value as RsvpStatus })}
              >
                {(Object.entries(RSVP_LABELS) as [RsvpStatus, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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

export default function ConvidadosPage() {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <ConvidadosPageContent />
      </Suspense>
    </ToastProvider>
  );
}
