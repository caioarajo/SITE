"use client";

import { useEffect, useRef, useState } from "react";
import { coupleNames, formatDate } from "@/lib/casar/types";
import type { PanelProps } from "../Editor";
import { api, Field, TextArea, Toggle } from "../ui";

export function WeddingPanel({ data, update, slug }: PanelProps) {
  const setWedding = (patch: Partial<PanelProps["data"]["wedding"]>) => update((d) => ({ ...d, wedding: { ...d.wedding, ...patch } }));
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      await api("/api/casar/site", "DELETE", { confirm });
      window.location.href = "/lp-casar/criar";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <Field label="Data do casamento" type="date" value={data.wedding.date} onChange={(e) => setWedding({ date: e.target.value })} />
      <Field label="Cidade" placeholder="Manaus · AM" maxLength={80} value={data.wedding.city} onChange={(e) => setWedding({ city: e.target.value })} />
      <p className="lc-muted">Os locais da cerimônia e da festa ficam em Aparência do site › Editar seções.</p>

      <h3 className="lc-panel-h3">Excluir o site</h3>
      <p className="lc-muted">Apaga o site, as fotos, os convidados, as confirmações e os recados. Não dá para desfazer. Para confirmar, digitem <strong>{slug}</strong>.</p>
      <Field label="Link do site" autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error && <p className="lc-error" role="alert">{error}</p>}
      <button type="button" className="lc-link-danger" disabled={confirm !== slug || busy} onClick={() => void remove()}>{busy ? "Excluindo…" : "Excluir definitivamente"}</button>
    </>
  );
}

export function CouplePanel({ data, update, email }: PanelProps) {
  const setCouple = (patch: Partial<PanelProps["data"]["couple"]>) => update((d) => ({ ...d, couple: { ...d.couple, ...patch } }));
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const changePassword = async () => {
    setError("");
    setMessage("");
    try {
      await api("/api/casar/auth", "POST", { action: "change", current, password: next });
      setCurrent("");
      setNext("");
      setMessage("Senha alterada.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <Field label="Nome de um" maxLength={60} value={data.couple.name1} onChange={(e) => setCouple({ name1: e.target.value })} />
      <Field label="Nome do outro" maxLength={60} value={data.couple.name2} onChange={(e) => setCouple({ name2: e.target.value })} />
      <Field label="E-mail de acesso" value={email} readOnly disabled />

      <h3 className="lc-panel-h3">Notificações por e-mail</h3>
      <Toggle
        label="Avisar quando chegar confirmação, recado ou presente"
        checked={data.notifications.email}
        onChange={(value) => update((d) => ({ ...d, notifications: { email: value, address: email } }))}
      />
      <p className="lc-muted">O painel também mostra as novidades com um número nos menus.</p>

      <h3 className="lc-panel-h3">Trocar a senha</h3>
      <Field label="Senha atual" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <Field label="Nova senha" hint="Pelo menos 8 caracteres." type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
      <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm lc-add-section" disabled={!current || next.length < 8} onClick={() => void changePassword()}>Trocar senha</button>
      {message && <p className="lc-ok" role="status">{message}</p>}
      {error && <p className="lc-error" role="alert">{error}</p>}
    </>
  );
}

export function PrivacyPanel({ data, update }: PanelProps) {
  const [password, setPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(data.privacy.hasPassword);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const savePassword = async (value: string | null) => {
    setError("");
    setMessage("");
    try {
      const result = await api<{ hasPassword: boolean }>("/api/casar/site", "PATCH", { password: value });
      setHasPassword(result.hasPassword);
      setPassword("");
      setMessage(result.hasPassword ? "Senha salva. Quem já entrou precisará digitá-la de novo." : "Senha removida. O site está aberto a quem tiver o link.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <Toggle
        label="Aparecer em “Encontre um casamento”"
        checked={data.privacy.searchable}
        onChange={(searchable) => update((d) => ({ ...d, privacy: { ...d.privacy, searchable } }))}
      />
      <p className="lc-muted">Desligado, só entra quem tiver o link.</p>
      <h3 className="lc-panel-h3">Senha para convidados</h3>
      <p className="lc-muted">{hasPassword ? "O site está protegido por senha." : "O site está aberto a quem tiver o link."}</p>
      <Field label={hasPassword ? "Nova senha" : "Criar senha"} type="text" autoComplete="off" minLength={4} value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="lc-row">
        <button type="button" className="lc-btn lc-btn-sm" disabled={password.length < 4} onClick={() => void savePassword(password)}>Salvar senha</button>
        {hasPassword && <button type="button" className="lc-link-danger" onClick={() => void savePassword(null)}>Remover senha</button>}
      </div>
      {message && <p className="lc-ok" role="status">{message}</p>}
      {error && <p className="lc-error" role="alert">{error}</p>}
    </>
  );
}

const TOPICS = {
  assessoria: {
    text: "A LP Assessoria e Cerimonial acompanha casais do planejamento ao grande dia: fornecedores, cronograma, cerimonial e todos os detalhes.",
    cta: "Falar com a LP pelo WhatsApp",
    message: "Oi! Estou criando meu site no LP Casar e gostaria de saber mais sobre a assessoria.",
  },
  domain: {
    text: "Querem um endereço só de vocês, como caioelia.com.br? A equipe da LP cuida do registro e da configuração.",
    cta: "Pedir pelo WhatsApp",
    message: "Oi! Tenho um site no LP Casar e gostaria de um domínio personalizado.",
  },
};

export function ContactPanel({ whatsapp, topic, slug }: PanelProps & { topic: keyof typeof TOPICS }) {
  const info = TOPICS[topic];
  return (
    <>
      <p>{info.text}</p>
      <a className="lc-btn lc-btn-sm" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`${info.message} (site: ${slug})`)}`} target="_blank" rel="noopener noreferrer">{info.cta}</a>
    </>
  );
}

export function DownloadPanel() {
  return (
    <>
      <p>Guardem uma cópia do site para recordar: textos, seções, recados e mensagens dos presentes, em um único arquivo que abre em qualquer navegador.</p>
      <p className="lc-muted">As fotos continuam vindo do site publicado. Antes de excluir o site, baixem também as originais.</p>
      <a className="lc-btn lc-btn-sm lc-add-section" href="/api/casar/export" download>Baixar cópia do site</a>
    </>
  );
}

const HELP = [
  { q: "Como mudo a aparência do site?", a: "Em Aparência do site › Alterar tema. Cores, fontes e ornamentos ficam em Personalizar tema. Nada do que vocês escreveram se perde." },
  { q: "As alterações vão direto para o ar?", a: "Sim. O painel salva sozinho, e os convidados veem a nova versão ao abrir ou atualizar o site." },
  { q: "Como funciona o presente por Pix?", a: "Vocês cadastram a chave em Minha Carteira. O convidado escolhe os presentes, paga pelo QR Code e avisa pelo site. Vocês conferem no banco e marcam como recebido." },
  { q: "O LP Casar confere se o Pix caiu?", a: "Não. O dinheiro vai direto para a conta de vocês, e por isso o aviso do convidado fica “a conferir” até vocês confirmarem." },
  { q: "Como só os convidados da lista podem confirmar?", a: "Em Meus convidados › Configurar confirmação, escolham a confirmação fechada e cadastrem os nomes na Lista de convidados." },
  { q: "Como escondo ou reordeno uma seção?", a: "Em Aparência do site › Editar seções: a chave esconde, as setas mudam a ordem e o lápis renomeia." },
  { q: "Posso proteger o site com senha?", a: "Sim. Em Minha Conta › Privacidade do site." },
];

export function FaqPanel() {
  return (
    <dl className="lc-help">
      {HELP.map((item) => (
        <div key={item.q}><dt>{item.q}</dt><dd>{item.a}</dd></div>
      ))}
    </dl>
  );
}

// ------- Papelaria: fundos em public/images/casar/papelaria (fontes editáveis em design/papelaria) -------

type Template = {
  id: string;
  name: string;
  ink: string;
  accent: string;
  /** Fonte e tamanho dos nomes. */
  nameFont: string;
  nameSize: number;
  /** Deslocamento vertical do bloco de texto, para fugir da arte. */
  dy?: number;
  maxWidth?: number;
  left?: boolean;
};

const SCRIPT_FONT = "'Great Vibes', cursive";
const SERIF_FONT = "'Playfair Display', serif";
const CAPS_FONT = "'Cinzel', serif";
const SOFT_FONT = "'Cormorant Garamond', serif";
const BODY_FONT = "'Jost', sans-serif";

const TEMPLATES: Template[] = [
  { id: "florada", name: "Florada", ink: "#3f3a78", accent: "#8f7fc9", nameFont: SCRIPT_FONT, nameSize: 128 },
  { id: "mare-poente", name: "Maré Poente", ink: "#8f3a24", accent: "#d9775a", nameFont: SERIF_FONT, nameSize: 96 },
  { id: "mare-verde", name: "Maré Verde", ink: "#1f5e45", accent: "#3f9a7a", nameFont: SERIF_FONT, nameSize: 96 },
  { id: "conchas", name: "Conchas", ink: "#24505d", accent: "#4a8596", nameFont: SOFT_FONT, nameSize: 108 },
  { id: "flor-noturna", name: "Flor Noturna", ink: "#f4ecdc", accent: "#d9bd7c", nameFont: SCRIPT_FONT, nameSize: 128 },
  { id: "campo", name: "Campo", ink: "#4d3a1f", accent: "#8c7350", nameFont: SCRIPT_FONT, nameSize: 124 },
  { id: "petala-clara", name: "Pétala Clara", ink: "#7a4556", accent: "#d68ea0", nameFont: SCRIPT_FONT, nameSize: 124, dy: 70 },
  { id: "requinte", name: "Requinte", ink: "#5f4818", accent: "#b08d41", nameFont: CAPS_FONT, nameSize: 74, maxWidth: 700 },
  { id: "litoral", name: "Litoral", ink: "#1f4a73", accent: "#5d90bd", nameFont: SCRIPT_FONT, nameSize: 124 },
  { id: "classico", name: "Clássico", ink: "#182c52", accent: "#ab7f3f", nameFont: SERIF_FONT, nameSize: 90, dy: 30, maxWidth: 720 },
  { id: "rustico", name: "Rústico", ink: "#433620", accent: "#6f8a77", nameFont: SOFT_FONT, nameSize: 96, maxWidth: 560 },
  { id: "romantico", name: "Romântico", ink: "#8e3b52", accent: "#d68ea0", nameFont: SCRIPT_FONT, nameSize: 120, dy: 90, maxWidth: 620 },
  { id: "moderno", name: "Moderno", ink: "#161616", accent: "#c79a6b", nameFont: "'Montserrat', sans-serif", nameSize: 72, dy: 10, maxWidth: 780, left: true },
  { id: "aquarela", name: "Aquarela", ink: "#34506d", accent: "#a9812f", nameFont: SCRIPT_FONT, nameSize: 120, maxWidth: 640 },
];

type Kind = "save-the-date" | "invite" | "notice";
type CardText = { heading: string; quote: string; names: string; line1: string; line2: string; line3: string };

const SIZE = { width: 1080, height: 1350 };
const artUrl = (template: Template) => `/images/casar/papelaria/${template.id}.jpg`;

function drawCard(canvas: HTMLCanvasElement, art: HTMLImageElement, t: Template, text: CardText) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const maxWidth = t.maxWidth ?? 760;
  const x = t.left ? 100 : SIZE.width / 2;
  const middle = SIZE.height / 2 + (t.dy ?? 0);
  ctx.drawImage(art, 0, 0, SIZE.width, SIZE.height);
  ctx.textAlign = t.left ? "left" : "center";

  // Diminui a fonte em vez de espremer as letras quando o nome é longo.
  const put = (value: string, y: number, weight: string, size: number, font: string, color: string) => {
    let current = size;
    ctx.font = `${weight} ${current}px ${font}`;
    while (ctx.measureText(value).width > maxWidth && current > 18) {
      current -= 2;
      ctx.font = `${weight} ${current}px ${font}`;
    }
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  };

  put(text.heading, middle - 300, "500", 32, BODY_FONT, t.accent);
  put(text.quote, middle - 228, "italic 400", 33, BODY_FONT, t.ink);
  put(text.names, middle - 62, "400", t.nameSize, t.nameFont, t.ink);
  ctx.fillStyle = t.accent;
  ctx.fillRect(t.left ? x : x - 60, middle + 2, 120, 2);
  put(text.line1, middle + 88, "500", 42, BODY_FONT, t.ink);
  put(text.line2, middle + 150, "400", 33, BODY_FONT, t.ink);
  put(text.line3, middle + 262, "400", 25, BODY_FONT, t.accent);
}

const HEADINGS: Record<Kind, string> = {
  invite: "CONVITE DE CASAMENTO",
  "save-the-date": "SAVE THE DATE",
  notice: "COMUNICADO",
};

export function StationeryPanel({ data, kind, slug, siteUrl }: PanelProps & { kind: Kind }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const host = siteUrl.replace(/^https?:\/\//, "");
  const date = formatDate(data.wedding.date) || "Data a definir";
  const place = kind === "invite" ? [data.ceremony.name, data.ceremony.time].filter(Boolean).join(" · ") : data.wedding.city;
  const [text, setText] = useState<CardText>({
    heading: HEADINGS[kind],
    quote: kind === "notice" ? "Temos uma novidade sobre o nosso casamento" : kind === "invite" ? "Será uma alegria celebrar este dia com você" : "Reserve esta data em sua agenda",
    names: `${data.couple.name1} & ${data.couple.name2}`,
    line1: date,
    line2: place,
    line3: host,
  });

  useEffect(() => {
    let active = true;
    const art = new Image();
    art.src = artUrl(template);
    // Espera a arte e as fontes: no canvas, fonte ainda não carregada cai na padrão do navegador.
    void Promise.all([
      art.decode(),
      document.fonts.load(`${template.nameSize}px ${template.nameFont}`),
      document.fonts.load(`500 40px ${BODY_FONT}`),
      document.fonts.load(`italic 400 33px ${BODY_FONT}`),
    ]).then(() => {
      if (active && canvas.current) drawCard(canvas.current, art, template, text);
    });
    return () => {
      active = false;
    };
  }, [template, text]);

  const download = () => {
    if (!canvas.current) return;
    const link = document.createElement("a");
    link.href = canvas.current.toDataURL("image/jpeg", 0.92);
    link.download = `${kind}-${slug}.jpg`;
    link.click();
  };

  const message = kind === "invite"
    ? `${coupleNames(data, " e ")} convidam você para o casamento! Todos os detalhes e a confirmação de presença estão em: ${siteUrl}`
    : kind === "notice"
      ? `${text.quote}. ${coupleNames(data, " e ")}. Mais detalhes em: ${siteUrl}`
      : `Reserve a data! ${coupleNames(data, " e ")} vão se casar em ${date}. Mais detalhes em: ${siteUrl}`;

  const set = (key: keyof CardText) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText({ ...text, [key]: e.target.value });

  return (
    <div className="lc-paper">
      <div>
        <canvas ref={canvas} width={SIZE.width} height={SIZE.height} aria-label={`Prévia: ${text.heading} de ${coupleNames(data)}`} />
      </div>
      <div>
        <h2 className="lc-panel-h3">Modelo</h2>
        <div className="lc-template-grid" role="radiogroup" aria-label="Modelo">
          {TEMPLATES.map((item) => (
            <button key={item.id} type="button" role="radio" aria-checked={template.id === item.id} className={template.id === item.id ? "is-on" : ""} onClick={() => setTemplate(item)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artUrl(item)} alt="" loading="lazy" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
        <h2 className="lc-panel-h3">Textos</h2>
        <Field label="Título" maxLength={40} value={text.heading} onChange={set("heading")} />
        <TextArea label={kind === "notice" ? "Comunicado" : "Frase"} rows={2} maxLength={70} value={text.quote} onChange={set("quote")} />
        <Field label="Nomes" maxLength={60} value={text.names} onChange={set("names")} />
        <Field label="Linha 1" maxLength={70} value={text.line1} onChange={set("line1")} />
        <Field label="Linha 2" maxLength={70} value={text.line2} onChange={set("line2")} />
        <Field label="Rodapé" maxLength={70} value={text.line3} onChange={set("line3")} />
        <div className="lc-paper-actions">
          <button type="button" className="lc-btn lc-btn-sm" onClick={download}>Baixar imagem</button>
          <a className="lc-btn lc-btn-ghost lc-btn-sm" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Enviar texto pelo WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
