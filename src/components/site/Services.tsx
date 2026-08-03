"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ServiceRow } from "@/lib/types";
import Reveal, { RevealGroup, RevealItem } from "./Reveal";
import { captureWhatsappClick } from "@/lib/captureWhatsappClick";

function ServiceCard({ service, whatsappNumber }: { service: ServiceRow; whatsappNumber: string }) {
  const [expanded, setExpanded] = useState(false);
  const visible = service.features.slice(0, 4);
  const more = service.features.slice(4);

  return (
    <RevealItem className={`card ${service.is_featured ? "featured" : ""}`}>
      {service.is_featured && <span className="badge">Mais completo</span>}
      <div className="card-name">{service.name}</div>
      <p className="card-blurb">{service.tagline}</p>
      <div className="card-price">
        <b className="tbd">{service.price_label || "Sob consulta"}</b>
        <small>Valores personalizados para o seu evento</small>
      </div>

      <ul className="feat">
        {visible.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
        <AnimatePresence initial={false}>
          {expanded &&
            more.map((f, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: "hidden" }}
              >
                {f}
              </motion.li>
            ))}
        </AnimatePresence>
      </ul>

      {more.length > 0 && (
        <button className={`card-more ${expanded ? "open" : ""}`} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Ver menos " : "Ver detalhes completos "}
          <svg>
            <use href="#ic-chev" />
          </svg>
        </button>
      )}

      <a
        className={`btn ${service.is_featured ? "btn-primary" : "btn-line"}`}
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={captureWhatsappClick}
      >
        Quero esse pacote
      </a>
    </RevealItem>
  );
}

export default function Services({ services, whatsappNumber }: { services: ServiceRow[]; whatsappNumber: string }) {
  return (
    <section className="services" id="servicos">
      <div className="wrap">
        <Reveal className="section-head center">
          <div className="eyebrow">
            <span className="spark">
              <svg>
                <use href="#ic-spark" />
              </svg>
            </span>{" "}
            Serviços
          </div>
          <h2 className="serif">
            Um pacote para cada
            <br />
            momento do seu casamento
          </h2>
          <p>
            Três formas de te acompanhar — da primeira reunião com fornecedores até o último
            convidado ir embora.
          </p>
        </Reveal>

        <RevealGroup className="cards">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} whatsappNumber={whatsappNumber} />
          ))}
        </RevealGroup>

        <Reveal className="extras-row">
          <span className="ex-label">Valores extras</span>
          <span className="ex-item">Confirmação de presença</span>
          <span className="sep" />
          <span className="ex-item">Auxiliar extra</span>
        </Reveal>
      </div>
    </section>
  );
}
