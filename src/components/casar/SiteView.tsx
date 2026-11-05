"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import type { HeroLayout } from "@/lib/casar/themes";
import { brl, coupleNames, formatDate, paletteOf, safeUrl, sectionLabel, youtubeId, type GiftItem, type PublicMessage, type PublicSiteData, type SectionId, type Venue } from "@/lib/casar/types";
import { api, Icon } from "./ui";

/** Variáveis de cor e fonte do tema: valem para o site inteiro e para as miniaturas. */
export function themeStyle(data: Pick<PublicSiteData, "theme">): CSSProperties {
  const { theme, palette } = paletteOf(data);
  return {
    "--s-primary": palette.primary,
    "--s-bg": palette.bg,
    "--s-text": palette.text,
    "--s-accent": palette.accent,
    "--s-display": data.theme.font || theme.display,
    "--s-body": theme.body,
  } as CSSProperties;
}

const Sprig = ({ className = "" }: { className?: string }) => (
  <svg className={`ls-sprig ${className}`} viewBox="0 0 120 40" fill="none" stroke="currentColor" strokeWidth="1.200" strokeLinecap="round" aria-hidden="true">
    <path d="M6 20c30 4 72 4 108 0" />
    <path d="M30 22c-3-8-1-12 4-16 3 6 2 12-4 16ZM30 22c-4 7-3 10 2 14 3-5 3-9-2-14ZM60 23c-3-8-1-12 4-16 3 6 2 12-4 16ZM60 23c-4 7-3 10 2 14 3-5 3-9-2-14ZM90 22c-3-8-1-12 4-16 3 6 2 12-4 16ZM90 22c-4 7-3 10 2 14 3-5 3-9-2-14Z" />
  </svg>
);

/** Divisor das seções: o desenho muda por tema, no CSS. */
export const Divider = () => (
  <span className="ls-divider" aria-hidden="true">
    <Sprig />
    <i />
  </span>
);

/** Flor em traço, usada no tema Lírio. */
const Lily = ({ className = "" }: { className?: string }) => (
  <svg className={`ls-lily ${className}`} viewBox="0 0 200 420" fill="none" stroke="currentColor" strokeWidth="1.300" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M100 418C96 330 92 250 100 150" />
    <path d="M100 150C70 130 42 96 46 44C72 58 92 88 100 150ZM100 150C130 130 158 96 154 44C128 58 108 88 100 150ZM100 150C84 110 82 54 100 8C118 54 116 110 100 150Z" />
    <path d="M100 150C60 158 26 146 4 112C42 104 78 116 100 150ZM100 150C140 158 174 146 196 112C158 104 122 116 100 150Z" />
    <path d="M100 150V96M92 150L84 100M108 150L116 100" />
    <circle cx="100" cy="92" r="3" /><circle cx="83" cy="96" r="3" /><circle cx="117" cy="96" r="3" />
    <path d="M97 300C70 290 44 262 38 226C68 234 90 262 97 300ZM99 350C126 340 152 312 158 276C128 284 106 312 99 350Z" />
    <path d="M97 300L52 238M99 350L146 288" opacity=".6" />
  </svg>
);

/** Flor cheia em camadas, usada em Noite de Pétalas. */
const Bloom = ({ className = "" }: { className?: string }) => (
  <svg className={`ls-bloom ${className}`} viewBox="0 0 240 240" aria-hidden="true">
    {[0, 1, 2].map((ring) => (
      <g key={ring} opacity={0.5 + ring * 0.25}>
        {Array.from({ length: 9 - ring * 2 }, (_, i) => (
          <path
            key={i}
            transform={`translate(120 120) rotate(${(i * 360) / (9 - ring * 2) + ring * 17}) scale(${1 - ring * 0.27})`}
            d="M0 0C-48 -30 -58 -88 -12 -112C-4 -106 4 -106 12 -112C58 -88 48 -30 0 0Z"
            fill="var(--s-primary)"
            stroke="var(--s-bg)"
            strokeWidth="1"
            strokeOpacity=".55"
          />
        ))}
      </g>
    ))}
    {Array.from({ length: 12 }, (_, i) => (
      <circle key={i} cx={120 + Math.cos((i * Math.PI) / 6) * 9} cy={120 + Math.sin((i * Math.PI) / 6) * 9} r="1.800" fill="var(--s-bg)" opacity=".7" />
    ))}
  </svg>
);

/** Ramo em traço fino, usado nos temas botânicos. Desenho próprio, sem imagens externas. */
const Branch = ({ className = "" }: { className?: string }) => (
  <svg className={`ls-branch ${className}`} viewBox="0 0 160 320" fill="none" stroke="currentColor" strokeWidth="1.100" strokeLinecap="round" aria-hidden="true">
    <path d="M28 316C52 240 72 150 132 12" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => {
      const y = 270 - i * 38;
      const x = 44 + i * 12.5;
      return (
        <g key={i}>
          <path d={`M${x} ${y}c-24-4-38-16-44-36 22-2 40 10 44 36Z`} />
          <path d={`M${x} ${y}c6-22 20-34 42-38 2 22-14 36-42 38Z`} />
          <path d={`M${x} ${y}c-14-12-24-20-36-28M${x} ${y}c10-12 20-20 34-30`} opacity=".55" />
        </g>
      );
    })}
  </svg>
);

const cssUrl = (src: string) => `url("${src.replace(/"/g, "%22")}")`;

const Photo = ({ src, mobile, className = "" }: { src: string; mobile?: string; className?: string }) =>
  src ? (
    <div
      className={`ls-photo ${className}`}
      style={{ "--img": cssUrl(src), ...(mobile ? { "--img-m": cssUrl(mobile) } : {}) } as CSSProperties}
      role="img"
      aria-label="Foto do casal"
    />
  ) : (
    <div className={`ls-photo ls-photo-empty ${className}`} aria-hidden="true"><Icon name="heart" size={30} /></div>
  );

export function SiteHero({ data, layout }: { data: PublicSiteData; layout: HeroLayout }) {
  const { name1, name2 } = data.couple;
  const date = formatDate(data.wedding.date);
  const city = data.wedding.city;
  const meta = (
    <p className="ls-hero-meta">
      {date && <strong>{date}</strong>}
      {city && <span>{city}</span>}
    </p>
  );
  const names = (joiner: string) => (
    <h1 className="ls-names">
      <span>{name1}</span>
      <em>{joiner}</em>
      <span>{name2}</span>
    </h1>
  );
  const photo = data.intro.heroImage;
  const mobile = data.intro.heroImageMobile;
  const gallery = [photo, ...data.intro.gallery].filter(Boolean);

  switch (layout) {
    case "split":
      return (
        <div className="ls-hero ls-hero-split">
          <div>{names("&")}{meta}</div>
          <div><Photo src={photo} mobile={mobile} className="is-round" /><p className="ls-hero-tag">{data.intro.subtitle}</p></div>
        </div>
      );
    case "blob":
      return (
        <div className="ls-hero ls-hero-blob">
          <i className="ls-wash is-a" /><i className="ls-wash is-b" />
          <Branch className="is-corner" />
          <div>{names("&")}{meta}</div>
          <Photo src={photo} mobile={mobile} className="is-blob" />
        </div>
      );
    case "line":
    case "leaves":
      return (
        <div className={`ls-hero ls-hero-line${layout === "leaves" ? " is-leaves" : ""}`}>
          <Lily className="is-left" /><Lily className="is-right" />
          <Branch className="is-left" /><Branch className="is-right" />
          <p className="ls-hero-tag">{data.intro.subtitle}</p>
          {names("&")}{meta}
        </div>
      );
    case "script":
      return (
        <div className="ls-hero ls-hero-script">
          <svg className="ls-veins" viewBox="0 0 1000 500" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
            <path d="M0 330c120-40 180 40 300 10M760 0c-20 120 90 170 240 190M820 500c20-90 90-130 180-140" />
          </svg>
          <p className="ls-hero-tag">Save the date</p>
          {names("+")}{meta}
        </div>
      );
    case "photo":
      return (
        <div className="ls-hero ls-hero-photo">
          <Photo src={photo} mobile={mobile} className="is-cover" />
          <div className="ls-hero-veil">
            <div className="ls-monogram"><Branch /><span>{name1.charAt(0)}·{name2.charAt(0)}</span></div>
            {names("e")}{meta}
          </div>
          <svg className="ls-torn" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 60V26L60 34L130 18L210 30L300 14L380 28L470 12L560 30L650 16L740 32L830 14L920 28L1010 12L1100 30L1200 18V60Z" />
          </svg>
        </div>
      );
    case "oval":
      return (
        <div className="ls-hero ls-hero-oval">
          <div className="ls-oval-frame">
            <svg className="ls-geo" viewBox="0 0 400 500" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M200 8L372 112L352 392L200 492L48 392L28 112Z" strokeWidth="1.600" />
              <path d="M200 8L352 392M200 8L48 392M28 112L352 392M372 112L48 392M28 112H372M48 392H352" strokeWidth=".6" />
            </svg>
            <Photo src={photo} mobile={mobile} className="is-oval" />
            <Branch className="is-a" /><Branch className="is-b" />
          </div>
          {names("+")}{meta}
        </div>
      );
    case "mosaic":
      return (
        <div className="ls-hero ls-hero-mosaic">
          {names("+")}
          <div className="ls-mosaic">
            {[0, 1, 2].map((i) => <Photo key={i} src={gallery[i] ?? gallery[0] ?? ""} />)}
          </div>
          {meta}
        </div>
      );
    case "night":
      return (
        <div className="ls-hero ls-hero-night">
          <Bloom className="is-a" /><Bloom className="is-b" /><Bloom className="is-c" /><Bloom className="is-d" />
          <i className="ls-fan is-left" /><i className="ls-fan is-right" />
          <div className="ls-night-frame">{names("&")}</div>
          {meta}
        </div>
      );
  }
}

function useCountdown(date: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!date) return;
    const target = new Date(`${date}T12:00:00`).getTime();
    const tick = () => setLeft(target - Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [date]);
  return left;
}

export function Countdown({ date, sample = false }: { date: string; sample?: boolean }) {
  const left = useCountdown(date);
  if (!date && !sample) return null;
  const ms = Math.max(left ?? 0, 0);
  const units: [number, string][] = sample
    ? [[60, "dias"], [8, "horas"], [12, "minutos"], [54, "segundos"]]
    : [
        [Math.floor(ms / 86400000), "dias"],
        [Math.floor(ms / 3600000) % 24, "horas"],
        [Math.floor(ms / 60000) % 60, "minutos"],
        [Math.floor(ms / 1000) % 60, "segundos"],
      ];
  if (left !== null && left <= 0) {
    return <div className="ls-countdown"><h2>Chegou o grande dia!</h2></div>;
  }
  return (
    <div className="ls-countdown">
      <h2>Contagem regressiva</h2>
      <div className="ls-count-row">
        {units.map(([value, label]) => (
          <div key={label}><b>{left === null && !sample ? "–" : value}</b><small>{label}</small></div>
        ))}
      </div>
    </div>
  );
}

function VenueBlock({ venue }: { venue: Venue }) {
  const query = encodeURIComponent([venue.name, venue.address].filter(Boolean).join(", "));
  if (!venue.name && !venue.address) return <p className="ls-muted">Informe o local em Aparência do site › Editar seções.</p>;
  return (
    <>
      {venue.name && <h3>{venue.name}</h3>}
      {venue.time && <p className="ls-time">{venue.time}</p>}
      {venue.address && <p>{venue.address}</p>}
      {venue.notes && <p className="ls-muted">{venue.notes}</p>}
      {venue.address && (
        <div className="ls-map-links">
          <a className="ls-btn" href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noopener noreferrer">Google Maps</a>
          <a className="ls-btn ls-btn-outline" href={`https://waze.com/ul?q=${query}&navigate=yes`} target="_blank" rel="noopener noreferrer">Waze</a>
        </div>
      )}
    </>
  );
}

const Honeypot = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <input className="ls-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={value} onChange={(e) => onChange(e.target.value)} />
);

function RsvpForm({ slug, preview, config }: { slug: string; preview: boolean; config: PublicSiteData["rsvp"] }) {
  const [form, setForm] = useState({ name: "", phone: "", attending: true, adults: 1, children: 0, note: "", website: "" });
  const [companions, setCompanions] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const companionCount = config.fullNames === "all" ? Math.max(form.adults + form.children - 1, 0) : 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (preview) return setError("Esta é a pré-visualização: o formulário funciona no site publicado.");
    setState("sending");
    setError("");
    try {
      await api(`/api/casar/public/${slug}`, "POST", { action: "rsvp", ...form, companions: companions.slice(0, companionCount) });
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <p className="ls-thanks" role="status">
        {form.attending ? `Obrigado, ${form.name}! Sua presença está confirmada.` : `Obrigado por avisar, ${form.name}. Vamos sentir sua falta.`}
      </p>
    );
  }

  return (
    <form className="ls-form" onSubmit={(e) => void submit(e)}>
      <Honeypot value={form.website} onChange={(website) => setForm({ ...form, website })} />
      {config.intro && <p className="ls-center">{config.intro}</p>}
      {config.mode === "closed" && <p className="ls-muted ls-center">Digite seu nome como está no convite.</p>}
      <label><span>Seu nome completo</span><input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <fieldset className="ls-radio">
        <legend>Você vai?</legend>
        <label><input type="radio" name="attending" checked={form.attending} onChange={() => setForm({ ...form, attending: true })} /> Sim, estarei lá</label>
        <label><input type="radio" name="attending" checked={!form.attending} onChange={() => setForm({ ...form, attending: false })} /> Não poderei ir</label>
      </fieldset>
      {form.attending && (
        <div className="ls-form-2">
          <label><span>Adultos</span><input type="number" min={1} max={config.maxAdults} value={form.adults} onChange={(e) => setForm({ ...form, adults: Number(e.target.value) })} /></label>
          {config.maxChildren > 0 && (
            <label>
              <span>Crianças{config.childAge ? ` (até ${config.childAge} anos)` : ""}</span>
              <input type="number" min={0} max={config.maxChildren} value={form.children} onChange={(e) => setForm({ ...form, children: Number(e.target.value) })} />
            </label>
          )}
        </div>
      )}
      {form.attending && Array.from({ length: companionCount }, (_, i) => (
        <label key={i}>
          <span>Nome do acompanhante {i + 1}</span>
          <input
            required
            maxLength={120}
            value={companions[i] ?? ""}
            onChange={(e) => {
              const next = [...companions];
              next[i] = e.target.value;
              setCompanions(next);
            }}
          />
        </label>
      ))}
      <label><span>WhatsApp (opcional)</span><input inputMode="tel" maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      {config.showNotes && <label><span>Observação (restrição alimentar, por exemplo)</span><textarea rows={2} maxLength={500} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>}
      {error && <p className="ls-error" role="alert">{error}</p>}
      <button className="ls-btn" disabled={state === "sending"}>{state === "sending" ? "Enviando…" : "Confirmar resposta"}</button>
    </form>
  );
}

function Mural({ slug, preview, initial }: { slug: string; preview: boolean; initial: PublicMessage[] }) {
  const [messages, setMessages] = useState(initial);
  const [form, setForm] = useState({ author: "", text: "", website: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (preview) return setError("Esta é a pré-visualização: o mural funciona no site publicado.");
    setSending(true);
    setError("");
    try {
      const { message } = await api<{ message?: PublicMessage }>(`/api/casar/public/${slug}`, "POST", { action: "message", ...form });
      if (message) setMessages((list) => [message, ...list]);
      setForm({ author: "", text: "", website: "" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <form className="ls-form" onSubmit={(e) => void submit(e)}>
        <Honeypot value={form.website} onChange={(website) => setForm({ ...form, website })} />
        <label><span>Seu nome</span><input required maxLength={80} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></label>
        <label><span>Seu recado para os noivos</span><textarea required rows={3} maxLength={600} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></label>
        {error && <p className="ls-error" role="alert">{error}</p>}
        <button className="ls-btn" disabled={sending}>{sending ? "Enviando…" : "Deixar recado"}</button>
      </form>
      {messages.length > 0 && (
        <ul className="ls-messages">
          {messages.map((message) => (
            <li key={message.id}><p>{message.text}</p><strong>{message.author}</strong></li>
          ))}
        </ul>
      )}
    </>
  );
}

type PixInfo = { payload: string; qr: string; amount: number; holder: string };

const CARD_IDEAS = [
  "Que a vida a dois seja cheia de amor, parceria e boas risadas. Felicidades!",
  "Muitas felicidades ao casal! Que este seja o começo de uma linda história.",
  "Com muito carinho, desejo a vocês um lar cheio de alegria e paz.",
  "Que nunca falte amor, paciência e café na casa de vocês!",
];

/** Carrinho vazio com `free`: presente de valor livre, sem item da lista. */
function GiftModal({ slug, cart, free, enabled, onCart, onClose }: {
  slug: string;
  cart: GiftItem[];
  free: boolean;
  enabled: boolean;
  onCart: (items: GiftItem[]) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ guestName: "", phone: "", message: "", amount: "", website: "" });
  const [pix, setPix] = useState<PixInfo | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const itemIds = cart.map((item) => item.id);
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const payload = { ...form, itemIds, amount: Number(form.amount.replace(",", ".")) };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const generate = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => setPix(await api<PixInfo>(`/api/casar/public/${slug}`, "POST", { action: "pix", ...payload })));
  };
  const confirm = () => run(async () => {
    await api(`/api/casar/public/${slug}`, "POST", { action: "gift", ...payload });
    setDone(true);
    onCart([]);
  });
  const copy = async () => {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.payload);
    setCopied(true);
  };

  return (
    <div className="ls-modal" role="dialog" aria-modal="true" aria-label="Presentear os noivos" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ls-modal-card">
        <button type="button" className="ls-modal-close" aria-label="Fechar" onClick={onClose}><Icon name="close" /></button>
        <h3>{free ? "Presente de valor livre" : "Seus presentes"}</h3>
        {!enabled ? (
          <p>Os noivos ainda estão preparando o recebimento dos presentes. Volte em breve!</p>
        ) : done ? (
          <p className="ls-thanks" role="status">Obrigado, {form.guestName}! Os noivos vão receber seu carinho.</p>
        ) : pix ? (
          <>
            <p className="ls-pix-value">{brl(pix.amount)}{pix.holder ? ` para ${pix.holder}` : ""}</p>
            <div className="ls-qr" dangerouslySetInnerHTML={{ __html: pix.qr }} />
            <button type="button" className="ls-btn ls-btn-outline" onClick={() => void copy()}>{copied ? "Código copiado!" : "Copiar Pix copia e cola"}</button>
            <p className="ls-muted">Pague no app do seu banco e confira o nome de quem recebe. Depois, avise os noivos:</p>
            {error && <p className="ls-error" role="alert">{error}</p>}
            <button type="button" className="ls-btn" disabled={busy} onClick={() => void confirm()}>Já fiz o Pix</button>
          </>
        ) : (
          <form className="ls-form" onSubmit={generate}>
            <Honeypot value={form.website} onChange={(website) => setForm({ ...form, website })} />
            {free ? (
              <label><span>Valor (R$)</span><input required inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
            ) : (
              <>
                <ul className="ls-cart">
                  {cart.map((item, i) => (
                    <li key={`${item.id}-${i}`}>
                      <span>{item.emoji} {item.title}</span>
                      <span>{brl(item.price)}</span>
                      <button type="button" aria-label={`Remover ${item.title}`} onClick={() => onCart(cart.filter((_, index) => index !== i))}><Icon name="close" size={16} /></button>
                    </li>
                  ))}
                </ul>
                <p className="ls-pix-value">Total: {brl(total)}</p>
                <button type="button" className="ls-link" onClick={onClose}>Adicionar mais itens</button>
              </>
            )}
            <label><span>Seu nome</span><input required maxLength={120} value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} /></label>
            <label><span>WhatsApp (opcional, para os noivos agradecerem)</span><input inputMode="tel" maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label><span>Mensagem aos noivos (opcional)</span><textarea rows={3} maxLength={600} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
            <button
              type="button"
              className="ls-link"
              onClick={() => setForm({ ...form, message: CARD_IDEAS[(CARD_IDEAS.indexOf(form.message) + 1) % CARD_IDEAS.length] })}
            >
              Sugerir uma mensagem
            </button>
            {error && <p className="ls-error" role="alert">{error}</p>}
            <button className="ls-btn" disabled={busy || (!free && !cart.length)}>{busy ? "Gerando…" : "Gerar Pix"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

const GIFTS_PER_PAGE = 12;

function GiftList({ data, slug, preview }: { data: PublicSiteData; slug: string; preview: boolean }) {
  const [cart, setCart] = useState<GiftItem[]>([]);
  const [modal, setModal] = useState<"cart" | "free" | null>(null);
  const [category, setCategory] = useState("");
  const [shown, setShown] = useState(GIFTS_PER_PAGE);

  const items = useMemo(() => {
    const sorted = [...data.gifts.items];
    if (data.gifts.order === "asc") sorted.sort((a, b) => a.price - b.price);
    if (data.gifts.order === "desc") sorted.sort((a, b) => b.price - a.price);
    if (data.gifts.order === "az") sorted.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    return sorted;
  }, [data.gifts.items, data.gifts.order]);
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))] as string[];
  const filtered = category ? items.filter((item) => item.category === category) : items;

  const add = (item: GiftItem) => {
    if (preview) return;
    setCart((list) => [...list, item]);
    setModal("cart");
  };

  return (
    <>
      {categories.length > 1 && (
        <div className="ls-filters" role="group" aria-label="Filtrar presentes">
          <button type="button" aria-pressed={!category} className={!category ? "is-on" : ""} onClick={() => setCategory("")}>Todos</button>
          {categories.map((name) => (
            <button key={name} type="button" aria-pressed={category === name} className={category === name ? "is-on" : ""} onClick={() => { setCategory(name); setShown(GIFTS_PER_PAGE); }}>{name}</button>
          ))}
        </div>
      )}
      <ul className="ls-gifts">
        {filtered.slice(0, shown).map((item) => (
          <li key={item.id}>
            {item.image ? <Photo src={item.image} className="ls-gift-photo" /> : <span className="ls-gift-emoji" aria-hidden="true">{item.emoji || "🎁"}</span>}
            <strong>{item.title}</strong>
            {item.description && <small>{item.description}</small>}
            <span>{brl(item.price)}</span>
            <button type="button" className="ls-btn" onClick={() => add(item)}>Presentear</button>
          </li>
        ))}
        <li className="is-free">
          <span className="ls-gift-emoji" aria-hidden="true">💝</span>
          <strong>Valor livre</strong>
          <span>Você escolhe quanto</span>
          <button type="button" className="ls-btn ls-btn-outline" onClick={() => !preview && setModal("free")}>Presentear</button>
        </li>
      </ul>
      {filtered.length > shown && <button type="button" className="ls-btn ls-btn-outline" onClick={() => setShown(shown + GIFTS_PER_PAGE)}>Ver mais presentes</button>}
      {cart.length > 0 && !modal && (
        <button type="button" className="ls-cart-open" onClick={() => setModal("cart")}>
          <Icon name="gift" /> {cart.length} {cart.length === 1 ? "presente" : "presentes"} · Finalizar
        </button>
      )}
      {data.gifts.external.length > 0 && (
        <div className="ls-external">
          <p>Também temos lista em:</p>
          {data.gifts.external.map((list) => {
            const url = safeUrl(list.url);
            return url ? <a key={list.id} className="ls-btn ls-btn-outline" href={url} target="_blank" rel="noopener noreferrer nofollow">{list.name}</a> : null;
          })}
          {data.gifts.external.filter((list) => list.address).map((list) => <p key={list.id} className="ls-muted">{list.name}: {list.address}</p>)}
        </div>
      )}
      {modal && <GiftModal slug={slug} cart={modal === "free" ? [] : cart} free={modal === "free"} enabled={data.gifts.pixEnabled} onCart={setCart} onClose={() => setModal(null)} />}
    </>
  );
}

function Gallery({ photos }: { photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => ((i ?? 0) + 1) % photos.length);
      if (e.key === "ArrowLeft") setOpen((i) => ((i ?? 0) - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  return (
    <>
      <div className="ls-gallery">
        {photos.map((photo, i) => (
          <button key={`${photo}-${i}`} type="button" aria-label={`Ampliar foto ${i + 1}`} onClick={() => setOpen(i)}>
            <Photo src={photo} />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="ls-lightbox" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
          <button type="button" className="ls-modal-close" aria-label="Fechar" onClick={() => setOpen(null)}><Icon name="close" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open]} alt={`Foto ${open + 1} de ${photos.length}`} />
          {photos.length > 1 && (
            <div className="ls-lightbox-nav">
              <button type="button" aria-label="Foto anterior" onClick={() => setOpen((open - 1 + photos.length) % photos.length)}><Icon name="left" /></button>
              <button type="button" aria-label="Próxima foto" onClick={() => setOpen((open + 1) % photos.length)}><Icon name="right" /></button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/** Introdução em fotos: aparece ao abrir o site e pode ser pulada. */
function IntroSlider({ photos, seconds, onDone }: { photos: string[]; seconds: number; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => (index + 1 < photos.length ? setIndex(index + 1) : onDone()), Math.max(seconds, 1) * 1000);
    return () => clearTimeout(timer);
  }, [index, photos.length, seconds, onDone]);
  return (
    <div className="ls-slider" role="dialog" aria-label="Introdução em fotos">
      {photos.map((photo, i) => <Photo key={`${photo}-${i}`} src={photo} className={`ls-slide${i === index ? " is-on" : ""}`} />)}
      <button type="button" className="ls-btn" onClick={onDone}>Entrar no site</button>
    </div>
  );
}

const NAV_LABELS: Record<SectionId, string> = {
  about: "O casal",
  gallery: "Fotos",
  padrinhos: "Padrinhos",
  ceremony: "Cerimônia",
  party: "Festa",
  dresscode: "Traje",
  lodging: "Hospedagem",
  gifts: "Presentes",
  rsvp: "Confirmar presença",
  mural: "Recados",
};

type Props = {
  slug: string;
  data: PublicSiteData;
  messages: PublicMessage[];
  /** Dentro do painel: formulários não enviam e seções vazias mostram o que falta preencher. */
  preview?: boolean;
  narrow?: boolean;
};

export default function SiteView({ slug, data, messages, preview = false, narrow = false }: Props) {
  const { theme } = paletteOf(data);
  const tracks = data.music.tracks.map(youtubeId).filter(Boolean);
  const [musicOn, setMusicOn] = useState(data.music.autoplay);
  const [sliderDone, setSliderDone] = useState(false);
  const on = data.sections;
  const slider = data.intro.slider;
  const hideSlider = () => setSliderDone(true);

  const label = (id: SectionId) => sectionLabel(data, id);
  const hasContent: Partial<Record<SectionId, boolean>> = {
    about: preview || Boolean(data.couple.story || data.couple.photo1 || data.couple.photo2),
    gallery: preview || data.gallery.length > 0,
    padrinhos: preview || data.padrinhos.length > 0,
    ceremony: preview || Boolean(data.ceremony.name || data.ceremony.address),
    party: preview || Boolean(data.party.name || data.party.address),
    dresscode: preview || Boolean(data.dressCode),
    lodging: preview || data.lodging.length > 0,
    gifts: data.gifts.visible,
  };
  const visible = (id: string) => {
    const custom = data.customSections.find((section) => section.id === id);
    if (custom) return custom.visible;
    return on[id as SectionId] && hasContent[id as SectionId] !== false;
  };
  const titleOf = (id: string) => data.customSections.find((section) => section.id === id)?.title || label(id as SectionId);

  const sections: Record<SectionId, () => ReactNode> = {
    about: () => (
      <>
        <div className="ls-couple">
          {[{ name: data.couple.name1, photo: data.couple.photo1 }, { name: data.couple.name2, photo: data.couple.photo2 }].map((person, i) => (
            <figure key={i}><Photo src={person.photo} className="is-round" /><figcaption>{person.name}</figcaption></figure>
          ))}
        </div>
        {data.couple.story ? <p className="ls-story">{data.couple.story}</p> : <p className="ls-muted">Conte a história de vocês em Aparência do site › Editar seções.</p>}
      </>
    ),
    gallery: () => (data.gallery.length ? <Gallery photos={data.gallery} /> : <p className="ls-muted">Envie as fotos em Aparência do site › Editar seções.</p>),
    padrinhos: () => (data.padrinhos.length ? (
      <ul className="ls-people">
        {data.padrinhos.map((person) => (
          <li key={person.id}><Photo src={person.photo} className="is-round" /><strong>{person.name}</strong>{person.role && <span>{person.role}</span>}</li>
        ))}
      </ul>
    ) : <p className="ls-muted">Adicione os padrinhos em Aparência do site › Editar seções.</p>),
    ceremony: () => <VenueBlock venue={data.ceremony} />,
    party: () => <VenueBlock venue={data.party} />,
    dresscode: () => <p className="ls-story">{data.dressCode || "Conte qual é o traje em Aparência do site › Editar seções."}</p>,
    lodging: () => (data.lodging.length ? (
      <ul className="ls-lodging">
        {data.lodging.map((place) => {
          const url = safeUrl(place.url);
          return (
            <li key={place.id}>
              <strong>{place.name}</strong>
              {place.notes && <p>{place.notes}</p>}
              {url && <a href={url} target="_blank" rel="noopener noreferrer nofollow">Ver mais</a>}
            </li>
          );
        })}
      </ul>
    ) : <p className="ls-muted">Indique hotéis e dicas em Aparência do site › Editar seções.</p>),
    gifts: () => (
      <>
        {data.gifts.about && <p className="ls-story">{data.gifts.about}</p>}
        <GiftList data={data} slug={slug} preview={preview} />
      </>
    ),
    rsvp: () => <RsvpForm key={data.rsvp.mode} slug={slug} preview={preview} config={data.rsvp} />,
    mural: () => <Mural slug={slug} preview={preview} initial={messages} />,
  };

  const order = data.sectionOrder.filter(visible);

  return (
    <div className={`ls-root is-${theme.layout} t-${theme.id}${data.theme.decor ? "" : " no-decor"}${narrow ? " is-narrow" : ""}`} style={themeStyle(data)}>
      <nav className="ls-nav" aria-label="Seções do site">
        <a href="#inicio">Início</a>
        {order.map((id) => <a key={id} href={`#${id}`}>{data.sectionLabels[id]?.trim() || NAV_LABELS[id as SectionId] || titleOf(id)}</a>)}
      </nav>

      <div id="inicio"><SiteHero data={data} layout={theme.layout} /></div>
      <Countdown date={data.wedding.date} />

      {data.intro.welcome && (
        <section className="ls-section ls-center ls-welcome">
          <Divider />
          <h2>Boas-vindas ao nosso site</h2>
          <p>{data.intro.welcome}</p>
        </section>
      )}

      {order.map((id, i) => {
        const custom = data.customSections.find((section) => section.id === id);
        const video = custom ? youtubeId(custom.video) : "";
        return (
          <section key={id} id={id} className={`ls-section ls-center${i % 2 === 0 ? " ls-tint" : ""}`}>
            <Divider />
            <h2>{titleOf(id)}</h2>
            {custom ? (
              <>
                {custom.photo && <Photo src={custom.photo} className="ls-custom-photo" />}
                {custom.text && <p className="ls-story">{custom.text}</p>}
                {video && (
                  <iframe className="ls-video" title={custom.title || "Vídeo"} src={`https://www.youtube-nocookie.com/embed/${video}`} allow="encrypted-media; picture-in-picture" allowFullScreen />
                )}
              </>
            ) : sections[id as SectionId]()}
          </section>
        );
      })}

      <footer className="ls-footer">
        <p className="ls-footer-names">{coupleNames(data)}</p>
        <a href="/lp-casar">Feito com LP Casar</a>
      </footer>

      {tracks.length > 0 && !preview && (
        <div className="ls-music">
          <button type="button" className="ls-music-btn" aria-pressed={musicOn} aria-label={musicOn ? "Parar música" : "Tocar música"} onClick={() => setMusicOn(!musicOn)}>
            <Icon name={musicOn ? "close" : "music"} />
          </button>
          {musicOn && (
            <iframe title="Música do casal" width="1" height="1" allow="autoplay" src={`https://www.youtube-nocookie.com/embed/${tracks[0]}?autoplay=1&loop=1&playlist=${tracks.join(",")}`} />
          )}
        </div>
      )}

      {slider.enabled && slider.photos.length > 0 && !preview && !sliderDone && (
        <IntroSlider photos={slider.photos} seconds={slider.seconds} onDone={hideSlider} />
      )}
    </div>
  );
}
