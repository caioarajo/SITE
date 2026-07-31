import type { AgendaCategory, AgendaStatus, AgendaPriority } from "@/lib/types";
import { NAVY, GOLD, ROSE, ESPRESSO, SLATE, WINE } from "@/lib/chartColors";

export const AGENDA_CATEGORIES: { value: AgendaCategory; label: string; color: string }[] = [
  { value: "reuniao", label: "Reunião com Cliente", color: NAVY },
  { value: "visita_tecnica", label: "Visita Técnica", color: ESPRESSO },
  { value: "degustacao", label: "Degustação & Provas", color: ROSE },
  { value: "prazo_fornecedor", label: "Prazo de Fornecedor", color: GOLD },
  { value: "dia_evento", label: "Dia do Evento", color: WINE },
  { value: "interno", label: "Tarefa Interna", color: SLATE },
];

export const AGENDA_CATEGORY_LABELS: Record<AgendaCategory, string> = Object.fromEntries(
  AGENDA_CATEGORIES.map((c) => [c.value, c.label])
) as Record<AgendaCategory, string>;

export const AGENDA_CATEGORY_COLORS: Record<AgendaCategory, string> = Object.fromEntries(
  AGENDA_CATEGORIES.map((c) => [c.value, c.color])
) as Record<AgendaCategory, string>;

export const AGENDA_STATUS_LABELS: Record<AgendaStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
};

export const AGENDA_PRIORITY_LABELS: Record<AgendaPriority, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  critica: "Crítica",
};

/** "Atrasado" nunca é armazenado — é sempre calculado a partir de status
 * e data, para nunca ficar desatualizado. */
export function isOverdue(status: AgendaStatus, startAt: string): boolean {
  return status !== "concluido" && new Date(startAt).getTime() < Date.now();
}

/** Rótulo tipo "T-12 meses" / "T-1 semana" / "Dia do Evento" / "T+2 semanas"
 * a partir da distância em dias entre um compromisso e a data do evento. */
export function formatOffsetLabel(days: number): string {
  if (days === 0) return "Dia do Evento";
  const sign = days > 0 ? "+" : "-";
  const abs = Math.abs(days);
  if (abs >= 60) {
    const months = Math.round(abs / 30);
    return `T${sign}${months} ${months === 1 ? "mês" : "meses"}`;
  }
  if (abs >= 14) {
    const weeks = Math.round(abs / 7);
    return `T${sign}${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  }
  return `T${sign}${abs} ${abs === 1 ? "dia" : "dias"}`;
}
