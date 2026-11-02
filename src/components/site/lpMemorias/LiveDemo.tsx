"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

// Simulação da página de vendas: roda só no navegador, sem enviar nem salvar nada.
// Cada troca no telão vem de um clique do visitante, nunca de rolagem automática.

const SAMPLES = [
  { src: "/images/portfolio-02.jpg", name: "Marina", caption: "Que festa linda!" },
  { src: "/images/portfolio-05.jpg", name: "Tio Carlos", caption: "Vivam os noivos!" },
  { src: "/images/hero-couple.jpg", name: "Prima Clara", caption: "Muito amor nesse dia" },
  { src: "/images/portfolio-03.jpg", name: "Rafael", caption: "Melhor pista do ano" },
  { src: "/images/portfolio-06.jpg", name: "Dani", caption: "Emocionada aqui" },
  { src: "/images/portfolio-07.jpg", name: "Vó Lourdes", caption: "Que Deus abençoe" },
];

type Layout = "cinema" | "mosaico" | "polaroid";
const LAYOUTS: { key: Layout; label: string }[] = [
  { key: "cinema", label: "Cinema" },
  { key: "mosaico", label: "Mosaico" },
  { key: "polaroid", label: "Polaroid" },
];

export default function LiveDemo() {
  const [sent, setSent] = useState<number[]>([]);
  const [pending, setPending] = useState<number[]>([]);
  const [approved, setApproved] = useState<number[]>([]);
  const [hidden, setHidden] = useState<number[]>([]);
  const [auto, setAuto] = useState(false);
  const [paused, setPaused] = useState(false);
  const [layout, setLayout] = useState<Layout>("cinema");
  const [hearts, setHearts] = useState<number[]>([]);

  const send = (i: number) => {
    if (sent.includes(i)) return;
    setSent((s) => [...s, i]);
    if (auto) setApproved((a) => [...a, i]);
    else setPending((p) => [...p, i]);
  };
  const approve = (i: number) => {
    setPending((p) => p.filter((x) => x !== i));
    setApproved((a) => [...a, i]);
  };
  const hide = (i: number) => {
    setPending((p) => p.filter((x) => x !== i));
    setApproved((a) => a.filter((x) => x !== i));
    setHidden((h) => [...h, i]);
  };
  const like = () => {
    const id = Date.now();
    setHearts((h) => [...h, id]);
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 2200);
  };
  const reset = () => {
    setSent([]);
    setPending([]);
    setApproved([]);
    setHidden([]);
    setAuto(false);
    setPaused(false);
    setHearts([]);
  };

  const current = approved[approved.length - 1];

  return (
    <div className="fv-demo">
      <div className="fv-demo-col">
        <p className="fv-demo-label"><span>1</span> Celular do convidado</p>
        <div className="fv-demo-phone">
          <p className="fv-demo-phone-title serif">Ana &amp; Pedro</p>
          <p className="fv-demo-hint">Toque em uma foto para enviar</p>
          <ul className="fv-demo-thumbs">
            {SAMPLES.map((s, i) => (
              <li key={s.src}>
                <button type="button" disabled={sent.includes(i)} onClick={() => send(i)} aria-label={`Enviar a foto de ${s.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt="" loading="lazy" />
                  {sent.includes(i) && <span>Enviada</span>}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="fv-demo-like" disabled={!approved.length} onClick={like}>♥ Curtir a foto do telão</button>
        </div>
      </div>

      <div className="fv-demo-col">
        <p className="fv-demo-label"><span>2</span> Painel de aprovação</p>
        <div className="fv-demo-panel">
          <label className="fv-demo-toggle">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            Publicar sem aprovação
          </label>
          {pending.length === 0 ? (
            <p className="fv-demo-empty">{sent.length ? "Nenhuma foto aguardando." : "As fotos enviadas chegam aqui."}</p>
          ) : (
            <ul className="fv-demo-queue">
              {pending.map((i) => (
                <li key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={SAMPLES[i].src} alt="" />
                  <div>
                    <p>{SAMPLES[i].name}</p>
                    <div className="fv-demo-queue-actions">
                      <button type="button" className="is-primary" onClick={() => approve(i)}>Aprovar</button>
                      <button type="button" onClick={() => hide(i)}>Ocultar</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {approved.length > 0 && (
            <button type="button" className="fv-demo-link" onClick={() => hide(current)}>Tirar a foto atual do telão</button>
          )}
          <p className="fv-demo-count">No telão: {approved.length} · Ocultas: {hidden.length}</p>
        </div>
      </div>

      <div className="fv-demo-col fv-demo-col-wide">
        <p className="fv-demo-label"><span>3</span> Telão da festa</p>
        <div className="fv-demo-wall" data-testid="demo-wall">
          {paused ? (
            <div className="fv-demo-idle">
              <p className="serif">Ana &amp; Pedro</p>
              <small>Já voltamos com as fotos de vocês</small>
            </div>
          ) : approved.length === 0 ? (
            <div className="fv-demo-idle">
              <p className="serif">Ana &amp; Pedro</p>
              <small>Seja o primeiro a aparecer aqui</small>
            </div>
          ) : layout === "cinema" ? (
            <AnimatePresence initial={false}>
              <motion.div key={current} className="fv-demo-cinema" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="fv-demo-bg" src={SAMPLES[current].src} alt="" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="fv-demo-photo" src={SAMPLES[current].src} alt={`Foto enviada por ${SAMPLES[current].name}`} />
                <div className="fv-demo-credit">
                  <p>{SAMPLES[current].caption}</p>
                  <small>{SAMPLES[current].name}</small>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : layout === "mosaico" ? (
            <div className="fv-demo-mosaic" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(approved.length, 1))}, 1fr)` }}>
              {approved.map((i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={SAMPLES[i].src} alt={`Foto enviada por ${SAMPLES[i].name}`} />
              ))}
            </div>
          ) : (
            <div className="fv-demo-board">
              {approved.map((i, n) => (
                <motion.figure
                  key={i}
                  initial={{ opacity: 0, scale: 1.4 }}
                  animate={{ opacity: 1, scale: 1, rotate: ((i * 7) % 11) - 5 }}
                  style={{ left: `${4 + (n % 3) * 32}%`, top: `${n >= 3 ? 50 : 6}%` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={SAMPLES[i].src} alt={`Foto enviada por ${SAMPLES[i].name}`} />
                  <figcaption>{SAMPLES[i].name}</figcaption>
                </motion.figure>
              ))}
            </div>
          )}
          {hearts.map((id) => (
            <span key={id} className="fv-demo-heart" style={{ left: `${15 + (id % 70)}%` }} aria-hidden="true">♥</span>
          ))}
        </div>
        <div className="fv-demo-controls">
          <div role="radiogroup" aria-label="Estilo do telão" className="fv-demo-layouts">
            {LAYOUTS.map((l) => (
              <button key={l.key} type="button" role="radio" aria-checked={layout === l.key} className={layout === l.key ? "is-on" : ""} onClick={() => setLayout(l.key)}>
                {l.label}
              </button>
            ))}
          </div>
          <button type="button" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>{paused ? "Retomar telão" : "Pausar telão"}</button>
          <button type="button" onClick={reset}>Recomeçar</button>
        </div>
      </div>
    </div>
  );
}
