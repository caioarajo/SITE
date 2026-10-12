"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { maskPhone } from "@/lib/masks";
import { uploadImageFile } from "@/lib/uploadMedia";

const DEFAULT_PHOTO_URL = "/images/lia-contact.jpg";

export default function SettingsPage() {
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [photoUrl, setPhotoUrl] = useState(DEFAULT_PHOTO_URL);
  const [focalX, setFocalX] = useState<number | null>(null);
  const [focalY, setFocalY] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("*");
      data?.forEach((row) => {
        if (row.key === "phone") setPhone(row.value ?? "");
        if (row.key === "whatsapp") setWhatsapp(row.value ?? "");
        if (row.key === "email") setEmail(row.value ?? "");
        if (row.key === "instagram") setInstagram(row.value ?? "");
        if (row.key === "contact_photo_url" && row.value) setPhotoUrl(row.value);
        if (row.key === "contact_photo_focal_x" && row.value) setFocalX(Number(row.value));
        if (row.key === "contact_photo_focal_y" && row.value) setFocalY(Number(row.value));
      });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadImageFile(file, "uploads/contato");
      // Foto nova: zera o ponto focal manual, já que era relativo à antiga.
      setPhotoUrl(url);
      setFocalX(null);
      setFocalY(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    }
    setUploading(false);
  }

  /** Clique na prévia define o ponto focal como % da posição clicada —
   * mesmo mecanismo do Portfólio e dos Depoimentos, pra garantir que o
   * corte "cover" da foto na seção de Contato não corte a cabeça. */
  function pickFocalPoint(e: MouseEvent<HTMLImageElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    setFocalX(Math.min(100, Math.max(0, x)));
    setFocalY(Math.min(100, Math.max(0, y)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    await Promise.all([
      supabase.from("site_settings").upsert({ key: "phone", value: phone }),
      supabase.from("site_settings").upsert({ key: "whatsapp", value: whatsapp }),
      supabase.from("site_settings").upsert({ key: "email", value: email }),
      supabase.from("site_settings").upsert({ key: "instagram", value: instagram }),
      supabase.from("site_settings").upsert({ key: "contact_photo_url", value: photoUrl }),
      supabase.from("site_settings").upsert({ key: "contact_photo_focal_x", value: focalX != null ? String(focalX) : "" }),
      supabase.from("site_settings").upsert({ key: "contact_photo_focal_y", value: focalY != null ? String(focalY) : "" }),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="empty-state">Carregando...</div>;

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Configurações</h1>
          <p>Dados de contato exibidos no site (rodapé, botão de WhatsApp, seção de contato)</p>
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Telefone (exibido no site)</label>
            <input className="field-input" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
          </div>
          <div className="field-group">
            <label className="field-label">Número de WhatsApp (formato internacional, só números)</label>
            <input className="field-input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5592992662890" />
          </div>
          <div className="field-group">
            <label className="field-label">E-mail</label>
            <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Instagram (com @)</label>
            <input className="field-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>

          <div className="field-group">
            <label className="field-label">Foto da seção de Contato</label>
            <div className="focal-picker">
              <img src={photoUrl} alt="" onClick={pickFocalPoint} />
              <span className="focal-marker" style={{ left: `${focalX ?? 50}%`, top: `${focalY ?? 20}%` }} />
            </div>
            <p style={{ fontSize: 12, color: "var(--taupe-deep)", marginTop: 8 }}>
              Clique no rosto na foto acima para garantir que o corte não fique sem a cabeça.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {(focalX !== null || focalY !== null) && (
                <button
                  type="button"
                  className="admin-btn admin-btn-line admin-btn-sm"
                  onClick={() => {
                    setFocalX(null);
                    setFocalY(null);
                  }}
                >
                  Redefinir ponto focal
                </button>
              )}
              <button
                type="button"
                className="admin-btn admin-btn-line admin-btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Enviando..." : "Trocar foto"}
              </button>
            </div>
            <div
              className={`upload-dropzone ${dragging ? "dragging" : ""}`}
              style={{ marginTop: 10 }}
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

          <button type="submit" className="admin-btn admin-btn-gold" disabled={uploading}>
            Salvar alterações
          </button>
          {saved && <span style={{ marginLeft: 14, color: "#3a8a5c", fontSize: 13 }}>Salvo com sucesso!</span>}
        </form>
      </div>
    </>
  );
}
