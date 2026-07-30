"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FaqRow } from "@/lib/types";
import Modal from "@/components/admin/Modal";

const emptyForm: Partial<FaqRow> = { question: "", answer: "", is_published: true };

export default function FaqAdminPage() {
  const [items, setItems] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<FaqRow> | null>(null);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("faqs").select("*").order("display_order", { ascending: true });
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
      await supabase.from("faqs").update(form).eq("id", form.id);
    } else {
      await supabase
        .from("faqs")
        .insert({ ...form, question: form.question!, answer: form.answer!, display_order: items.length });
    }
    setForm(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar esta pergunta?")) return;
    await supabase.from("faqs").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function move(id: string, direction: -1 | 1) {
    const index = items.findIndex((i) => i.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= items.length) return;

    const a = items[index];
    const b = items[swapIndex];
    const next = [...items];
    next[index] = { ...b, display_order: a.display_order };
    next[swapIndex] = { ...a, display_order: b.display_order };
    next.sort((x, y) => x.display_order - y.display_order);
    setItems(next);

    await Promise.all([
      supabase.from("faqs").update({ display_order: a.display_order }).eq("id", b.id),
      supabase.from("faqs").update({ display_order: b.display_order }).eq("id", a.id),
    ]);
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Perguntas frequentes</h1>
          <p>Perguntas e respostas exibidas na seção de FAQ do site</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => setForm(emptyForm)}>
          + Nova pergunta
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Pergunta</th>
                <th>Resposta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="admin-btn admin-btn-line admin-btn-sm" disabled={i === 0} onClick={() => move(item.id, -1)}>
                      ↑
                    </button>{" "}
                    <button
                      className="admin-btn admin-btn-line admin-btn-sm"
                      disabled={i === items.length - 1}
                      onClick={() => move(item.id, 1)}
                    >
                      ↓
                    </button>
                  </td>
                  <td style={{ maxWidth: 260, whiteSpace: "normal" }}>{item.question}</td>
                  <td style={{ maxWidth: 380, whiteSpace: "normal" }}>{item.answer}</td>
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
          {!loading && items.length === 0 && <div className="empty-state">Nenhuma pergunta cadastrada.</div>}
        </div>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar pergunta" : "Nova pergunta"}>
        {form && (
          <form onSubmit={save}>
            <div className="field-group">
              <label className="field-label">Pergunta</label>
              <input
                className="field-input"
                required
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Resposta</label>
              <textarea
                className="field-textarea"
                required
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
              />
            </div>
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
