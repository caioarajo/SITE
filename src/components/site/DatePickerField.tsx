"use client";

import { useEffect, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function DatePickerField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : null;
  const [viewMonth, setViewMonth] = useState(() => selected ?? new Date());
  const wrapRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleOpen() {
    setOpen((o) => {
      if (!o) setViewMonth(selected ?? new Date());
      return !o;
    });
  }

  function pickDay(day: Date) {
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="date-field" ref={wrapRef}>
      <button
        type="button"
        id={id}
        className={`date-field-trigger${selected ? "" : " is-empty"}`}
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{selected ? format(selected, "dd/MM/yyyy") : "Selecionar data"}</span>
        <svg viewBox="0 0 24 24" className="date-field-icon">
          <use href="#ic-calendar" />
        </svg>
      </button>

      {open && (
        <div className="date-popover" role="dialog" aria-label="Selecionar data do evento">
          <div className="date-popover-head">
            <button type="button" onClick={() => setViewMonth((m) => subMonths(m, 1))} aria-label="Mês anterior">
              ‹
            </button>
            <span>{format(viewMonth, "MMMM yyyy", { locale: ptBR })}</span>
            <button type="button" onClick={() => setViewMonth((m) => addMonths(m, 1))} aria-label="Próximo mês">
              ›
            </button>
          </div>
          <div className="date-popover-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="date-popover-grid">
            {days.map((day) => {
              const disabled = isBefore(day, today);
              const outside = !isSameMonth(day, viewMonth);
              const isSelected = selected && isSameDay(day, selected);
              const isToday = isSameDay(day, today);
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  className={[
                    "date-popover-day",
                    outside && "outside",
                    isSelected && "selected",
                    isToday && !isSelected && "today",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={disabled}
                  onClick={() => pickDay(day)}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
          {selected && (
            <button type="button" className="date-popover-clear" onClick={() => onChange("")}>
              Limpar data
            </button>
          )}
        </div>
      )}
    </div>
  );
}
