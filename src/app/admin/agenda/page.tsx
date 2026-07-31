"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import type { AgendaItemRow, AgendaStatus, EventRow, StaffRow, SupplierRow } from "@/lib/types";
import { AGENDA_CATEGORIES, AGENDA_CATEGORY_COLORS, AGENDA_CATEGORY_LABELS, AGENDA_STATUS_LABELS, isOverdue } from "@/lib/agendaCategories";
import { formatDateTime } from "@/lib/utils";
import AgendaItemModal, { emptyAgendaItem, type AgendaItemDraft } from "@/components/admin/AgendaItemModal";
import Modal from "@/components/admin/Modal";
import AdminTabs from "@/components/admin/AdminTabs";
import { ToastProvider, useToast } from "@/components/admin/Toast";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const KANBAN_COLUMNS: { id: AgendaStatus | "atrasado"; label: string }[] = [
  { id: "pendente", label: "Pendente" },
  { id: "em_andamento", label: "Em Andamento" },
  { id: "concluido", label: "Concluído" },
  { id: "atrasado", label: "Atrasado" },
];

function AgendaPageContent() {
  const supabase = createClient();
  const toast = useToast();

  const [tab, setTab] = useState<"calendario" | "kanban">("calendario");
  const [items, setItems] = useState<AgendaItemRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(() => new Date());
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<AgendaItemDraft | null>(null);
  const [dayModal, setDayModal] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    const [itemsRes, eventsRes, staffRes, suppliersRes] = await Promise.all([
      supabase.from("agenda_items").select("*").order("start_at", { ascending: true }),
      supabase.from("events").select("*").order("title", { ascending: true }),
      supabase.from("staff").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase.from("suppliers").select("*").eq("is_active", true).order("name", { ascending: true }),
    ]);
    setItems((itemsRes.data as AgendaItemRow[]) ?? []);
    setEvents((eventsRes.data as EventRow[]) ?? []);
    setStaff((staffRes.data as StaffRow[]) ?? []);
    setSuppliers((suppliersRes.data as SupplierRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (categoryFilter !== "todas" && i.category !== categoryFilter) return false;
      if (responsibleFilter !== "todos" && i.responsible_id !== responsibleFilter) return false;
      return true;
    });
  }, [items, categoryFilter, responsibleFilter]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { locale: ptBR });
    const end = endOfWeek(endOfMonth(month), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, AgendaItemRow[]>();
    for (const item of filteredItems) {
      const key = item.start_at.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [filteredItems]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    const in7days = now + 7 * 86400000;
    return filteredItems
      .filter((i) => {
        const t = new Date(i.start_at).getTime();
        return t <= in7days;
      })
      .sort((a, b) => {
        const aOverdue = isOverdue(a.status, a.start_at) || a.category === "dia_evento";
        const bOverdue = isOverdue(b.status, b.start_at) || b.category === "dia_evento";
        if (a.category === "dia_evento" && b.category !== "dia_evento") return -1;
        if (b.category === "dia_evento" && a.category !== "dia_evento") return 1;
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
      })
      .slice(0, 10);
  }, [filteredItems]);

  function openCreate(preset?: Partial<AgendaItemDraft>) {
    setModalItem(emptyAgendaItem(preset));
    setModalOpen(true);
    setDayModal(null);
  }
  function openEdit(item: AgendaItemRow) {
    setModalItem(item);
    setModalOpen(true);
    setDayModal(null);
  }
  function closeModal() {
    setModalOpen(false);
    setModalItem(null);
  }
  function afterSaved() {
    closeModal();
    load();
  }

  async function changeStatus(id: string, status: AgendaStatus) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    const { error } = await supabase.from("agenda_items").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    }
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Agenda</h1>
          <p>Compromissos, prazos e o dia de cada evento — de toda a equipe</p>
        </div>
        <button className="admin-btn admin-btn-gold" onClick={() => openCreate()}>
          + Novo compromisso
        </button>
      </div>

      <div className="agenda-legend">
        {AGENDA_CATEGORIES.map((c) => (
          <span key={c.value} className="agenda-chip">
            <span className="agenda-dot" style={{ ["--dotcolor" as string]: c.color }} />
            {c.label}
          </span>
        ))}
      </div>

      <div className="agenda-toolbar">
        <div className="agenda-filters">
          <select className="field-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="todas">Todas as categorias</option>
            {AGENDA_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select className="field-select" value={responsibleFilter} onChange={(e) => setResponsibleFilter(e.target.value)}>
            <option value="todos">Toda a equipe</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {tab === "calendario" && (
          <div className="agenda-month-nav">
            <button onClick={() => setMonth((m) => subMonths(m, 1))} aria-label="Mês anterior">
              ‹
            </button>
            <h2>{format(month, "MMMM 'de' yyyy", { locale: ptBR })}</h2>
            <button onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Próximo mês">
              ›
            </button>
          </div>
        )}
      </div>

      <AdminTabs
        tabs={[
          { id: "calendario", label: "Visão Geral" },
          { id: "kanban", label: "Kanban de Prazos" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as "calendario" | "kanban")}
      >
      {loading ? (
        <div className="empty-state">Carregando...</div>
      ) : tab === "calendario" ? (
        <div className="agenda-layout">
          <div className="agenda-month-grid">
            {WEEKDAYS.map((w) => (
              <div className="agenda-weekday" key={w}>
                {w}
              </div>
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayItems = itemsByDay.get(key) ?? [];
              const visible = dayItems.slice(0, 3);
              const extra = dayItems.length - visible.length;
              return (
                <div
                  key={key}
                  className={`agenda-day ${!isSameMonth(day, month) ? "other-month" : ""} ${isToday(day) ? "today" : ""}`}
                  onDoubleClick={() => openCreate({ start_at: `${key}T09:00` })}
                >
                  <span className="agenda-day-num">{format(day, "d")}</span>
                  <div className="agenda-day-items">
                    {visible.map((item) => (
                      <div
                        key={item.id}
                        className="agenda-item-pill"
                        style={{ ["--dotcolor" as string]: AGENDA_CATEGORY_COLORS[item.category] }}
                        onClick={() => openEdit(item)}
                        title={item.title}
                      >
                        {item.title}
                      </div>
                    ))}
                    {extra > 0 && (
                      <button className="agenda-day-more" onClick={() => setDayModal(day)}>
                        +{extra} mais
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="agenda-side">
            <div className="admin-card">
              <h2>Hoje &amp; Próximos 7 dias</h2>
              {upcoming.length === 0 && <div className="empty-state">Nada por aqui.</div>}
              {upcoming.map((item) => {
                const overdue = isOverdue(item.status, item.start_at);
                return (
                  <div key={item.id} className={`agenda-side-item ${overdue ? "overdue" : ""}`} onClick={() => openEdit(item)}>
                    <span className="agenda-dot" style={{ ["--dotcolor" as string]: AGENDA_CATEGORY_COLORS[item.category] }} />
                    <div>
                      <b>{item.title}</b>
                      <span>
                        {formatDateTime(item.start_at)}
                        {item.event_id && eventsById.get(item.event_id) ? ` · ${eventsById.get(item.event_id)!.title}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <LayoutGroup>
          <div className="kanban-board">
            {KANBAN_COLUMNS.map((col) => {
              const colItems = filteredItems.filter((i) => {
                const overdue = isOverdue(i.status, i.start_at);
                if (col.id === "atrasado") return overdue;
                return i.status === col.id && !overdue;
              });
              return (
                <div className="kanban-column" key={col.id}>
                  <h3>
                    {col.label} <span className="count">{colItems.length}</span>
                  </h3>
                  {colItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      layoutId={item.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: [0.16, 0.84, 0.36, 1] }}
                      className="kanban-card agenda-kanban-card"
                      onClick={() => openEdit(item)}
                    >
                      <span className="agenda-chip">
                        <span className="agenda-dot" style={{ ["--dotcolor" as string]: AGENDA_CATEGORY_COLORS[item.category] }} />
                        {AGENDA_CATEGORY_LABELS[item.category]}
                      </span>
                      <div className="name">{item.title}</div>
                      <div className="meta-line">
                        {formatDateTime(item.start_at)}
                        {item.responsible_id && staffById.get(item.responsible_id) ? ` · ${staffById.get(item.responsible_id)!.name}` : ""}
                      </div>
                      <div className="actions" onClick={(e) => e.stopPropagation()}>
                        <select
                          className="field-select"
                          style={{ fontSize: 12, padding: "4px 8px" }}
                          value={item.status}
                          onChange={(e) => changeStatus(item.id, e.target.value as AgendaStatus)}
                        >
                          {Object.entries(AGENDA_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  ))}
                  {colItems.length === 0 && (
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
      </AdminTabs>

      <AgendaItemModal
        open={modalOpen}
        item={modalItem}
        events={events}
        staff={staff}
        suppliers={suppliers}
        onClose={closeModal}
        onSaved={afterSaved}
        onDeleted={afterSaved}
      />

      <Modal open={!!dayModal} onClose={() => setDayModal(null)} title={dayModal ? format(dayModal, "d 'de' MMMM", { locale: ptBR }) : ""}>
        {dayModal && (
          <div>
            {(itemsByDay.get(format(dayModal, "yyyy-MM-dd")) ?? []).map((item) => (
              <div key={item.id} className="agenda-side-item" onClick={() => openEdit(item)}>
                <span className="agenda-dot" style={{ ["--dotcolor" as string]: AGENDA_CATEGORY_COLORS[item.category] }} />
                <div>
                  <b>{item.title}</b>
                  <span>{format(parseISO(item.start_at), "HH:mm")}</span>
                </div>
              </div>
            ))}
            <div className="modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn-gold"
                onClick={() => openCreate({ start_at: `${format(dayModal, "yyyy-MM-dd")}T09:00` })}
              >
                + Novo neste dia
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function AgendaPage() {
  return (
    <ToastProvider>
      <AgendaPageContent />
    </ToastProvider>
  );
}
