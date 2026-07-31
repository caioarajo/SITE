"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  AgendaItemRow,
  AgendaCategory,
  AgendaLocationType,
  AgendaPriority,
  AgendaStatus,
  EventRow,
  StaffRow,
  SupplierRow,
} from "@/lib/types";
import { AGENDA_CATEGORIES, AGENDA_STATUS_LABELS, AGENDA_PRIORITY_LABELS } from "@/lib/agendaCategories";
import Modal from "@/components/admin/Modal";
import { useToast } from "@/components/admin/Toast";

export type AgendaItemDraft = Partial<AgendaItemRow>;

export const emptyAgendaItem = (preset?: Partial<AgendaItemDraft>): AgendaItemDraft => ({
  title: "",
  description: "",
  category: "reuniao",
  event_id: null,
  client_id: null,
  supplier_id: null,
  responsible_id: null,
  start_at: "",
  end_at: null,
  all_day: false,
  location: "",
  location_type: "presencial",
  meeting_link: "",
  priority: "normal",
  status: "pendente",
  visible_to_client: false,
  meeting_minutes: "",
  ...preset,
});

/** yyyy-MM-ddTHH:mm em horário local, formato aceito por <input type="datetime-local"> */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AgendaItemModal({
  open,
  item,
  events,
  staff,
  suppliers,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  item: AgendaItemDraft | null;
  events: EventRow[];
  staff: StaffRow[];
  suppliers: SupplierRow[];
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}) {
  const supabase = createClient();
  const toast = useToast();
  const [form, setForm] = useState<AgendaItemDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);

  useEffect(() => {
    setForm(item);
  }, [item]);

  if (!form) return null;

  const selectedEvent = events.find((e) => e.id === form.event_id);
  const inviteUrl =
    typeof window !== "undefined" && form.supplier_invite_token
      ? `${window.location.origin}/convite-fornecedor/${form.supplier_invite_token}`
      : null;

  function update(patch: Partial<AgendaItemDraft>) {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);

    const payload = {
      title: form.title!,
      description: form.description || null,
      category: form.category!,
      event_id: form.event_id || null,
      client_id: selectedEvent?.client_id ?? null,
      supplier_id: form.supplier_id || null,
      responsible_id: form.responsible_id || null,
      start_at: new Date(form.start_at!).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      all_day: form.all_day ?? false,
      location: form.location || null,
      location_type: form.location_type ?? "presencial",
      meeting_link: form.location_type === "online" ? form.meeting_link || null : null,
      priority: form.category === "dia_evento" ? "critica" : (form.priority ?? "normal"),
      status: form.status ?? "pendente",
      visible_to_client: form.visible_to_client ?? false,
      meeting_minutes: form.meeting_minutes || null,
    };

    const { error } = form.id
      ? await supabase.from("agenda_items").update(payload).eq("id", form.id)
      : await supabase.from("agenda_items").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Compromisso atualizado." : "Compromisso criado.");
    onSaved();
  }

  async function remove() {
    if (!form || !form.id) return;
    if (!confirm(`Apagar "${form.title}"? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("agenda_items").delete().eq("id", form.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compromisso removido.");
    onDeleted?.();
  }

  async function generateInvite() {
    if (!form || !form.id || !form.supplier_id) return;
    setGeneratingInvite(true);
    const token = crypto.randomUUID();
    const { error } = await supabase.from("agenda_items").update({ supplier_invite_token: token }).eq("id", form.id);
    setGeneratingInvite(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    update({ supplier_invite_token: token });
    toast.success("Link de convite gerado.");
  }

  return (
    <Modal open={open} onClose={onClose} title={form.id ? "Editar compromisso" : "Novo compromisso"} className="modal-lg">
      <form onSubmit={save}>
        <div className="field-group">
          <label className="field-label">Título</label>
          <input
            className="field-input"
            required
            value={form.title ?? ""}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label">Categoria</label>
            <select
              className="field-select"
              value={form.category ?? "reuniao"}
              onChange={(e) => update({ category: e.target.value as AgendaCategory })}
            >
              {AGENDA_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Evento vinculado</label>
            <select
              className="field-select"
              value={form.event_id ?? ""}
              onChange={(e) => update({ event_id: e.target.value || null })}
            >
              <option value="">Sem vínculo (tarefa interna)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label">Início</label>
            <input
              className="field-input"
              type="datetime-local"
              required
              value={toLocalInput(form.start_at)}
              onChange={(e) => update({ start_at: e.target.value })}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Fim (opcional)</label>
            <input
              className="field-input"
              type="datetime-local"
              value={toLocalInput(form.end_at)}
              onChange={(e) => update({ end_at: e.target.value || null })}
            />
          </div>
        </div>
        <label className="toggle-row" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={form.all_day ?? false} onChange={(e) => update({ all_day: e.target.checked })} />
          Dia inteiro (sem horário fixo)
        </label>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label">Responsável</label>
            <select
              className="field-select"
              required
              value={form.responsible_id ?? ""}
              onChange={(e) => update({ responsible_id: e.target.value || null })}
            >
              <option value="">Selecione</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Fornecedor envolvido</label>
            <select
              className="field-select"
              value={form.supplier_id ?? ""}
              onChange={(e) => update({ supplier_id: e.target.value || null })}
            >
              <option value="">Nenhum</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label">Tipo de local</label>
            <select
              className="field-select"
              value={form.location_type ?? "presencial"}
              onChange={(e) => update({ location_type: e.target.value as AgendaLocationType })}
            >
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">{form.location_type === "online" ? "Link da reunião" : "Local"}</label>
            {form.location_type === "online" ? (
              <input
                className="field-input"
                value={form.meeting_link ?? ""}
                onChange={(e) => update({ meeting_link: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            ) : (
              <input className="field-input" value={form.location ?? ""} onChange={(e) => update({ location: e.target.value })} />
            )}
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label">Prioridade</label>
            <select
              className="field-select"
              value={form.category === "dia_evento" ? "critica" : (form.priority ?? "normal")}
              disabled={form.category === "dia_evento"}
              onChange={(e) => update({ priority: e.target.value as AgendaPriority })}
            >
              {Object.entries(AGENDA_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Status</label>
            <select
              className="field-select"
              value={form.status ?? "pendente"}
              onChange={(e) => update({ status: e.target.value as AgendaStatus })}
            >
              {Object.entries(AGENDA_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Descrição</label>
          <textarea
            className="field-textarea"
            value={form.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>

        {form.id && (
          <div className="field-group">
            <label className="field-label">Ata da reunião (preencher depois)</label>
            <textarea
              className="field-textarea"
              value={form.meeting_minutes ?? ""}
              onChange={(e) => update({ meeting_minutes: e.target.value })}
              placeholder="Decisões tomadas, próximos passos..."
            />
          </div>
        )}

        <label className="toggle-row" style={{ marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={form.visible_to_client ?? false}
            onChange={(e) => update({ visible_to_client: e.target.checked })}
          />
          Visível para o cliente na linha do tempo do evento
        </label>

        {form.id && form.supplier_id && (
          <div className="admin-card" style={{ background: "var(--cream-alt)", marginBottom: 16 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Convite ao fornecedor</p>
            {inviteUrl ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input className="field-input" readOnly value={inviteUrl} style={{ flex: 1, minWidth: 200 }} />
                <button
                  type="button"
                  className="admin-btn admin-btn-line admin-btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl);
                    toast.success("Link copiado.");
                  }}
                >
                  Copiar
                </button>
                {form.supplier_confirmed_at && (
                  <span className="status-badge status-confirmado">Confirmado</span>
                )}
              </div>
            ) : (
              <button type="button" className="admin-btn admin-btn-line admin-btn-sm" onClick={generateInvite} disabled={generatingInvite}>
                {generatingInvite ? "Gerando..." : "Gerar link de convite (sem login)"}
              </button>
            )}
          </div>
        )}

        <div className="modal-actions">
          {form.id && (
            <button type="button" className="admin-btn admin-btn-danger" style={{ marginRight: "auto" }} onClick={remove}>
              Apagar
            </button>
          )}
          <button type="button" className="admin-btn admin-btn-line" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="admin-btn admin-btn-gold" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
