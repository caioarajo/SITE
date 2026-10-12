"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TestimonialRow } from "@/lib/types";
import { uploadImageFile } from "@/lib/uploadMedia";
import Modal from "@/components/admin/Modal";

const emptyForm: Partial<TestimonialRow> = {
  couple_names: "",
  quote: "",
  photo_url_1: "",
  focal_x: null,
  focal_y: null,
  is_featured: false,
  is_published: true,
};

export default function TestimonialsAdminPage() {
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<TestimonialRow> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  async function uploadPhoto(file: File) {
    if (!form) return;
    setUploading(true);
    try {
      const { url } = await uploadImageFile(file, "uploads/depoimentos");
      // Foto nova: zera o ponto focal manual, já que ele era relativo à
      // foto antiga e não faz sentido reaproveitar nessa.
      setForm((prev) => (prev ? { ...prev, photo_url_1: url, focal_x: null, focal_y: null } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    }
    setUploading(false);
  }

  /** Clique na prévia define o ponto focal como % da posição clicada —
   * mesmo mecanismo usado no Portfólio, para o corte "cover" do card em
   * destaque não arriscar cortar a cabeça da pessoa na foto. */
  function pickFocalPoint(e: MouseEvent<HTMLImageElement>) {
    if (!form) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    setForm({ ...form, focal_x: Math.min(100, Math.max(0, x)), focal_y: Math.min(100, Math.max(0, y)) });
  }

  async function save(e: FormEvent) {
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
                <th></th>
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
                  <td>
                    {item.photo_url_1 ? (
                      <img
                        src={item.photo_url_1}
                        alt=""
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          objectFit: "cover",
                          objectPosition: `${item.focal_x ?? 50}% ${item.focal_y ?? 20}%`,
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          display: "block",
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "var(--cream-alt)",
                        }}
                      />
                    )}
                  </td>
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

            <div className="field-group">
              <label className="field-label">Foto do depoimento</label>
              {form.photo_url_1 ? (
                <>
                  <div className="focal-picker">
                    <img src={form.photo_url_1} alt="" onClick={pickFocalPoint} />
                    <span
                      className="focal-marker"
                      style={{ left: `${form.focal_x ?? 50}%`, top: `${form.focal_y ?? 20}%` }}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--taupe-deep)", marginTop: 8 }}>
                    Clique no rosto na foto acima para garantir que a miniatura não corte a cabeça.
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    {(form.focal_x !== null || form.focal_y !== null) && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-line admin-btn-sm"
                        onClick={() => setForm({ ...form, focal_x: null, focal_y: null })}
                      >
                        Redefinir ponto focal
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-btn admin-btn-line admin-btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Trocar foto
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => setForm({ ...form, photo_url_1: null, focal_x: null, focal_y: null })}
                    >
                      Remover foto
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className={`upload-dropzone ${dragging ? "dragging" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) uploadPhoto(file);
                  }}
                >
                  {uploading ? "Enviando..." : "Clique ou arraste uma foto aqui"}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                  e.target.value = "";
                }}
              />
            </div>

            <label className="toggle-row" style={{ marginTop: 6, marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={!!form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              Exibir como depoimento em destaque (com foto, no card grande)
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
              <button type="submit" className="admin-btn admin-btn-gold" disabled={uploading}>
                Salvar
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
