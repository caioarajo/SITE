import type { EventCategory, EventRecordStatus } from "@/lib/types";

/** Rótulos de tipo e status de evento — única fonte de verdade, reaproveitada
 * em qualquer tela do admin que precise exibir ou listar eventos. */
export const EVENT_TYPE_LABELS: Record<EventCategory, string> = {
  casamento: "Casamento",
  debutante: "15 anos",
  formatura: "Formatura",
  corporativo: "Corporativo",
  infantil: "Infantil",
  aniversario: "Aniversário",
  outro: "Outro",
};

export const EVENT_STATUS_LABELS: Record<EventRecordStatus, string> = {
  planejamento: "Planejamento",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};
