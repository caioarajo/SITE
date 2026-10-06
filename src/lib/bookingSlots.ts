// Regras de agendamento de reunião: horário comercial fixo em Manaus (UTC-4,
// sem horário de verão), reuniões de 1 hora, segunda a sábado.

export const TZ_OFFSET = "-04:00";
export const SLOT_MINUTES = 60;
export const OPEN_HOUR = 9;
export const LAST_SLOT_HOUR = 17;
export const BOOKING_WINDOW_DAYS = 60;

export const BOOKING_EVENT_TYPES = [
  "Casamento",
  "15 anos",
  "Formatura",
  "Empresarial",
  "Infantil",
  "Outro",
] as const;

export type Busy = { start: Date; end: Date };

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00${TZ_OFFSET}`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value.slice(0, 4));
}

/** Dia da semana no fuso de Manaus (0 = domingo). */
export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00${TZ_OFFSET}`).getUTCDay();
}

export function isBookableDay(dateStr: string, now: Date = new Date()): boolean {
  if (!isValidDateString(dateStr)) return false;
  if (weekdayOf(dateStr) === 0) return false;
  const todayInManaus = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (dateStr <= todayInManaus) return false;
  const last = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return dateStr <= last;
}

export function slotDate(dateStr: string, hhmm: string): Date {
  return new Date(`${dateStr}T${hhmm}:00${TZ_OFFSET}`);
}

export function allSlotTimes(): string[] {
  const times: string[] = [];
  for (let minutes = OPEN_HOUR * 60; minutes <= LAST_SLOT_HOUR * 60; minutes += SLOT_MINUTES) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    times.push(`${h}:${m}`);
  }
  return times;
}

/** Horários livres de um dia, descartando os que se sobrepõem a algo já
 * agendado (qualquer item do dia inteiro bloqueia o dia todo). */
export function freeSlots(dateStr: string, busy: Busy[], now: Date = new Date()): string[] {
  const dayBlocked = busy.some((b) => b.start.getTime() === b.end.getTime());
  if (dayBlocked) return [];
  return allSlotTimes().filter((hhmm) => {
    const start = slotDate(dateStr, hhmm);
    if (start.getTime() <= now.getTime()) return false;
    const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
    return !busy.some((b) => start < b.end && b.start < end);
  });
}
