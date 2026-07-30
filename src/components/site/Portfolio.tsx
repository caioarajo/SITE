"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PortfolioItemRow, PortfolioCategory } from "@/lib/types";
import { PORTFOLIO_CATEGORIES } from "@/lib/portfolioCategories";
import Reveal from "./Reveal";

// Mesmo layout de mosaico do site original: 7 posições com tamanhos
// variados. Se houver mais ou menos itens, o CSS grid flui normalmente.
const GRID_SPANS = ["gi-1", "gi-2", "gi-3", "gi-4", "gi-5", "gi-6", "gi-7"];

function readAlbumFromUrl(): PortfolioCategory | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("album");
  return (PORTFOLIO_CATEGORIES.find((c) => c.value === value)?.value as PortfolioCategory | undefined) ?? null;
}

export default function Portfolio({ items }: { items: PortfolioItemRow[] }) {
  const [category, setCategory] = useState<PortfolioCategory | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Permite abrir um álbum direto por link (?album=casamentos), sem
  // depender de useSearchParams (evita boundary de Suspense aqui).
  useEffect(() => {
    setCategory(readAlbumFromUrl());
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<PortfolioCategory, PortfolioItemRow[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  function openAlbum(cat: PortfolioCategory) {
    setCategory(cat);
    setActiveIndex(null);
    const url = new URL(window.location.href);
    url.searchParams.set("album", cat);
    window.history.pushState({}, "", url);
  }

  function closeAlbum() {
    setCategory(null);
    setActiveIndex(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("album");
    window.history.pushState({}, "", url);
  }

  const albumItems = category ? (grouped.get(category) ?? []) : [];
  const active = activeIndex !== null ? albumItems[activeIndex] : null;

  useEffect(() => {
    if (activeIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") setActiveIndex((i) => (i === null ? i : Math.min(i + 1, albumItems.length - 1)));
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, albumItems.length]);

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

        <AnimatePresence mode="wait">
          {!category ? (
            <motion.div
              key="segments"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Reveal className="segment-grid">
                {PORTFOLIO_CATEGORIES.map((c) => {
                  const catItems = grouped.get(c.value) ?? [];
                  const cover = catItems.find((i) => i.is_cover) ?? catItems[0];
                  const hasItems = catItems.length > 0;

                  return (
                    <div
                      key={c.value}
                      className={`segment-card ${!hasItems ? "empty" : ""}`}
                      onClick={() => hasItems && openAlbum(c.value)}
                      role={hasItems ? "button" : undefined}
                      tabIndex={hasItems ? 0 : undefined}
                      onKeyDown={(e) => hasItems && e.key === "Enter" && openAlbum(c.value)}
                    >
                      <div className="segment-thumb">
                        {cover ? (
                          cover.media_type === "video" ? (
                            <video src={cover.url} muted playsInline preload="metadata" />
                          ) : (
                            <img src={cover.url} alt={c.label} loading="lazy" />
                          )
                        ) : (
                          <div className="segment-thumb-placeholder">
                            <svg>
                              <use href="#ic-spark" />
                            </svg>
                          </div>
                        )}
                        {hasItems && <span className="segment-count">{catItems.length}</span>}
                      </div>
                      <div className="segment-label">{c.label}</div>
                      <button
                        className="segment-btn"
                        disabled={!hasItems}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasItems) openAlbum(c.value);
                        }}
                      >
                        {hasItems ? "Ver Álbum Completo" : "Em breve"}
                      </button>
                    </div>
                  );
                })}
              </Reveal>
            </motion.div>
          ) : (
            <motion.div
              key="album"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="album-header">
                <button className="album-back" onClick={closeAlbum}>
                  <svg>
                    <use href="#ic-chev" />
                  </svg>
                  Voltar aos álbuns
                </button>
                <h3 className="serif">{PORTFOLIO_CATEGORIES.find((c) => c.value === category)?.label}</h3>
                <span className="album-count">
                  {albumItems.length} {albumItems.length === 1 ? "registro" : "registros"}
                </span>
              </div>

              <div className="gallery">
                {albumItems.map((item, i) => (
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
                {albumItems.length === 0 && (
                  <div className="empty-state">Nenhum registro publicado neste álbum ainda.</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            {activeIndex !== null && activeIndex > 0 && (
              <button
                className="lightbox-nav prev"
                aria-label="Anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i === null ? i : i - 1));
                }}
              >
                <svg>
                  <use href="#ic-chev" />
                </svg>
              </button>
            )}
            {activeIndex !== null && activeIndex < albumItems.length - 1 && (
              <button
                className="lightbox-nav next"
                aria-label="Próxima"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i === null ? i : i + 1));
                }}
              >
                <svg>
                  <use href="#ic-chev" />
                </svg>
              </button>
            )}
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
