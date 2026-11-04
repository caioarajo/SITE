"use client";

import { useState } from "react";
import { THEMES } from "@/lib/casar/themes";
import ThemeCard from "./ThemeCard";
import { Icon, Logo } from "./ui";

const SIGNUP = "/lp-casar/entrar?modo=criar";

const ALL_IN_ONE = [
  { icon: "monitor", title: "Site de casamento personalizado", text: "Temas prontos que vocês ajustam do seu jeito: fotos, cores, textos, dress code e mapas." },
  { icon: "users", title: "Confirmação de presença", text: "Cada convidado responde pelo site e vocês acompanham a lista em tempo real, com total de adultos e crianças." },
  { icon: "gift", title: "Lista de presentes com Pix", text: "O convidado escolhe o presente e paga por Pix direto na conta de vocês, com QR Code pronto." },
];

const DETAILS = [
  { icon: "pin", title: "Mapas e rotas", text: "Um toque abre a cerimônia e a festa no Google Maps ou no Waze." },
  { icon: "hanger", title: "Dress code", text: "Conte qual é o traje e evite aquela mensagem de última hora." },
  { icon: "heart", title: "Mural de recados", text: "Os votos de carinho ficam reunidos, e vocês decidem o que aparece." },
  { icon: "mail", title: "Papelaria digital", text: "Save the date e convite prontos para baixar e enviar pelo WhatsApp." },
  { icon: "bed", title: "Hospedagem e dicas", text: "Indique hotéis e informações úteis para quem vem de fora." },
  { icon: "qr", title: "QR Code do site", text: "Baixe o código e use no convite impresso ou nas mesas." },
];

const FAQ = [
  { q: "Preciso entender de tecnologia?", a: "Não. Um passo a passo cria o site em poucos minutos, e um tutorial mostra onde fica cada ferramenta. Tudo pode ser alterado depois." },
  { q: "Como recebemos os presentes?", a: "Vocês cadastram a chave Pix. O convidado paga direto para a conta de vocês e avisa pelo site; vocês conferem no banco e confirmam no painel." },
  { q: "Quem pode ver o nosso site?", a: "Quem tiver o link. Se preferirem, é possível proteger o site com senha e tirá-lo da busca de casamentos." },
  { q: "E se precisarmos de ajuda para organizar o casamento?", a: "A equipe da LP Assessoria e Cerimonial atende vocês do planejamento ao grande dia. É só chamar pelo WhatsApp." },
];

export default function Landing({ whatsapp }: { whatsapp: string }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="lc-root lc-landing">
      <div className="lc-land-nav">
        <Logo light />
        <nav aria-label="Principal">
          <a href="#tudo">Funcionalidades</a>
          <a href="#temas">Temas</a>
          <a href="#duvidas">Dúvidas</a>
          <a href="/lp-casar/encontrar">Encontre um casamento</a>
        </nav>
        <div className="lc-row">
          <a className="lc-btn lc-btn-light lc-btn-sm" href="/lp-casar/entrar">Entrar</a>
          <a className="lc-btn lc-btn-sm" href={SIGNUP}>Criar site</a>
        </div>
      </div>

      <div className="lc-land-hero">
        <p className="lc-pill">Site de casamento · Lista de presentes</p>
        <h1>O site do casamento de vocês, com o cuidado de quem vive esse dia</h1>
        <p>Organizem convidados, informações e presentes em um só lugar, com a experiência da LP Assessoria e Cerimonial.</p>
        <div className="lc-row lc-row-center">
          <a className="lc-btn lc-btn-light" href="/lp-casar/encontrar">Encontre um casamento</a>
          <a className="lc-btn" href={SIGNUP}>Crie seu site</a>
        </div>
      </div>

      <div className="lc-land-section" id="tudo">
        <p className="lc-eyebrow">Organização, comunicação e presentes</p>
        <h2>Tudo para o grande dia em um só lugar</h2>
        <div className="lc-land-cards">
          {ALL_IN_ONE.map((item) => (
            <article key={item.title}>
              <span className="lc-land-icon"><Icon name={item.icon} size={24} /></span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="lc-land-section lc-land-tint" id="temas">
        <p className="lc-eyebrow">Temas</p>
        <h2>Um estilo para cada casal</h2>
        <p className="lc-land-lead">Nove temas, cada um com opções de cores. As miniaturas abaixo são o próprio site, em tamanho reduzido.</p>
        <div className="lc-theme-grid">
          {THEMES.map((theme) => <ThemeCard key={theme.id} theme={theme} />)}
        </div>
        <a className="lc-btn" href={SIGNUP}>Criar nosso site</a>
      </div>

      <div className="lc-land-section">
        <p className="lc-eyebrow">Informações</p>
        <h2>Tudo o que o convidado precisa saber</h2>
        <div className="lc-land-details">
          {DETAILS.map((item) => (
            <article key={item.title}>
              <Icon name={item.icon} size={22} />
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
