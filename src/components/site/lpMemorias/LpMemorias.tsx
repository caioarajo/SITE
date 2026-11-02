"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { captureWhatsappClick } from "@/lib/captureWhatsappClick";
import { createClient } from "@/lib/supabase/client";
import Reveal from "../Reveal";
import { CHALLENGES, EVENT_TYPES, FAQS, FEATURE_GROUPS, PLANS, STEPS } from "./content";
import LiveDemo from "./LiveDemo";

interface Props {
  whatsapp: string;
  email: string;
  instagram: string;
  sampleQr: string;
}

const waLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

function Eyebrow({ children, center }: { children: string; center?: boolean }) {
  return (
    <div className="eyebrow" style={center ? { justifyContent: "center" } : undefined}>
      <span className="spark">
        <svg><use href="#ic-spark" /></svg>
      </span>{" "}
      {children}
    </div>
  );
}

export default function LpMemorias({ whatsapp, email, instagram, sampleQr }: Props) {
  const defaultMessage = "Olá, Lia! Quero saber mais sobre a LP Memórias para o meu evento.";

  return (
    <div className="fv" id="top">
      <p className="fv-ribbon">
        <strong>LP Memórias</strong> é um serviço da LP Assessoria e Cerimonial, com mais de 15 anos de experiência em eventos
      </p>

      {/* 1. Abertura */}
      <section className="fv-hero">
        <div className="wrap fv-hero-grid">
          <div>
            <div className="fv-topbar">
              <a href="#top" className="fv-logo" aria-label="LP Memórias, início da página">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-lp-memorias-navy.png" alt="LP Memórias" />
              </a>
              <PanelButton />
            </div>
            <h1 className="serif">
              Seu casamento por <em>todos os ângulos</em>
            </h1>
            <p className="fv-lead">
              Cada convidado tem uma história para contar. A LP Memórias reúne todas elas em um só álbum.
            </p>
            <div className="fv-actions">
              <a className="btn btn-primary" href="#planos">Quero no meu casamento</a>
              <a className="btn btn-line" href="#como-funciona">Ver como funciona</a>
            </div>
            <p className="fv-proof">Com QR code, sem aplicativo, e com as fotos ao vivo no telão da festa</p>
          </div>
          <div className="fv-hero-visual" aria-hidden="true">
            <div className="fv-screen">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/portfolio-02.jpg" alt="" />
              <div className="fv-screen-credit">
                <p>Que festa linda!</p>
                <small>Marina</small>
                <span className="fv-screen-qr" dangerouslySetInnerHTML={{ __html: sampleQr }} />
              </div>
            </div>
            <div className="fv-phone">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/hero-couple.jpg" alt="" />
              <span>Enviar foto</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Para quais eventos */}
      <section className="fv-types" aria-label="Eventos atendidos">
        <div className="wrap">
          <p className="fv-kicker">Pensado para casamentos, disponível para todos os eventos</p>
          <ul>
            {EVENT_TYPES.map((type) => <li key={type}>{type}</li>)}
          </ul>
        </div>
      </section>

      {/* 3. O problema */}
      <section className="fv-narrow">
        <Reveal className="wrap fv-text">
          <Eyebrow>O que se perde</Eyebrow>
          <h2 className="serif">As fotos mais espontâneas do seu casamento costumam ficar esquecidas no celular de alguém.</h2>
          <p>
            O fotógrafo registra os grandes momentos. Mas tem o abraço da sua avó no canto do salão, a mesa dos primos às gargalhadas
            e a amiga que capturou o olhar que ninguém mais viu.
          </p>
          <p>
            Essas fotos se espalham por dezenas de celulares. Algumas caem no grupo e se perdem entre centenas de mensagens. Outras
            ficam para &quot;depois eu te mando&quot;, e esse depois não chega.
          </p>
          <p><strong>Com um gesto simples, cada uma delas pode chegar até vocês ainda durante a festa.</strong></p>
        </Reveal>
      </section>

      {/* 4. Comparação */}
      <section className="fv-alt fv-narrow">
        <Reveal className="wrap fv-text-wide">
          <Eyebrow>Duas formas de viver o dia</Eyebrow>
          <h2 className="serif">A mesma festa, dois finais diferentes</h2>
          <div className="fv-compare">
            <article>
              <h3>Deixar para pedir depois</h3>
              <p>
                Depois da festa, vem a tarefa de pedir foto para cada convidado. Semanas mais tarde, chegou só uma parte, em baixa
                qualidade e espalhada por várias conversas.
              </p>
            </article>
            <article className="is-featured">
              <span className="fv-badge">O jeito LP Memórias</span>
              <h3>Combinar antes</h3>
              <p>
                O QR code já está nas mesas. Cada foto chega na hora, passa por aprovação e aparece no telão. A festa ganha um momento
                a mais, e vocês saem dela com tudo reunido.
              </p>
            </article>
          </div>
        </Reveal>
      </section>

      {/* 5. Como funciona */}
      <section id="como-funciona" className="fv-narrow">
        <div className="wrap">
          <Reveal className="section-head center">
            <Eyebrow center>Na prática</Eyebrow>
            <h2 className="serif">Veja como funciona</h2>
            <p>Três passos e cada convidado passa a fazer parte da história de vocês.</p>
          </Reveal>
          <ol className="fv-steps">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="fv-step-num">{i + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <blockquote className="fv-quote serif-alt">
            Quando a festa acabar, vocês ainda terão a festa inteira para rever, pelos olhos de quem estava lá.
          </blockquote>
          <p className="fv-note">O prazo de guarda das fotos é combinado na contratação, e vocês podem baixar tudo de uma vez.</p>
        </div>
      </section>

      {/* Demonstração interativa */}
      <section id="experimente" className="fv-demo-section">
        <div className="wrap">
          <Reveal className="section-head center fv-head-light">
            <Eyebrow center>Experimente</Eyebrow>
            <h2 className="serif">Faça o caminho de uma foto, do celular ao telão</h2>
            <p>Esta é uma simulação: nada é enviado nem salvo. Ela mostra como a LP Memórias funciona.</p>
          </Reveal>
          <LiveDemo qr={sampleQr} />
        </div>
      </section>

      {/* 6. Funcionalidades */}
      <section id="funcionalidades" className="fv-alt fv-narrow">
        <div className="wrap">
          <Reveal className="section-head center">
            <Eyebrow center>Funcionalidades</Eyebrow>
            <h2 className="serif">Tudo o que a festa pede, sem complicar</h2>
          </Reveal>
          <div className="fv-feature-grid">
            {FEATURE_GROUPS.map((group) => (
              <article key={group.title} className="fv-feature-group">
                <h3 className="serif">{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Valor */}
      <section className="fv-narrow">
        <Reveal className="wrap fv-text">
          <Eyebrow>Perspectiva</Eyebrow>
          <h2 className="serif">Quanto vale rever esse dia daqui a 20 anos?</h2>
          <p>
            A festa leva meses de escolhas: vestido, decoração, buffet, música, fotografia. Tudo pensado para durar poucas horas.
          </p>
          <p>
            As fotos dos convidados guardam o lado que ninguém planejou, e é ele que costuma emocionar mais com o tempo. Reunir essas
            imagens hoje é simples. Tentar recuperá-las daqui a alguns anos, quase impossível.
          </p>
        </Reveal>
      </section>

      {/* 9. Planos */}
      <section id="planos" className="fv-alt fv-narrow">
        <div className="wrap">
          <Reveal className="section-head center">
            <Eyebrow center>Planos</Eyebrow>
            <h2 className="serif">Escolha o formato ideal para o seu casamento</h2>
            <p>Os planos também atendem outros eventos. O valor varia conforme a celebração: conte como será e a Lia responde pelo WhatsApp.</p>
          </Reveal>
          <div className="fv-plans">
            {PLANS.map((plan) => (
              <article key={plan.key} className={plan.highlight ? "fv-plan is-featured" : "fv-plan"}>
                {plan.highlight && <span className="fv-badge">Experiência completa</span>}
                <h3 className="serif">{plan.key}</h3>
                <p className="fv-plan-intro">{plan.intro}</p>
                <p className="fv-plan-price">Valor sob consulta</p>
                <ul>
                  {plan.items.map((item) => <li key={item}>{item}</li>)}
                  {plan.bonuses.map((item) => <li key={item} className="is-bonus">{item} <span>Bônus</span></li>)}
                </ul>
                <a
                  className={plan.highlight ? "btn btn-primary" : "btn btn-line"}
                  href={waLink(whatsapp, `Olá, Lia! Quero saber mais sobre o plano ${plan.key} da LP Memórias para o meu evento.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={captureWhatsappClick}
                >
                  Quero o {plan.key}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Bônus */}
      <section id="bonus" className="fv-narrow">
        <div className="wrap">
          <Reveal className="section-head center">
            <Eyebrow center>Bônus</Eyebrow>
            <h2 className="serif">Dois extras para mais gente participar</h2>
          </Reveal>
          <div className="fv-bonus-grid">
            <article>
              <div className="fv-cards" aria-hidden="true">
                <SampleCard qr={sampleQr} variant="table" />
                <SampleCard qr={sampleQr} variant="coaster" />
                <SampleCard qr={sampleQr} variant="sign" />
              </div>
              <h3 className="serif">Modelos de cartão com QR code</h3>
              <p>
                Cartões de mesa, porta-copos e placas prontos para imprimir, no estilo da sua festa. O QR code destes exemplos é real:
                aponte a câmera e fale com a Lia.
              </p>
            </article>
            <article>
              <ChallengeDraw />
              <h3 className="serif">Desafios de fotos</h3>
              <p>Propostas divertidas para os convidados, que tiram a timidez e rendem as fotos mais espontâneas da noite.</p>
            </article>
          </div>
        </div>
      </section>

      {/* 11. Tranquilidade */}
      <section className="fv-narrow fv-assurance-wrap">
        <Reveal className="wrap">
          <div className="fv-assurance">
            <span className="spark"><svg><use href="#ic-spark" /></svg></span>
            <div>
              <h2 className="serif">Tudo testado antes do grande dia</h2>
              <p>
                Antes da festa, fazemos um ensaio completo com o telão do local: QR code, envio, aprovação e exibição. Se algo precisar de
                ajuste, ele aparece no teste, e não na hora da valsa.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 12. Perguntas */}
      <section id="perguntas" className="faq">
        <div className="wrap">
          <Reveal className="section-head center">
            <Eyebrow center>Perguntas frequentes</Eyebrow>
            <h2 className="serif">Ainda com dúvidas?</h2>
          </Reveal>
          <FaqList />
        </div>
      </section>

      {/* 13. Chamada final */}
      <section id="quero" className="fv-final">
        <div className="wrap fv-final-grid">
          <Reveal>
            <h2 className="serif">Seu casamento merece ser visto de todos os ângulos</h2>
            <p>Conte como será o casamento ou outro evento. A mensagem abre pronta no WhatsApp da Lia, é só enviar.</p>
            <a
              className="fv-final-direct"
              href={waLink(whatsapp, defaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={captureWhatsappClick}
            >
              Prefiro chamar direto no WhatsApp
            </a>
          </Reveal>
          <Reveal>
            <QuoteForm whatsapp={whatsapp} />
          </Reveal>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <a className="brand" href="#top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-lp-memorias-cream.png" alt="LP Memórias" />
          </a>
          <nav aria-label="Seções da página">
            <a href="#como-funciona">Como funciona</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#planos">Planos</a>
            <a href="#perguntas">Perguntas</a>
            <a href="/">Site da LP</a>
          </nav>
          <div className="social">
            <a href={`https://instagram.com/${instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg><use href="#ic-insta" /></svg>
            </a>
            <a href={waLink(whatsapp, defaultMessage)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={captureWhatsappClick}>
              <svg><use href="#ic-wa" /></svg>
            </a>
            <a href={`mailto:${email}`} aria-label="E-mail">
              <svg><use href="#ic-mail" /></svg>
            </a>
          </div>
        </div>
        <div className="bottom">Manaus, AM · © {new Date().getFullYear()} LP Assessoria e Cerimonial. Todos os direitos reservados.</div>
      </footer>

      <StickyCta />
    </div>
  );
}

/** Mesmo visual do botão do site principal. A entrada atende clientes e a equipe do site. */
function PanelButton() {
  // "unknown" enquanto a sessão não foi checada: evita piscar "Entrar" e trocar para "Painel".
  const [session, setSession] = useState<"unknown" | "out" | "in">("unknown");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setSession(user ? "in" : "out"));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession?.user ? "in" : "out");
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === "unknown") return null;
  return (
    <a className="btn btn-line fv-panel-btn" href={session === "in" ? "/lp-memorias/conta" : "/lp-memorias/entrar"}>
      {session === "in" ? "Painel" : "Entrar"}
    </a>
  );
}

function SampleCard({ qr, variant }: { qr: string; variant: "table" | "coaster" | "sign" }) {
  const label = { table: "Mesa", coaster: "Porta-copos", sign: "Placa" }[variant];
  return (
    <figure className={`fv-card fv-card-${variant}`}>
      <span className="fv-card-title serif">Ana &amp; Pedro</span>
      <span className="fv-card-qr" dangerouslySetInnerHTML={{ __html: qr }} />
      <span className="fv-card-text">Aponte a câmera e envie sua foto</span>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function ChallengeDraw() {
  const [index, setIndex] = useState(0);
  return (
    <div className="fv-challenge">
      <p className="fv-kicker">Desafio da mesa</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={index}
          className="fv-challenge-text serif-alt"
          aria-live="polite"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {CHALLENGES[index]}
        </motion.p>
      </AnimatePresence>
      <button type="button" className="btn btn-line" onClick={() => setIndex((i) => (i + 1) % CHALLENGES.length)}>
        Sortear outro
      </button>
    </div>
  );
}

function FaqList() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Reveal className="faq-list">
      {FAQS.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={faq.question} className={`faq-item ${isOpen ? "is-open" : ""}`}>
            <button type="button" className="faq-summary" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
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
  );
}

function QuoteForm({ whatsapp }: { whatsapp: string }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Casamentos");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [plan, setPlan] = useState(PLANS[1].key);

  const message = () => {
    const when = date ? date.split("-").reverse().join("/") : "";
    return [
      `Olá, Lia! Meu nome é ${name.trim()}.`,
      `Quero saber mais sobre o plano ${plan} da LP Memórias para o meu evento.`,
      `Tipo de evento: ${type}.`,
      when && `Data: ${when}.`,
      guests && `Convidados: cerca de ${guests}.`,
    ].filter(Boolean).join("\n");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    captureWhatsappClick();
    window.open(waLink(whatsapp, message()), "_blank", "noopener,noreferrer");
  };

  return (
    <form className="fv-form" onSubmit={submit}>
      <label>
        <span>Seu nome</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label>
        <span>Tipo de evento</span>
        <select required value={type} onChange={(e) => setType(e.target.value)}>
          <option value="" disabled>Selecione</option>
          {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          <option>Outro</option>
        </select>
      </label>
      <div className="fv-form-row">
        <label>
          <span>Data (opcional)</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          <span>Convidados (opcional)</span>
          <input type="number" min={1} inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value)} />
        </label>
      </div>
      <label>
        <span>Plano</span>
        <select value={plan} onChange={(e) => setPlan(e.target.value)}>
          {PLANS.map((p) => <option key={p.key}>{p.key}</option>)}
        </select>
      </label>
      <button type="submit" className="btn btn-primary">Enviar pelo WhatsApp</button>
    </form>
  );
}

/** Botão fixo: aparece depois da abertura e some na demonstração, nos planos e na chamada final. */
function StickyCta() {
  const [pastHero, setPastHero] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);
  const visibleTargets = useRef(new Set<Element>());

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > 650);
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleTargets.current.add(entry.target);
        else visibleTargets.current.delete(entry.target);
      });
      setTargetVisible(visibleTargets.current.size > 0);
    });
    ["experimente", "planos", "quero"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => {
      document.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const show = pastHero && !targetVisible;
  return (
    <a href="#planos" className={show ? "fv-sticky is-on" : "fv-sticky"} tabIndex={show ? 0 : -1} aria-hidden={!show}>
      Ver os planos
    </a>
  );
}
