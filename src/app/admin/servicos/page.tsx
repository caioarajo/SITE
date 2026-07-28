"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ServiceRow } from "@/lib/types";
import Modal from "@/components/admin/Modal";

const emptyForm: Partial<ServiceRow> = {
  name: "",
  tagline: "",
  price_label: "Sob consulta",
  features: [""],
  is_featured: false,
  is_published: true,
};

export default function ServicesAdminPage() {
  const [items, setItems] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<ServiceRow> | null>(null);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").order("display_order", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const cleanFeatures = (form.features ?? []).map((f) => f.trim()).filter(Boolean);
    const payload = { ...form, features: cleanFeatures };

    if (form.id) {
      await supabase.from("services").update(payload).eq("id", form.id);
    } else {
      await supabase.from("services").insert({ ...payload, display_order: items.length });
    }
    setForm(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar este pacote de serviço?")) return;
    await supabase.from("services").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateFeature(index: number, value: string) {
    if (!form) return;
    const features = [...(form.features ?? [])];
    features[index] = value;
    setForm({ ...form, features });
  }

  function removeFeature(index: number) {
    if (!form) return;
    const features = (form.features ?? []).filter((_, i) => i !== index);
    setForm({ ...form, features });
  }

  function addFeature() {
    if (!form) return;
    setForm({ ...form, features: [...(form.features ?? []), ""] });
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Serviços</h1>
          <p>Pacotes de assessoria exibidos na seção de Serviços do site</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => setForm(emptyForm)}>
          + Novo pacote
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Itens</th>
                <th>Destaque</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{item.name}</td>
                  <td style={{ maxWidth: 340, whiteSpace: "normal" }}>{item.tagline}</td>
                  <td>{item.features.length}</td>
                  <td>{item.is_featured ? "Sim" : "—"}</td>
                  <td className="row-actions">
                    <button className="admin-btn admin-btn-line admin-btn-sm" onClick={() => setForm(item)}>
                      Editar
                    </button>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => remove(item.id)}>
                      Apagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && <div className="empty-state">Nenhum pacote cadastrado.</div>}
        </div>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar pacote" : "Novo pacote"}>
        {form && (
          <form onSubmit={save}>
            <div className="field-group">
              <label className="field-label">Nome do pacote</label>
              <input
                className="field-input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Descrição curta</label>
              <textarea
                className="field-textarea"
                value={form.tagline ?? ""}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Texto do preço</label>
              <input
                className="field-input"
                value={form.price_label ?? ""}
                placeholder="Sob consulta"
                onChange={(e) => setForm({ ...form, price_label: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label className="field-label">O que está incluso</label>
              <div className="checklist-editor">
                {(form.features ?? []).map((feature, i) => (
                  <div className="row" key={i}>
                    <input className="field-input" value={feature} onChange={(e) => updateFeature(i, e.target.value)} />
                    <button type="button" className="remove" onClick={() => removeFeature(i)}>
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="admin-btn admin-btn-line admin-btn-sm add-row" onClick={addFeature}>
                  + Adicionar item
                </button>
              </div>
            </div>

            <label className="toggle-row" style={{ marginTop: 6, marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={!!form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              Destacar como &quot;mais completo&quot; (aparece elevado, com selo)
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.is_published ?? true}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              Publicado no site
            </label>

            <div className="modal-actions">
              <button type="button" className="admin-btn admin-btn-line" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="admin-btn admin-btn-gold">
                Salvar
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
