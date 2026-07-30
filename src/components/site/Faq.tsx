"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FaqRow } from "@/lib/types";
import Reveal from "./Reveal";

export default function Faq({ faqs }: { faqs: FaqRow[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <section className="faq" id="faq">
      <div className="wrap">
        <Reveal className="section-head center">
          <div className="eyebrow">
            <span className="spark">
              <svg>
                <use href="#ic-spark" />
              </svg>
            </span>{" "}
            Perguntas frequentes
          </div>
          <h2 className="serif">Ainda com dúvidas?</h2>
          <p>As perguntas que mais recebo dos noivos antes de fechar a assessoria.</p>
        </Reveal>

        <Reveal className="faq-list">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className={`faq-item ${isOpen ? "is-open" : ""}`}>
                <button
                  className="faq-summary"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                >
                  {faq.question}
                  <span className="plus" />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="faq-a"
                      style={{ height: 0, overflow: "hidden" }}
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 0.84, 0.36, 1] }}
                    >
                      <div className="faq-a-inner">{faq.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
