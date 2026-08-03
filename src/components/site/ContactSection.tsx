"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import Reveal from "./Reveal";

interface Settings {
  phone: string;
  email: string;
  instagram: string;
  whatsapp: string;
}

export default function ContactSection({
  liaPhotoSrc,
  settings,
}: {
  liaPhotoSrc: string;
  settings: Settings;
}) {
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("Casamento");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("leads").insert({
        name,
        event_type: eventType,
        event_date: eventDate || null,
        message: message || null,
      });

      if (error) throw error;

      setStatus("sent");

      let text = `Olá, Lia! Meu nome é ${name || "—"}.`;
      text += ` Tenho interesse em assessoria para um evento do tipo: ${eventType}.`;
      if (eventDate) {
        const [y, m, d] = eventDate.split("-");
        text += ` Data prevista: ${d}/${m}/${y}.`;
      }
      if (message) text += ` Detalhes: ${message}`;

      const url = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <section className="contact" id="contato">
      <Reveal className="wrap">
        <div className="contact-photo-outer">
          <span className="contact-photo-mat" aria-hidden="true" />
          <div className="contact-photo">
            <img src={liaPhotoSrc} alt="Lia Pontes, cerimonialista e assessora de eventos, segurando um tablet" />
          </div>
        </div>
        <div className="contact-body">
          <div className="eyebrow">
            <span className="spark">
              <svg>
                <use href="#ic-spark" />
              </svg>
            </span>{" "}
            Contato
          </div>
          <h2 className="serif">
            Vamos planejar
            <br />o seu grande dia?
          </h2>
          <p className="lead">
            Conte um pouco sobre o seu evento e eu retorno com todos os detalhes do pacote ideal
            para vocês.
          </p>

          <div className="contact-links">
            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer">
              <span className="ic">
                <svg>
                  <use href="#ic-phone" />
                </svg>
              </span>{" "}
              {settings.phone}
            </a>
            <a href={`mailto:${settings.email}`}>
              <span className="ic">
                <svg>
                  <use href="#ic-mail" />
                </svg>
              </span>{" "}
              {settings.email}
            </a>
            <a href={`https://instagram.com/${settings.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
              <span className="ic">
                <svg>
                  <use href="#ic-insta" />
                </svg>
              </span>{" "}
              {settings.instagram}
            </a>
          </div>

          <form className="inquiry-form" onSubmit={handleSubmit}>
            <div className="row">
              <div className="field">
                <label htmlFor="f-name">Seu nome</label>
                <input
                  id="f-name"
                  type="text"
                  placeholder="Como posso te chamar?"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="f-date">Data do evento</label>
                <input id="f-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
            </div>
            <div className="row">
              <div className="field" style={{ gridColumn: "1/-1" }}>
                <label htmlFor="f-type">Tipo de evento</label>
                <select id="f-type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                  <option>Casamento</option>
                  <option>15 anos</option>
                  <option>Formatura</option>
                  <option>Empresarial</option>
                  <option>Infantil</option>
                  <option>Outro</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="f-msg">Conte um pouco sobre o evento</label>
              <textarea
                id="f-msg"
                placeholder="Local, número de convidados, estilo que vocês imaginam..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
              {status === "sending" ? "Enviando..." : "Enviar pelo WhatsApp"}
            </button>
            {status === "error" && (
              <p className="inquiry-note" style={{ color: "#b3311c" }}>
                Não consegui enviar agora. Tente novamente ou chame direto no WhatsApp acima.
              </p>
            )}
            {status === "sent" && (
              <p className="inquiry-note">Mensagem recebida! Abrindo o WhatsApp com os detalhes preenchidos...</p>
            )}
            {status === "idle" && (
              <p className="inquiry-note">
                Ao enviar, abriremos o WhatsApp com sua mensagem pronta para conferir e disparar.
              </p>
            )}
          </form>
        </div>
      </Reveal>
    </section>
  );
}
