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

// ------- Papelaria: modelos desenhados no canvas, sem imagens externas -------

type Ornament = "flowers" | "waves" | "shells" | "leaves" | "lines" | "wash" | "arch";
type Template = { name: string; bg: string; ink: string; accent: string; ornament: Ornament; script: boolean };

const TEMPLATES: Template[] = [
  { name: "Florada", bg: "#f7f6fb", ink: "#3f3a78", accent: "#8f7fc9", ornament: "flowers", script: true },
  { name: "Maré Poente", bg: "#fbf0ea", ink: "#a8422a", accent: "#e2997f", ornament: "waves", script: false },
  { name: "Maré Verde", bg: "#eef6f0", ink: "#1f5e45", accent: "#83b89b", ornament: "waves", script: false },
  { name: "Conchas", bg: "#eef5f6", ink: "#2c5660", accent: "#88b3bc", ornament: "shells", script: false },
  { name: "Flor Noturna", bg: "#1a1c2c", ink: "#f0e8d8", accent: "#c9a86a", ornament: "flowers", script: true },
  { name: "Campo", bg: "#f6f0e4", ink: "#5a4426", accent: "#a98a57", ornament: "leaves", script: true },
  { name: "Pétala Clara", bg: "#ffffff", ink: "#7a5560", accent: "#dcb6c0", ornament: "flowers", script: true },
  { name: "Requinte", bg: "#fdfaf3", ink: "#6b5222", accent: "#c0a15c", ornament: "arch", script: true },
  { name: "Litoral", bg: "#f2f7fb", ink: "#1f4a73", accent: "#8bb2d3", ornament: "shells", script: true },
  { name: "Clássico", bg: "#ffffff", ink: "#182c52", accent: "#ab7f3f", ornament: "lines", script: false },
  { name: "Rústico", bg: "#efe6d6", ink: "#4d3a24", accent: "#8c7350", ornament: "leaves", script: false },
  { name: "Romântico", bg: "#fdf3f3", ink: "#8e3b52", accent: "#e0a3b2", ornament: "arch", script: true },
  { name: "Moderno", bg: "#ffffff", ink: "#161616", accent: "#161616", ornament: "lines", script: false },
  { name: "Aquarela", bg: "#fbfafb", ink: "#3f5b78", accent: "#a9c4dd", ornament: "wash", script: true },
];

type Kind = "save-the-date" | "invite" | "notice";
type CardText = { heading: string; quote: string; names: string; line1: string; line2: string; line3: string };

const SIZE = { width: 1400, height: 1000 };
const SCRIPT_FONT = "'Great Vibes', cursive";
const SERIF_FONT = "'Playfair Display', serif";
const BODY_FONT = "'Jost', sans-serif";

function ornament(ctx: CanvasRenderingContext2D, t: Template) {
  const { width: W, height: H } = SIZE;
  ctx.save();
  ctx.strokeStyle = t.accent;
  ctx.fillStyle = t.accent;
  ctx.lineWidth = 3;
  const flower = (x: number, y: number, r: number) => {
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, r * 0.45, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = t.ink;
    ctx.fill();
    ctx.fillStyle = t.accent;
  };
  const leaf = (x: number, y: number, angle: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size / 2, -size / 3, size, 0);
    ctx.quadraticCurveTo(size / 2, size / 3, 0, 0);
    ctx.stroke();
    ctx.restore();
  };
  switch (t.ornament) {
    case "flowers":
      [[90, 90, 34], [190, 60, 22], [60, 190, 22], [W - 90, H - 90, 34], [W - 190, H - 60, 22], [W - 60, H - 190, 22], [W - 90, 90, 26], [90, H - 90, 26]].forEach(([x, y, r]) => flower(x, y, r));
      break;
    case "waves":
      for (let row = 0; row < 5; row++) {
        ctx.globalAlpha = 0.5 - row * 0.08;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 20) {
          const y = H - 30 - row * 26 + Math.sin(x / 70 + row) * 14;
          if (x) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    case "shells":
      [[W - 130, H - 130], [130, 130]].forEach(([x, y]) => {
        for (let i = 0; i < 7; i++) {
          const a = Math.PI + (i * Math.PI) / 6;
          ctx.beginPath();
          ctx.moveTo(x, y + 50);
          ctx.quadraticCurveTo(x + Math.cos(a) * 50, y + Math.sin(a) * 50, x + Math.cos(a) * 90, y + Math.sin(a) * 90);
          ctx.stroke();
        }
      });
      break;
    case "leaves":
      [[70, H - 70, -0.8], [W - 70, 70, 2.35]].forEach(([x, y, a]) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * 340, y + Math.sin(a) * 340);
        ctx.stroke();
        for (let i = 1; i < 7; i++) {
          const px = x + Math.cos(a) * i * 50;
          const py = y + Math.sin(a) * i * 50;
          leaf(px, py, a - 0.7, 70);
          leaf(px, py, a + 0.7, 70);
        }
      });
      break;
    case "lines":
      ctx.strokeRect(50, 50, W - 100, H - 100);
      ctx.lineWidth = 1;
      ctx.strokeRect(66, 66, W - 132, H - 132);
      break;
    case "wash":
      ctx.globalAlpha = 0.28;
      [[0, 0, 340], [W, H, 380], [W, 0, 170], [0, H, 170]].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      break;
    case "arch":
      ctx.beginPath();
      ctx.moveTo(110, H - 60);
      ctx.lineTo(110, 480);
      ctx.bezierCurveTo(110, 40, W - 110, 40, W - 110, 480);
      ctx.lineTo(W - 110, H - 60);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

function drawCard(canvas: HTMLCanvasElement, t: Template, text: CardText) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const center = SIZE.width / 2;
  const maxWidth = SIZE.width - 340;
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, SIZE.width, SIZE.height);
  ornament(ctx, t);

  ctx.textAlign = "center";
  ctx.fillStyle = t.ink;
  ctx.font = `500 34px ${BODY_FONT}`;
  ctx.fillText(text.heading, center, 190, maxWidth);
  ctx.font = `italic 30px ${BODY_FONT}`;
  ctx.fillText(text.quote, center, 262, maxWidth);
  ctx.font = t.script ? `118px ${SCRIPT_FONT}` : `92px ${SERIF_FONT}`;
  ctx.fillText(text.names, center, 440, maxWidth);
  ctx.fillStyle = t.accent;
  ctx.fillRect(center - 60, 505, 120, 3);
  ctx.fillStyle = t.ink;
  ctx.font = `500 42px ${BODY_FONT}`;
  ctx.fillText(text.line1, center, 600, maxWidth);
  ctx.font = `34px ${BODY_FONT}`;
  ctx.fillText(text.line2, center, 672, maxWidth);
  ctx.font = `28px ${BODY_FONT}`;
  ctx.fillText(text.line3, center, 800, maxWidth);
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
    // Espera as fontes: no canvas, fonte ainda não carregada cai na padrão do navegador.
    void Promise.all([
      document.fonts.load(`118px ${SCRIPT_FONT}`),
      document.fonts.load(`92px ${SERIF_FONT}`),
      document.fonts.load(`500 40px ${BODY_FONT}`),
    ]).finally(() => {
      if (active && canvas.current) drawCard(canvas.current, template, text);
    });
    return () => {
      active = false;
    };
  }, [template, text]);

  const download = () => {
    if (!canvas.current) return;
    const link = document.createElement("a");
    link.href = canvas.current.toDataURL("image/png");
    link.download = `${kind}-${slug}.png`;
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
        <div className="lc-template-grid" role="radiogroup" aria-label="Modelo">
          {TEMPLATES.map((item) => (
            <button key={item.name} type="button" role="radio" aria-checked={template.name === item.name} className={template.name === item.name ? "is-on" : ""} onClick={() => setTemplate(item)}>
              <i style={{ background: item.bg, borderColor: item.accent, color: item.ink }}>Aa</i>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <Field label="Título" maxLength={40} value={text.heading} onChange={set("heading")} />
        <TextArea label={kind === "notice" ? "Comunicado" : "Frase"} rows={2} maxLength={90} value={text.quote} onChange={set("quote")} />
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
