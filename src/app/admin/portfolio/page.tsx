"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PortfolioItemRow } from "@/lib/types";
import Modal from "@/components/admin/Modal";

export default function PortfolioAdminPage() {
  const [items, setItems] = useState<PortfolioItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState<PortfolioItemRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("portfolio_items").select("*").order("display_order", { ascending: true });
    setItems((data as PortfolioItemRow[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const isVideo = file.type.startsWith("video/");
        const ext = file.name.split(".").pop();
        const path = `uploads/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (uploadError) {
          alert(`Erro ao enviar ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from("portfolio").getPublicUrl(path);

        await supabase.from("portfolio_items").insert({
          title: file.name.replace(/\.[^.]+$/, ""),
          caption: null,
          media_type: isVideo ? "video" : "image",
          storage_path: path,
          url: publicUrlData.publicUrl,
          display_order: items.length,
        });
      }

      setUploading(false);
      load();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length]
  );

  async function removeItem(item: PortfolioItemRow) {
    if (!confirm(`Apagar "${item.title}"? Essa ação não pode ser desfeita.`)) return;
    // Só tenta apagar do Storage se o arquivo foi enviado por aqui
    // (itens "seed" apontam para /public e não têm objeto no bucket).
    if (item.storage_path.startsWith("uploads/")) {
      await supabase.storage.from("portfolio").remove([item.storage_path]);
    }
    await supabase.from("portfolio_items").delete().eq("id", item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function togglePublished(item: PortfolioItemRow) {
    const next = !item.is_published;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_published: next } : i)));
    await supabase.from("portfolio_items").update({ is_published: next }).eq("id", item.id);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    await supabase
      .from("portfolio_items")
      .update({ title: editing.title, caption: editing.caption })
      .eq("id", editing.id);
    setItems((prev) => prev.map((i) => (i.id === editing.id ? editing : i)));
    setEditing(null);
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Portfólio</h1>
          <p>Fotos e vídeos dos trabalhos realizados, exibidos na galeria do site</p>
        </div>
      </div>

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
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
      >
        {uploading ? "Enviando..." : "Clique ou arraste fotos e vídeos aqui para adicionar ao portfólio"}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {loading ? (
        <div className="empty-state">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">Nenhum item no portfólio ainda.</div>
      ) : (
        <div className="media-grid">
          {items.map((item) => (
            <div className="media-item" key={item.id} style={{ opacity: item.is_published ? 1 : 0.45 }}>
              {item.media_type === "video" ? <video src={item.url} muted /> : <img src={item.url} alt={item.title} />}
              <div className="media-overlay">
                <span className="cap">{item.title}</span>
              </div>
              <div className="media-actions">
                <button onClick={() => setEditing(item)} title="Editar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 20h9" strokeLinecap="round" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button onClick={() => togglePublished(item)} title={item.is_published ? "Ocultar do site" : "Publicar no site"}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button onClick={() => removeItem(item)} title="Apagar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar item do portfólio">
        {editing && (
          <form onSubmit={saveEdit}>
            <div className="field-group">
              <label className="field-label">Título</label>
              <input
                className="field-input"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Legenda (exibida na galeria)</label>
              <textarea
                className="field-textarea"
                value={editing.caption ?? ""}
                onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="admin-btn admin-btn-line" onClick={() => setEditing(null)}>
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
