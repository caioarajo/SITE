"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { BOOKING_EVENT_TYPES, BOOKING_WINDOW_DAYS } from "@/lib/bookingSlots";
import Reveal from "./Reveal";
import DatePickerField from "./DatePickerField";

type Status = "idle" | "loadingSlots" | "submitting" | "done" | "error";

export default function BookingSection() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState<string>(BOOKING_EVENT_TYPES[0]);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmed, setConfirmed] = useState<{ date: string; time: string } | null>(null);

  async function loadSlots(day: string) {
    setStatus("loadingSlots");
    setSlots(null);
    setTime("");
    try {
      const res = await fetch(`/api/agendamento/disponibilidade?date=${day}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    }
    setStatus("idle");
  }

  useEffect(() => {
    if (date) loadSlots(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const today = startOfDay(new Date());
  const lastDay = addDays(today, BOOKING_WINDOW_DAYS);
  const isDayDisabled = (day: Date) => day.getDay() === 0 || day > lastDay || day < today;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/agendamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, date, time, eventType, message, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) await loadSlots(date);
        setErrorMsg(data.error ?? "Não foi possível agendar agora.");
        setStatus("error");
        return;
      }
      setConfirmed({ date, time });
      setStatus("done");
    } catch {
      setErrorMsg("Sem conexão no momento. Tente de novo em instantes.");
      setStatus("error");
    }
  }

  if (confirmed) {
    const [y, m, d] = confirmed.date.split("-");
    return (
      <section className="booking" id="agendar">
        <div className="wrap">
          <div className="booking-done">
            <h2 className="serif">Reunião solicitada</h2>
            <p>
              Recebemos seu pedido para <b>{d}/{m}/{y}</b> às <b>{confirmed.time}</b>. Vou confirmar o
              horário pelo WhatsApp em breve.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="booking" id="agendar">
      <div className="wrap">
        <Reveal className="section-head">
          <div className="eyebrow">Agende uma conversa</div>
          <h2 className="serif">Uma reunião de 1 hora, sem compromisso</h2>
          <p>Escolha o dia e o horário livre. Atendo de segunda a sábado, em horário comercial.</p>
        </Reveal>

        <div className="booking-grid">
          <div className="booking-step">
            <label className="field-label" htmlFor="booking-date">1. Dia</label>
            <DatePickerField id="booking-date" value={date} onChange={setDate} isDayDisabled={isDayDisabled} />
            {date && (
              <p className="booking-picked">
                Dia selecionado: {format(new Date(`${date}T12:00:00`), "dd/MM/yyyy")}
              </p>
            )}
          </div>

          <div className="booking-step">
            <span className="field-label">2. Horário</span>
            {!date && <p className="booking-hint">Escolha um dia para ver os horários livres.</p>}
            {date && status === "loadingSlots" && <p className="booking-hint">Carregando horários...</p>}
            {date && slots && slots.length === 0 && (
              <p className="booking-hint">Sem horários livres nesse dia. Tente outra data.</p>
            )}
            {date && slots && slots.length > 0 && (
              <div className="booking-slots">
                {slots.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={`booking-slot${time === s ? " selected" : ""}`}
                    onClick={() => setTime(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {date && time && (
          <form className="inquiry-form booking-form" onSubmit={submit}>
            <div className="row">
              <div className="field">
                <label htmlFor="b-name">Seu nome</label>
                <input id="b-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="b-phone">WhatsApp</label>
                <input
                  id="b-phone"
                  required
                  placeholder="(92) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="b-email">E-mail (opcional)</label>
                <input id="b-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="b-type">Tipo de evento</label>
                <select id="b-type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                  {BOOKING_EVENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="b-msg">Conte um pouco sobre o evento (opcional)</label>
              <textarea id="b-msg" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            {/* Honeypot: fica escondido de pessoas; bots costumam preencher. */}
            <div className="hp-field" aria-hidden="true">
              <label htmlFor="b-website">Site</label>
              <input id="b-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
              {status === "submitting" ? "Reservando..." : `Confirmar ${time} de ${format(new Date(`${date}T12:00:00`), "dd/MM")}`}
            </button>
          </form>
        )}
        {status === "error" && <p className="inquiry-note booking-error">{errorMsg}</p>}
      </div>
    </section>
  );
}
