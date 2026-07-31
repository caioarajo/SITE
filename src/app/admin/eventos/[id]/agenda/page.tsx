"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import type {
  AgendaItemRow,
  AgendaTemplateRow,
  AgendaTemplateItemRow,
  EventRow,
  StaffRow,
  SupplierRow,
} from "@/lib/types";
import { AGENDA_CATEGORY_COLORS, AGENDA_CATEGORY_LABELS, AGENDA_STATUS_LABELS, formatOffsetLabel, isOverdue } from "@/lib/agendaCategories";
import AgendaItemModal, { emptyAgendaItem, type AgendaItemDraft } from "@/components/admin/AgendaItemModal";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";

function EventoAgendaPageContent() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const supabase = createClient();
  const toast = useToast();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [items, setItems] = useState<AgendaItemRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [templates, setTemplates] = useState<AgendaTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<AgendaItemDraft | null>(null);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateItems, setTemplateItems] = useState<AgendaTemplateItemRow[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  async function load() {
    setLoading(true);
    const [eventRes, itemsRes, staffRes, suppliersRes, templatesRes] = await Promise.all([
      supabase.from("events").select("*").eq("id", eventId).single(),
      supabase.from("agenda_items").select("*").eq("event_id", eventId).order("start_at", { ascending: true }),
      supabase.from("staff").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase.from("suppliers").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase.from("agenda_templates").select("*").order("name", { ascending: true }),
    ]);
    setEvent((eventRes.data as EventRow) ?? null);
    setItems((itemsRes.data as AgendaItemRow[]) ?? []);
    setStaff((staffRes.data as StaffRow[]) ?? []);
    setSuppliers((suppliersRes.data as SupplierRow[]) ?? []);
    setTemplates((templatesRes.data as AgendaTemplateRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (eventId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);
  const hasTemplateItems = items.some((i) => i.template_item_id && i.status !== "concluido");

  function openCreate() {
    setModalItem(emptyAgendaItem({ event_id: eventId }));
    setModalOpen(true);
  }
  function openEdit(item: AgendaItemRow) {
    setModalItem(item);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setModalItem(null);
  }
  function afterSaved() {
    closeModal();
    load();
  }

  async function openTemplateModal() {
    if (!event?.event_date) {
      toast.error("Defina a data do evento antes de aplicar um template.");
      return;
    }
    const defaultTemplate = templates.find((t) => t.event_type === event.event_type) ?? templates[0];
    if (!defaultTemplate) {
      toast.error("Nenhum template disponível.");
      return;
    }
    await loadTemplateItems(defaultTemplate.id);
    setTemplateModalOpen(true);
  }

  async function loadTemplateItems(templateId: string) {
    setSelectedTemplateId(templateId);
    const { data } = await supabase
      .from("agenda_template_items")
      .select("*")
      .eq("template_id", templateId)
      .order("order_index", { ascending: true });
    const rows = (data as AgendaTemplateItemRow[]) ?? [];
    setTemplateItems(rows);
    setSelectedItemIds(new Set(rows.map((r) => r.id)));
  }

  function toggleTemplateItem(id: string) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyTemplate() {
    if (!event?.event_date) return;
    setApplyingTemplate(true);
    const eventDate = parseISO(event.event_date);
    const rows = templateItems
      .filter((ti) => selectedItemIds.has(ti.id))
      .map((ti) => ({
        event_id: eventId,
        client_id: event.client_id,
        responsible_id: null,
        title: ti.title,
        category: ti.category,
        start_at: `${format(addDays(eventDate, ti.offset_days), "yyyy-MM-dd")}T09:00:00`,
        all_day: true,
        priority: ti.category === "dia_evento" ? "critica" : "normal",
        status: "pendente",
        visible_to_client: ti.visible_to_client,
        template_id: selectedTemplateId,
        template_item_id: ti.id,
      }));

    const { error } = await supabase.from("agenda_items").insert(rows);
    setApplyingTemplate(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${rows.length} marcos adicionados à agenda deste evento.`);
    setTemplateModalOpen(false);
    load();
  }

  async function recalcularDatas() {
    if (!event?.event_date) return;
    setRecalculating(true);
    const eventDate = parseISO(event.event_date);
    const pending = items.filter((i) => i.template_item_id && i.status !== "concluido");

    const templateItemIds = pending.map((i) => i.template_item_id!);
    const { data: tplItemsData } = await supabase
      .from("agenda_template_items")
      .select("*")
      .in("id", templateItemIds);
    const offsetById = new Map(((tplItemsData as AgendaTemplateItemRow[]) ?? []).map((t) => [t.id, t.offset_days]));

    let updated = 0;
    for (const item of pending) {
      const offset = offsetById.get(item.template_item_id!);
      if (offset == null) continue;
      const newDate = `${format(addDays(eventDate, offset), "yyyy-MM-dd")}T09:00:00`;
      const { error } = await supabase.from("agenda_items").update({ start_at: newDate }).eq("id", item.id);
      if (!error) updated++;
    }
    setRecalculating(false);
    toast.success(`${updated} compromissos recalculados a partir da nova data do evento.`);
    load();
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Linha do Tempo — {event?.title ?? "Carregando..."}</h1>
          <p>Cronograma regressivo deste evento{event?.event_date ? ` · ${format(parseISO(event.event_date), "dd/MM/yyyy")}` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/eventos" className="admin-btn admin-btn-line">
            Voltar aos eventos
          </Link>
          {hasTemplateItems && (
            <button className="admin-btn admin-btn-line" onClick={recalcularDatas} disabled={recalculating}>
              {recalculating ? "Recalculando..." : "Recalcular Datas"}
            </button>
          )}
          <button className="admin-btn admin-btn-line" onClick={openTemplateModal}>
            Aplicar Template
          </button>
          <button className="admin-btn admin-btn-gold" onClick={openCreate}>
            + Novo compromisso
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          Nenhum compromisso ainda. Aplique um template ou crie o primeiro compromisso manualmente.
        </div>
      ) : (
        <div className="admin-card">
          <div className="event-timeline">
            {items.map((item) => {
              const offsetDays = event?.event_date
                ? differenceInCalendarDays(parseISO(item.start_at.slice(0, 10)), parseISO(event.event_date))
                : 0;
              const overdue = isOverdue(item.status, item.start_at);
              return (
                <div key={item.id} className={`timeline-row ${item.category === "dia_evento" ? "peak" : ""}`} style={{ ["--dotcolor" as string]: AGENDA_CATEGORY_COLORS[item.category] }}>
                  <div className="timeline-card" onClick={() => openEdit(item)}>
                    <div className="timeline-offset">{event?.event_date ? formatOffsetLabel(offsetDays) : format(parseISO(item.start_at), "dd/MM/yyyy")}</div>
                    <div className="timeline-title">{item.title}</div>
                    <div className="timeline-meta">
                      <span>{AGENDA_CATEGORY_LABELS[item.category]}</span>
                      <span>{format(parseISO(item.start_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      {item.responsible_id && staffById.get(item.responsible_id) && <span>{staffById.get(item.responsible_id)!.name}</span>}
                      <span className={`status-badge ${overdue ? "status-cancelado" : `status-${item.status === "concluido" ? "confirmado" : "planejamento"}`}`}>
                        {overdue ? "Atrasado" : AGENDA_STATUS_LABELS[item.status]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AgendaItemModal
        open={modalOpen}
        item={modalItem}
        events={event ? [event] : []}
        staff={staff}
        suppliers={suppliers}
        onClose={closeModal}
        onSaved={afterSaved}
        onDeleted={afterSaved}
      />

      <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} title="Aplicar Template de Cronograma" className="modal-lg">
        <div className="field-group">
          <label className="field-label">Template</label>
          <select className="field-select" value={selectedTemplateId} onChange={(e) => loadTemplateItems(e.target.value)}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--taupe-deep)", marginTop: -8, marginBottom: 14 }}>
          Desmarque os marcos que não se aplicam a este evento antes de confirmar.
        </p>
        <div className="table-wrap" style={{ maxHeight: 360, overflowY: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Quando</th>
                <th>Marco</th>
                <th>Categoria</th>
              </tr>
            </thead>
            <tbody>
              {templateItems.map((ti) => (
                <tr key={ti.id}>
                  <td>
                    <input type="checkbox" checked={selectedItemIds.has(ti.id)} onChange={() => toggleTemplateItem(ti.id)} />
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {formatOffsetLabel(ti.offset_days)}
                    {event?.event_date && (
                      <div style={{ fontSize: 11, color: "var(--taupe-deep)" }}>
                        {format(addDays(parseISO(event.event_date), ti.offset_days), "dd/MM/yyyy")}
                      </div>
                    )}
                  </td>
                  <td>{ti.title}</td>
                  <td>{AGENDA_CATEGORY_LABELS[ti.category]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-actions">
          <button type="button" className="admin-btn admin-btn-line" onClick={() => setTemplateModalOpen(false)}>
            Cancelar
          </button>
          <button type="button" className="admin-btn admin-btn-gold" onClick={applyTemplate} disabled={applyingTemplate || selectedItemIds.size === 0}>
            {applyingTemplate ? "Aplicando..." : `Aplicar ${selectedItemIds.size} marcos`}
          </button>
        </div>
      </Modal>
    </>
  );
}

export default function EventoAgendaPage() {
  return (
    <ToastProvider>
      <EventoAgendaPageContent />
    </ToastProvider>
  );
}
