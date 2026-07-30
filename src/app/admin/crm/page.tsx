"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { OpportunityRow, OpportunitySource, OpportunityStage } from "@/lib/types";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";
import { formatCurrency } from "@/lib/utils";
import { maskPhone } from "@/lib/masks";

const emptyForm: Partial<OpportunityRow> = {
  name: "",
  email: "",
  phone: "",
  event_type: "",
  source: "manual",
  stage: "novo",
  estimated_value: null,
  expected_close_date: null,
  lost_reason: "",
  notes: "",
};

const STAGES: { id: OpportunityStage; label: string }[] = [
  { id: "novo", label: "Novo" },
  { id: "qualificando", label: "Qualificando" },
  { id: "proposta", label: "Proposta" },
  { id: "negociacao", label: "Negociação" },
  { id: "ganho", label: "Ganho" },
  { id: "perdido", label: "Perdido" },
];

const SOURCE_LABELS: Record<OpportunitySource, string> = {
  site_form: "Formulário do site",
  whatsapp: "WhatsApp",
  manual: "Manual",
  indicacao: "Indicação",
  outro: "Outro",
};

function CrmPageContent() {
  const [items, setItems] = useState<OpportunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<OpportunityRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
    setItems((data as OpportunityRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeStage(id: string, stage: OpportunityStage) {
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
    const { error } = await supabase.from("opportunities").update({ stage }).eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const payload = { ...form };
    const { id, ...rest } = payload;

    const { error } = id
      ? await supabase.from("opportunities").update(rest).eq("id", id)
      : await supabase.from("opportunities").insert({ ...rest, name: rest.name! });

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(id ? "Oportunidade atualizada." : "Oportunidade criada.");
    setForm(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar esta oportunidade?")) return;
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Oportunidade removida.");
    setForm(null);
  }

  async function convertToClient() {
    if (!form?.id) return;
    setConverting(true);
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: form.name!,
        email: form.email || null,
        phone: form.phone || null,
        notes: form.notes || null,
      })
      .select("id")
      .single();

    if (clientError || !client) {
      setConverting(false);
      toast.error(clientError?.message ?? "Não foi possível criar o cliente.");
      return;
    }

    const { error: updateError } = await supabase
      .from("opportunities")
      .update({ client_id: client.id })
      .eq("id", form.id);

    setConverting(false);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    toast.success("Cliente criado a partir da oportunidade!");
    setForm(null);
    load();
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>CRM</h1>
          <p>Funil de prospecção — arraste o estágio no card ou clique para ver detalhes</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => setForm(emptyForm)}>
          + Nova oportunidade
        </button>
      </div>

      {!loading && (
        <LayoutGroup>
          <div className="kanban-board">
            {STAGES.map((stage) => {
              const stageItems = items.filter((o) => o.stage === stage.id);
              return (
                <div className="kanban-column" key={stage.id}>
                  <h3>
                    {stage.label} <span className="count">{stageItems.length}</span>
                  </h3>
                  {stageItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      layoutId={item.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: [0.16, 0.84, 0.36, 1] }}
                      className="kanban-card"
                      onClick={() => setForm(item)}
                    >
                      <div className="name">{item.name}</div>
                      <div className="meta">
                        <span>{SOURCE_LABELS[item.source]}</span>
                        {item.estimated_value != null && (
                          <span className="value">{formatCurrency(item.estimated_value)}</span>
                        )}
                      </div>
                      <div className="actions" onClick={(e) => e.stopPropagation()}>
                        <select
                          className="field-select"
                          style={{ fontSize: 12, padding: "4px 8px" }}
                          value={item.stage}
                          onChange={(e) => changeStage(item.id, e.target.value as OpportunityStage)}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  ))}
                  {stageItems.length === 0 && (
                    <div className="empty-state" style={{ padding: "20px 8px" }}>
                      Nada aqui
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </LayoutGroup>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Editar oportunidade" : "Nova oportunidade"}
      >
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
                <label className="field-label">Tipo de evento</label>
                <input
                  className="field-input"
                  value={form.event_type ?? ""}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Origem</label>
                <select
                  className="field-select"
                  value={form.source ?? "manual"}
                  onChange={(e) => setForm({ ...form, source: e.target.value as OpportunitySource })}
                >
                  {(Object.entries(SOURCE_LABELS) as [OpportunitySource, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Valor estimado (R$)</label>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.estimated_value ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, estimated_value: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
              <div className="field-group">
                <label className="field-label">Previsão de fechamento</label>
                <input
                  className="field-input"
                  type="date"
                  value={form.expected_close_date ?? ""}
                  onChange={(e) => setForm({ ...form, expected_close_date: e.target.value || null })}
                />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Estágio</label>
              <select
                className="field-select"
                value={form.stage ?? "novo"}
                onChange={(e) => setForm({ ...form, stage: e.target.value as OpportunityStage })}
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {form.stage === "perdido" && (
              <div className="field-group">
                <label className="field-label">Motivo da perda</label>
                <input
                  className="field-input"
                  value={form.lost_reason ?? ""}
                  onChange={(e) => setForm({ ...form, lost_reason: e.target.value })}
                />
              </div>
            )}
            <div className="field-group">
              <label className="field-label">Notas</label>
              <textarea
                className="field-textarea"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {form.stage === "ganho" && !form.client_id && (
              <div style={{ marginBottom: 16 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-line"
                  style={{ width: "100%" }}
                  onClick={convertToClient}
                  disabled={converting}
                >
                  {converting ? "Convertendo..." : "Converter em Cliente"}
                </button>
              </div>
            )}
            {form.client_id && (
              <p style={{ fontSize: 12.5, color: "var(--taupe-deep)", marginBottom: 16 }}>
                Já convertida em cliente.
              </p>
            )}

            <div className="modal-actions">
              {form.id && (
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  style={{ marginRight: "auto" }}
                  onClick={() => remove(form.id!)}
                >
                  Apagar
                </button>
              )}
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

export default function CrmPage() {
  return (
    <ToastProvider>
      <CrmPageContent />
    </ToastProvider>
  );
}
