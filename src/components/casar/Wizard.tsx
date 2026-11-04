"use client";

import { useEffect, useState } from "react";
import { THEMES } from "@/lib/casar/themes";
import { GIFT_TEMPLATES, isValidSlug, SECTION_LABELS, slugify, WIZARD_SECTIONS, type GiftTemplateId, type SectionId } from "@/lib/casar/types";
import ThemeCard from "./ThemeCard";
import { api, Field, Icon } from "./ui";

const TOTAL_STEPS = 5;
const STEP_ART = ["/images/casar/art-1.jpg", "/images/casar/art-2.jpg", "/images/casar/art-3.jpg"];

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [date, setDate] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugState, setSlugState] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const [sections, setSections] = useState<SectionId[]>([]);
  const [skipSections, setSkipSections] = useState(false);
  const [template, setTemplate] = useState<GiftTemplateId | null>(null);
  const [created, setCreated] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [host, setHost] = useState("");

  useEffect(() => setHost(`${window.location.host}/lp-casar/`), []);

  const suggestion = slugify(`${name1} e ${name2}`);
  const currentSlug = slugEdited ? slug : name1 && name2 ? suggestion : "";

  // Confere o link enquanto digitam, esperando uma pausa para não consultar a cada tecla.
  useEffect(() => {
    if (!isValidSlug(currentSlug)) return;
    let active = true;
    const timer = setTimeout(() => {
      setSlugState("checking");
      void api<{ available: boolean }>(`/api/casar/slug?slug=${currentSlug}`, "GET").then(({ available }) => {
        if (active) setSlugState(available ? "free" : "taken");
      });
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentSlug]);

  const slugOk = isValidSlug(currentSlug) && slugState === "free";

  const finish = async (themeId: string) => {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ slug: string }>("/api/casar/site", "POST", {
        slug: currentSlug,
        name1,
        name2,
        date,
        sections: skipSections ? null : sections,
        giftTemplate: template,
        themeId,
      });
      setCreated(result.slug);
      setStep(4);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const progress = <div className="lc-progress" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step + 1}><i style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} /></div>;

  if (step === 3) {
    return (
      <main className="lc-root lc-wizard-wide">
        {progress}
        <div className="lc-wizard-head">
          <button type="button" className="lc-back" onClick={() => setStep(2)}><Icon name="left" size={16} /> Voltar</button>
          <h1>Por fim, escolham um tema para o site</h1>
          <p>Separamos nossos temas favoritos. Vocês podem trocar de tema e ajustar as cores sempre que quiserem.</p>
          {error && <p className="lc-error" role="alert">{error}</p>}
        </div>
        <div className="lc-theme-grid">
          {THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              name1={name1}
              name2={name2}
              action={<button type="button" className="lc-btn" disabled={busy} onClick={() => void finish(theme.id)}>Usar este modelo</button>}
            />
          ))}
        </div>
      </main>
    );
  }

  if (step === 4) {
    return (
      <main className="lc-root lc-done">
        {progress}
        <div className="lc-done-box">
          <span className="lc-done-mark" aria-hidden="true"><Icon name="heart" size={30} /></span>
          <h1>O site de vocês já está no ar!</h1>
          <a className="lc-done-link" href={`/lp-casar/${created}`} target="_blank" rel="noopener noreferrer">{host}{created}</a>
          <p>Agora é só deixar com a cara de vocês e compartilhar o link com os convidados.</p>
          <a className="lc-btn" href="/lp-casar/painel">Concluir</a>
        </div>
      </main>
    );
  }

  return (
    <main className="lc-root lc-split">
      {progress}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="lc-split-art"><img src={STEP_ART[step]} alt="" /></div>
      <div className="lc-split-body">
        {step === 0 && (
          <div className="lc-step-box">
            <p className="lc-step-lead">Vamos criar juntos o site do casamento de vocês. Para começar, que tal escolher um link especial?</p>
            <div className="lc-link-card">
              <div className="lc-row-2">
                <Field label="Nome de um" required maxLength={60} value={name1} onChange={(e) => setName1(e.target.value)} />
                <Field label="Nome do outro" required maxLength={60} value={name2} onChange={(e) => setName2(e.target.value)} />
              </div>
              <Field label="Data do casamento" hint="Pode definir depois." type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <label className="lc-field">
                <span>Este será o link que vocês compartilharão com os convidados</span>
                <div className="lc-slug-input">
                  <em>{host}</em>
                  <input
                    aria-label="Endereço do site"
                    value={currentSlug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(slugify(e.target.value));
                    }}
                  />
                </div>
              </label>
              <p className={`lc-slug-state${slugState === "taken" ? " is-bad" : ""}`} role="status">
                {currentSlug && !isValidSlug(currentSlug) && "Use ao menos 3 letras ou números."}
                {isValidSlug(currentSlug) && slugState === "free" && "Este link está disponível."}
                {isValidSlug(currentSlug) && slugState === "taken" && "Este link já está em uso. Tente outro."}
              </p>
            </div>
            <button type="button" className="lc-btn" disabled={!slugOk || !name1.trim() || !name2.trim()} onClick={() => setStep(1)}>Avançar</button>
          </div>
        )}

        {step === 1 && (
          <div className="lc-step-box">
            <h1>E o que gostariam de comunicar no site?</h1>
            <p className="lc-muted">É possível selecionar mais de uma opção.</p>
            <div className="lc-options">
              {WIZARD_SECTIONS.map((id) => (
                <label key={id} className={`lc-option${sections.includes(id) ? " is-on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={sections.includes(id)}
                    onChange={(e) => setSections(e.target.checked ? [...sections, id] : sections.filter((item) => item !== id))}
                  />
                  <span>{SECTION_LABELS[id]}</span>
                </label>
              ))}
            </div>
            <button type="button" className="lc-btn" disabled={!sections.length} onClick={() => { setSkipSections(false); setStep(2); }}>Avançar</button>
            <button type="button" className="lc-text-btn" onClick={() => { setSkipSections(true); setStep(2); }}>Pular etapa</button>
            <button type="button" className="lc-back" onClick={() => setStep(0)}><Icon name="left" size={16} /> Voltar</button>
          </div>
        )}

        {step === 2 && (
          <div className="lc-step-box">
            <h1>Agora sobre a lista de presentes</h1>
            <p className="lc-muted">Quais presentes virtuais vocês gostariam de exibir?</p>
            <div className="lc-options" role="radiogroup" aria-label="Modelo da lista de presentes">
              {(Object.keys(GIFT_TEMPLATES) as GiftTemplateId[]).map((id) => (
                <label key={id} className={`lc-option lc-option-emoji${template === id ? " is-on" : ""}`}>
                  <input type="radio" name="template" checked={template === id} onChange={() => setTemplate(id)} />
                  <b aria-hidden="true">{GIFT_TEMPLATES[id].emoji}</b>
                  <span>{GIFT_TEMPLATES[id].label}</span>
                </label>
              ))}
            </div>
            <button type="button" className="lc-btn" disabled={!template} onClick={() => setStep(3)}>Avançar</button>
            <button type="button" className="lc-text-btn" onClick={() => { setTemplate(null); setStep(3); }}>Pular etapa</button>
            <button type="button" className="lc-back" onClick={() => setStep(1)}><Icon name="left" size={16} /> Voltar</button>
          </div>
        )}
      </div>
    </main>
  );
}
