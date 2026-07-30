"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TestimonialRow } from "@/lib/types";
import Modal from "@/components/admin/Modal";

const emptyForm: Partial<TestimonialRow> = {
  couple_names: "",
  quote: "",
  photo_url_1: "",
  photo_url_2: "",
  is_featured: false,
  is_published: true,
};

export default function TestimonialsAdminPage() {
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<TestimonialRow> | null>(null);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("testimonials").select("*").order("display_order", { ascending: true });
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

    if (form.id) {
      await supabase.from("testimonials").update(form).eq("id", form.id);
    } else {
      await supabase
        .from("testimonials")
        .insert({ ...form, couple_names: form.couple_names!, quote: form.quote!, display_order: items.length });
    }
    setForm(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar este depoimento?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Depoimentos</h1>
          <p>Falas dos noivos exibidas na seção de depoimentos do site</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => setForm(emptyForm)}>
          + Novo depoimento
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome(s)</th>
                <th>Depoimento</th>
                <th>Destaque</th>
                <th>Publicado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{item.couple_names}</td>
                  <td style={{ maxWidth: 380, whiteSpace: "normal" }}>{item.quote}</td>
                  <td>{item.is_featured ? "Sim" : "—"}</td>
                  <td>{item.is_published ? "Sim" : "Não"}</td>
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
          {!loading && items.length === 0 && <div className="empty-state">Nenhum depoimento cadastrado.</div>}
        </div>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar depoimento" : "Novo depoimento"}>
        {form && (
          <form onSubmit={save}>
            <div className="field-group">
              <label className="field-label">Nome(s) do(s) noivo(s)</label>
              <input
                className="field-input"
                required
                value={form.couple_names}
                onChange={(e) => setForm({ ...form, couple_names: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Depoimento</label>
              <textarea
                className="field-textarea"
                required
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Foto 1 (URL)</label>
                <input
                  className="field-input"
                  value={form.photo_url_1 ?? ""}
                  onChange={(e) => setForm({ ...form, photo_url_1: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Foto 2 (URL)</label>
                <input
                  className="field-input"
                  value={form.photo_url_2 ?? ""}
                  onChange={(e) => setForm({ ...form, photo_url_2: e.target.value })}
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--taupe-deep)", marginTop: -8, marginBottom: 16 }}>
              Dica: envie as fotos pela página de Portfólio, copie o link público e cole aqui.
            </p>
            <label className="toggle-row" style={{ marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={!!form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              Exibir como depoimento em destaque (com fotos, no card grande)
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
