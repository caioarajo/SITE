"use client";

import { motion } from "framer-motion";
import { PORTFOLIO_CATEGORIES } from "@/lib/portfolioCategories";
import { captureInstagramClick } from "@/lib/captureInstagramClick";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 0.84, 0.36, 1] as const } },
};

export default function InstagramBio({ whatsappNumber }: { whatsappNumber: string }) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Olá, Lia! Vim do Instagram e gostaria de saber mais sobre a assessoria para o meu evento."
  )}`;

  return (
    <main className="bio-page">
      <span className="spark float-spark gold" style={{ width: 18, height: 18, top: "10%", left: "10%" }}>
        <span className="twinkle-inner">
          <svg>
            <use href="#ic-spark" />
          </svg>
        </span>
      </span>
      <span className="spark float-spark" style={{ width: 14, height: 14, top: "82%", left: "88%" }}>
        <span className="twinkle-inner d3">
          <svg>
            <use href="#ic-spark" />
          </svg>
        </span>
      </span>

      <motion.div className="bio-card" variants={container} initial="hidden" animate="show">
        <motion.img variants={item} className="bio-logo" src="/logo-full-cream.png" alt="LP Assessoria e Cerimonial" />
        <motion.p variants={item} className="bio-tagline">
          Cerimonialista e assessora de eventos em Manaus
        </motion.p>

        <motion.a
          variants={item}
          className="bio-cta"
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={captureInstagramClick}
        >
          <svg viewBox="0 0 32 32" className="bio-cta-icon">
            <use href="#ic-wa" />
          </svg>
          Fale comigo no WhatsApp
        </motion.a>

        <motion.div variants={item} className="bio-section-label">
          Portfólio por segmento
        </motion.div>
        <motion.div variants={item} className="bio-chip-row">
          {PORTFOLIO_CATEGORIES.map((c) => (
            <a key={c.value} className="bio-chip" href={`/?album=${c.value}#portfolio`}>
              {c.label}
            </a>
          ))}
        </motion.div>

        <motion.a variants={item} className="bio-link" href="/#depoimentos">
          Depoimentos de noivos e clientes
        </motion.a>
        <motion.a variants={item} className="bio-link" href="/#contato">
          Preencher formulário de contato
        </motion.a>

        <motion.a variants={item} className="bio-back" href="/">
          Conhecer o site completo →
        </motion.a>
      </motion.div>
    </main>
  );
}
