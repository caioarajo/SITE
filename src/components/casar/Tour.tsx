"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "./ui";

export type TourStep = {
  /** Valor de data-tour do elemento em destaque. Sem alvo: janela centralizada. */
  target?: string;
  /** Prepara a tela antes do destaque, como abrir o menu lateral. */
  prepare?: () => void;
  icon: string;
  title: string;
  body: React.ReactNode;
};

export default function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const last = index === steps.length - 1;
  const numbered = steps.filter((item) => item.target);
  const position = step.target ? numbered.indexOf(step) + 1 : 0;

  useLayoutEffect(() => {
    step.prepare?.();
    // Espera o layout assentar depois de abrir ou fechar o menu.
    const timer = setTimeout(() => {
      const element = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      element?.scrollIntoView({ block: "nearest" });
      setRect(element ? element.getBoundingClientRect() : null);
    }, 60);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    card.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose]);

  let cardStyle: CSSProperties = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  if (rect && window.innerWidth > 720) {
    const width = 420;
    const roomRight = window.innerWidth - rect.right;
    const left = roomRight >= width + 24 ? rect.right + 16 : Math.max(16, rect.right - width);
    const below = roomRight >= width + 24 ? rect.top : rect.bottom + 14;
    cardStyle = { left, top: Math.min(Math.max(16, below), window.innerHeight - 340), transform: "none" };
  }

  return (
    <div className="lc-tour" role="dialog" aria-modal="true" aria-label="Tutorial do painel">
      {rect ? (
        <div className="lc-tour-spot" style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }} />
      ) : (
        <div className="lc-tour-dim" />
      )}
      <div ref={card} tabIndex={-1} className={`lc-tour-card${step.target ? "" : " is-center"}`} style={cardStyle}>
        <button type="button" className="lc-tour-close" aria-label="Fechar tutorial" onClick={onClose}><Icon name="close" /></button>
        <div className="lc-tour-art"><Icon name={step.icon} size={44} /></div>
        <div className="lc-tour-title">
          <h2>{step.title}</h2>
          {position > 0 && <small>{position}/{numbered.length}</small>}
        </div>
        <div className="lc-tour-body">{step.body}</div>
        <div className="lc-tour-actions">
          {index > 0 ? <button type="button" className="lc-text-btn" onClick={() => setIndex(index - 1)}>Anterior</button> : <span />}
          <button type="button" className="lc-btn lc-btn-sm" onClick={() => (last ? onClose() : setIndex(index + 1))}>
            {index === 0 ? "Começar tour" : last ? "Finalizar tour" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
