import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Formata uma data ISO (yyyy-mm-dd ou timestamp) no padrão brasileiro. */
export function formatDate(value: string | null | undefined, pattern = "dd/MM/yyyy"): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), pattern, { locale: ptBR });
  } catch {
    return value;
  }
}

/** Formata data + hora. */
export function formatDateTime(value: string | null | undefined): string {
  return formatDate(value, "dd/MM/yyyy 'às' HH:mm");
}

/** Junta classes condicionalmente (equivalente simples ao "clsx"). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  fechado: "Fechado",
};
