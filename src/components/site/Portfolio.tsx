"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PortfolioItemRow } from "@/lib/types";
import Reveal from "./Reveal";

// Mesmo layout de mosaico do site original: 7 posições com tamanhos
// variados. Se houver mais ou menos itens, o CSS grid flui normalmente.
const GRID_SPANS = ["gi-1", "gi-2", "gi-3", "gi-4", "gi-5", "gi-6", "gi-7"];

export default function Portfolio({ items }: { items: PortfolioItemRow[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? items[activeIndex] : null;

  return (
    <section className="portfolio" id="portfolio">
      <div className="wrap">
        <Reveal className="section-head">
          <div className="eyebrow">
            <span className="spark">
              <svg>
                <use href="#ic-spark" />
              </svg>
            </span>{" "}
            Portfólio
          </div>
          <h2 className="serif">Trabalhos realizados</h2>
          <p>Alguns momentos que tive o privilégio de acompanhar de perto — cada casal, uma história diferente.</p>
        </Reveal>

        <Reveal className="gallery">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`gitem ${GRID_SPANS[i % GRID_SPANS.length]}`}
              onClick={() => setActiveIndex(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setActiveIndex(i)}
            >
              {item.media_type === "video" ? (
                <video src={item.url} muted playsInline preload="metadata" />
              ) : (
                <img src={item.url} alt={item.caption ?? item.title} loading="lazy" />
              )}
              <span className="zoom-icon">
                <svg>
                  <use href="#ic-zoom" />
                </svg>
              </span>
            </div>
          ))}
        </Reveal>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="lightbox open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveIndex(null)}
          >
            <button className="lightbox-close" onClick={() => setActiveIndex(null)} aria-label="Fechar">
              <svg>
                <use href="#ic-close" />
              </svg>
            </button>
            {active.media_type === "video" ? (
              <video src={active.url} controls autoPlay onClick={(e) => e.stopPropagation()} />
            ) : (
              <img src={active.url} alt={active.caption ?? active.title} onClick={(e) => e.stopPropagation()} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
