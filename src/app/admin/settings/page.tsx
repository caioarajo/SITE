"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("*");
      data?.forEach((row) => {
        if (row.key === "phone") setPhone(row.value ?? "");
        if (row.key === "whatsapp") setWhatsapp(row.value ?? "");
        if (row.key === "email") setEmail(row.value ?? "");
        if (row.key === "instagram") setInstagram(row.value ?? "");
      });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    await Promise.all([
      supabase.from("site_settings").upsert({ key: "phone", value: phone }),
      supabase.from("site_settings").upsert({ key: "whatsapp", value: whatsapp }),
      supabase.from("site_settings").upsert({ key: "email", value: email }),
      supabase.from("site_settings").upsert({ key: "instagram", value: instagram }),
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
            <input className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
          <button type="submit" className="admin-btn admin-btn-gold">
            Salvar alterações
          </button>
          {saved && <span style={{ marginLeft: 14, color: "#3a8a5c", fontSize: 13 }}>Salvo com sucesso!</span>}
        </form>
      </div>
    </>
  );
}
