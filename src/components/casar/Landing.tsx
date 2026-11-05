"use client";

import { useState } from "react";
import { THEMES } from "@/lib/casar/themes";
import { defaultSiteData, toPublicData } from "@/lib/casar/types";
import { Countdown, SiteHero, themeStyle } from "./SiteView";
import ThemeCard from "./ThemeCard";
import { Icon, Logo } from "./ui";

const SIGNUP = "/lp-casar/entrar?modo=criar";

const STEPS = [
  { title: "Escolham o link e o tema", text: "Em poucos minutos, o site de vocês já está no ar com um endereço fácil de lembrar." },
  { title: "Deixem com a cara de vocês", text: "Fotos, história, locais, padrinhos e dress code. Tudo salva sozinho, e dá para mudar quando quiserem." },
  { title: "Compartilhem com os convidados", text: "Enviem o link pelo WhatsApp e acompanhem confirmações, recados e presentes em um só painel." },
];

const DETAILS = [
  { icon: "pin", title: "Mapas e rotas", text: "Um toque abre a cerimônia e a festa no Google Maps ou no Waze." },
  { icon: "hanger", title: "Dress code", text: "Contem qual é o traje e evitem aquela mensagem de última hora." },
  { icon: "heart", title: "Mural de recados", text: "Os votos de carinho ficam reunidos, e vocês decidem o que aparece." },
  { icon: "bed", title: "Hospedagem e dicas", text: "Indiquem hotéis e informações úteis para quem vem de fora." },
  { icon: "qr", title: "QR Code do site", text: "Baixem o código e usem no convite impresso ou nas mesas." },
  { icon: "list", title: "Checklist e orçamento", text: "Organizem as tarefas e os gastos do casamento no mesmo painel." },
];

const PAPER = [
  { id: "florada", script: true, ink: "#3f3a78" },
  { id: "flor-noturna", script: true, ink: "#f4ecdc" },
  { id: "requinte", script: false, ink: "#5f4818" },
  { id: "romantico", script: true, ink: "#8e3b52" },
];

const FAQ = [
  { q: "Preciso entender de tecnologia?", a: "Não. Um passo a passo cria o site em poucos minutos, e um tutorial mostra onde fica cada ferramenta. Tudo pode ser alterado depois." },
  { q: "Como recebemos os presentes?", a: "Vocês cadastram a chave Pix. O convidado paga direto para a conta de vocês e avisa pelo site; vocês conferem no banco e confirmam no painel." },
  { q: "Quem pode ver o nosso site?", a: "Quem tiver o link. Se preferirem, é possível proteger o site com senha e tirá-lo da busca de casamentos." },
  { q: "E se precisarmos de ajuda para organizar o casamento?", a: "A equipe da LP Assessoria e Cerimonial atende vocês do planejamento ao grande dia. É só chamar pelo WhatsApp." },
];

function heroPreview() {
  const data = defaultSiteData();
  data.couple.name1 = "Marina";
  data.couple.name2 = "Rafael";
  data.wedding = { date: "2027-07-21", city: "Manaus · AM" };
  data.theme = { ...data.theme, id: "jardim" };
  data.intro.heroImage = "/images/casar/art-4.jpg";
  return toPublicData(data);
}

export default function Landing({ whatsapp }: { whatsapp: string }) {
  const [open, setOpen] = useState(0);
  const preview = heroPreview();
  return (
    <div className="lc-root lc-landing">
      <div className="lc-land-nav">
        <Logo />
        <nav aria-label="Principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#temas">Temas</a>
          <a href="#papelaria">Papelaria</a>
          <a href="#duvidas">Dúvidas</a>
          <a href="/lp-casar/encontrar">Encontre um casamento</a>
        </nav>
        <div className="lc-row">
          <a className="lc-btn lc-btn-ghost lc-btn-sm" href="/lp-casar/entrar">Entrar</a>
          <a className="lc-btn lc-btn-sm" href={SIGNUP}>Criar site</a>
        </div>
      </div>

      <div className="lc-land-hero">
        <div className="lc-land-hero-copy">
          <p className="lc-eyebrow">Site de casamento · Lista de presentes</p>
          <h1>O site do casamento de vocês, com o cuidado de quem vive esse dia</h1>
          <p>Organizem convidados, informações e presentes em um só lugar, com a experiência da LP Assessoria e Cerimonial.</p>
          <div className="lc-row">
            <a className="lc-btn" href={SIGNUP}>Criar nosso site</a>
            <a className="lc-btn lc-btn-ghost" href="/lp-casar/encontrar">Encontrar um casamento</a>
          </div>
        </div>
        <div className="lc-land-hero-art" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/casar/art-3.jpg" alt="" />
          <div className="lc-phone lc-land-phone">
            <div className="lc-mini lc-mini-phone">
              <div className="ls-root is-oval t-jardim is-mini is-narrow" style={themeStyle(preview)}>
                <SiteHero data={preview} layout="oval" />
                <Countdown date="" sample />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lc-land-section" id="como-funciona">
        <p className="lc-eyebrow">Como funciona</p>
        <h2>Do link ao grande dia, em três passos</h2>
        <ol className="lc-steps">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span aria-hidden="true">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="lc-land-section lc-land-tint">
        <p className="lc-eyebrow">Tudo em um só lugar</p>
        <h2>O que dá trabalho fica simples</h2>
        <div className="lc-bento">
          <article className="lc-bento-card">
            <div className="lc-bento-art lc-demo-rsvp" aria-hidden="true">
              <div><b>Exemplo</b><span>Confirmações</span></div>
              <ul>
                <li>Ana Souza <i className="is-yes">Confirmada</i></li>
                <li>Pedro Lima <i className="is-yes">Confirmado</i></li>
                <li>Júlia Costa <i>Sem resposta</i></li>
              </ul>
            </div>
            <h3>Confirmação de presença</h3>
            <p>Aberta a quem tem o link ou só para a lista de convidados, com total de adultos e crianças em tempo real.</p>
          </article>
          <article className="lc-bento-card">
            <div className="lc-bento-art lc-demo-pix" aria-hidden="true">
              <span className="lc-demo-emoji">🕯️</span>
              <div><b>Jantar à luz de velas</b><span>Exemplo de presente</span></div>
              <i>Pix</i>
            </div>
            <h3>Presentes direto no Pix</h3>
            <p>O convidado escolhe, paga pelo QR Code e deixa uma mensagem. O dinheiro vai direto para a conta de vocês.</p>
          </article>
          <article className="lc-bento-card">
            <div className="lc-bento-art lc-demo-note" aria-hidden="true">
              <p>“Que a vida a dois seja cheia de amor e boas risadas!”</p>
              <span>Exemplo de recado</span>
            </div>
            <h3>Recados e cartões</h3>
            <p>Os votos ficam no mural do site, e as mensagens dos presentes viram um PDF para guardar de lembrança.</p>
          </article>
        </div>
      </div>

      <div className="lc-land-section" id="temas">
        <p className="lc-eyebrow">Temas</p>
        <h2>Um estilo para cada casal</h2>
        <p className="lc-land-lead">Doze temas, cada um com doze opções de cores e fontes à escolha. As miniaturas são o próprio site, em tamanho reduzido.</p>
        <div className="lc-theme-grid">
          {THEMES.map((theme) => <ThemeCard key={theme.id} theme={theme} />)}
        </div>
        <a className="lc-btn" href={SIGNUP}>Criar nosso site</a>
      </div>

      <div className="lc-land-section lc-land-tint" id="papelaria">
        <p className="lc-eyebrow">Papelaria digital</p>
        <h2>Convites prontos para o WhatsApp</h2>
        <p className="lc-land-lead">Save the date, convite e comunicado em 14 modelos. O nome e a data de vocês entram sozinhos.</p>
        <div className="lc-paper-show" aria-hidden="true">
          {PAPER.map((item) => (
            <div key={item.id} style={{ backgroundImage: `url(/images/casar/papelaria/${item.id}.jpg)`, color: item.ink }}>
              <small>SAVE THE DATE</small>
              <strong className={item.script ? "is-script" : ""}>Marina &amp; Rafael</strong>
              <span>21 de julho de 2027</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lc-land-section">
        <p className="lc-eyebrow">Informações</p>
        <h2>Tudo o que o convidado precisa saber</h2>
        <div className="lc-land-details">
          {DETAILS.map((item) => (
            <article key={item.title}>
              <span className="lc-land-icon"><Icon name={item.icon} size={22} /></span>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
            </article>
          ))}
        </div>
      </div>

      <div className="lc-land-band">
        <div>
          <h2>Querem alguém cuidando de todos os detalhes?</h2>
          <p>A LP Assessoria e Cerimonial acompanha vocês do planejamento ao grande dia, para que vocês só precisem aproveitar.</p>
        </div>
        <a className="lc-btn lc-btn-light" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">Falar com a LP</a>
      </div>

      <div className="lc-land-section" id="duvidas">
        <h2>Perguntas frequentes</h2>
        <div className="lc-faq">
          {FAQ.map((item, i) => (
            <div key={item.q} className={open === i ? "is-open" : ""}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                {item.q}<Icon name="down" size={18} />
              </button>
              {open === i && <p>{item.a}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="lc-land-footer">
        <Logo light />
        <p>Uma criação da LP Assessoria e Cerimonial</p>
        <a className="lc-btn" href={SIGNUP}>Criar nosso site</a>
      </div>
    </div>
  );
}
