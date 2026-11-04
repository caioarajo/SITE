"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPublicData, type SiteData } from "@/lib/casar/types";
import { ExternalListsPanel, GiftListPanel, GiftSettingsPanel, GiftsReceivedPanel, WalletPanel } from "./panels/gifts";
import { GuestsPanel, MuralPanel, RsvpPanel, RsvpSettingsPanel } from "./panels/guests";
import { CouplePanel, ContactPanel, DownloadPanel, FaqPanel, PrivacyPanel, StationeryPanel, WeddingPanel } from "./panels/other";
import { BudgetPanel, ChecklistPanel } from "./panels/planning";
import { CustomizePanel, IntroPanel, MusicPanel, SectionsPanel, ThemePanel } from "./panels/appearance";
import SiteView from "./SiteView";
import Tour, { type TourStep } from "./Tour";
import { api, Field, Icon, Logo } from "./ui";

export type EditorData = Omit<SiteData, "secret">;
export type PanelProps = {
  data: EditorData;
  update: (recipe: (draft: EditorData) => EditorData) => void;
  slug: string;
  siteUrl: string;
  whatsapp: string;
  email: string;
};

type PanelId =
  | "theme" | "customize" | "intro" | "sections" | "music"
  | "guests" | "rsvp" | "rsvp-settings" | "mural"
  | "save-the-date" | "invite" | "notice"
  | "checklist" | "budget"
  | "assessoria" | "domain" | "download" | "faq"
  | "gift-list" | "gifts-received" | "gift-settings" | "external-lists" | "wallet"
  | "wedding" | "couple" | "privacy";

/** Telas de tabela ocupam a área do site; as demais abrem ao lado da pré-visualização. */
const FULL_PANELS: PanelId[] = ["guests", "rsvp", "mural", "gifts-received", "wallet", "save-the-date", "invite", "notice", "checklist", "budget"];

const PANEL_TITLES: Record<PanelId, string> = {
  theme: "Alterar tema",
  customize: "Personalizar tema",
  intro: "Editar introdução do site",
  sections: "Editar seções do site",
  music: "Configurar música",
  guests: "Lista de convidados",
  rsvp: "Confirmações de presença",
  "rsvp-settings": "Configurar confirmação",
  mural: "Mural de recados",
  "save-the-date": "Save the date",
  invite: "Convite digital",
  notice: "Comunicado",
  checklist: "Checklist do casamento",
  budget: "Orçamento do casamento",
  download: "Download do site",
  assessoria: "Assessoria e cerimonial",
  domain: "Domínio personalizado",
  faq: "Perguntas frequentes",
  "gift-list": "Editar lista de presentes",
  "gifts-received": "Presentes recebidos",
  "gift-settings": "Configurar lista",
  "external-lists": "Adicionar outras listas",
  wallet: "Minha carteira",
  wedding: "Dados do casamento",
  couple: "Dados do casal",
  privacy: "Privacidade do site",
};

const MENU: { id: string; icon: string; label: string; items: { id: PanelId | "tour"; label: string }[] }[] = [
  {
    id: "look", icon: "monitor", label: "Aparência do site",
    items: [
      { id: "theme", label: "Alterar tema" },
      { id: "customize", label: "Personalizar tema" },
      { id: "intro", label: "Editar introdução do site" },
      { id: "sections", label: "Editar seções do site" },
      { id: "music", label: "Configurar música" },
    ],
  },
  {
    id: "guests", icon: "users", label: "Meus convidados",
    items: [
      { id: "guests", label: "Lista de convidados" },
      { id: "rsvp", label: "Confirmações de presença" },
      { id: "rsvp-settings", label: "Configurar confirmação" },
      { id: "mural", label: "Mural de recados" },
    ],
  },
  {
    id: "paper", icon: "mail", label: "Papelaria",
    items: [
      { id: "save-the-date", label: "Save the date" },
      { id: "invite", label: "Convite digital" },
      { id: "notice", label: "Comunicado" },
    ],
  },
  {
    id: "planning", icon: "list", label: "Planejamento",
    items: [
      { id: "checklist", label: "Checklist" },
      { id: "budget", label: "Orçamento" },
    ],
  },
  { id: "advice", icon: "heart", label: "Assessoria", items: [{ id: "assessoria", label: "Falar com a LP" }] },
  { id: "services", icon: "card", label: "Serviços adicionais", items: [{ id: "domain", label: "Domínio personalizado" }, { id: "download", label: "Download do site" }] },
  {
    id: "help", icon: "help", label: "Central de Ajuda",
    items: [
      { id: "tour", label: "Ver o tutorial de novo" },
      { id: "faq", label: "Perguntas frequentes" },
    ],
  },
];

const SEEN_KEY = "lp-casar-seen";

const Badge = ({ count }: { count: number }) => (count > 0 ? <span className="lc-badge" aria-label={`${count} novos`}>{count}</span> : null);

export default function Editor({ email, initialSlug, initialData, whatsapp }: { email: string; initialSlug: string; initialData: EditorData; whatsapp: string }) {
  const [data, setData] = useState(initialData);
  const [slug, setSlug] = useState(initialSlug);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [saveError, setSaveError] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [topMenu, setTopMenu] = useState<"gifts" | "account" | null>(null);
  const [sidebar, setSidebar] = useState(true);
  const [settings, setSettings] = useState(false);
  const [tour, setTour] = useState(!initialData.tourDone);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingLink, setEditingLink] = useState(false);
  const [linkDraft, setLinkDraft] = useState(initialSlug);
  const [linkError, setLinkError] = useState("");
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [summary, setSummary] = useState({ views: 0, rsvps: 0, messages: 0, gifts: 0 });
  const [seen, setSeen] = useState({ rsvps: 0, messages: 0, gifts: 0 });
  const dirty = useRef(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    if (window.innerWidth < 900) setSidebar(false);
  }, []);

  // Avisos no painel: compara o total atual com o que os noivos já viram neste navegador.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SEEN_KEY);
      if (stored) setSeen(JSON.parse(stored) as typeof seen);
    } catch {
      // Sem armazenamento disponível: os números só voltam a zerar nesta visita.
    }
    const load = () => void api<typeof summary>("/api/casar/summary", "GET").then(setSummary).catch(() => undefined);
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  const markSeen = (kind: keyof typeof seen) => {
    setSeen((current) => {
      const next = { ...current, [kind]: summary[kind] };
      try {
        window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      } catch {
        // Idem.
      }
      return next;
    });
  };
  const badges: Record<string, number> = {
    rsvp: summary.rsvps - seen.rsvps,
    mural: summary.messages - seen.messages,
    "gifts-received": summary.gifts - seen.gifts,
  };
  const groupBadge = badges.rsvp + badges.mural;

  const siteUrl = `${origin}/lp-casar/${slug}`;
  const update: PanelProps["update"] = useCallback((recipe) => {
    dirty.current = true;
    setData((current) => recipe(current));
    setSaveState("saving");
  }, []);

  // Salva sozinho depois de uma pausa na digitação.
  useEffect(() => {
    if (!dirty.current) return;
    const timer = setTimeout(() => {
      dirty.current = false;
      api("/api/casar/site", "PATCH", { data })
        .then(() => setSaveState("saved"))
        .catch((err: Error) => {
          setSaveError(err.message);
          setSaveState("error");
        });
    }, 700);
    return () => clearTimeout(timer);
  }, [data]);

  // Não deixa fechar a aba com alteração ainda não salva.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  const openPanel = (id: PanelId | "tour") => {
    setTopMenu(null);
    if (id === "tour") {
      setPanel(null);
      setTour(true);
      return;
    }
    setPanel(id);
    if (id === "rsvp") markSeen("rsvps");
    if (id === "mural") markSeen("messages");
    if (id === "gifts-received") markSeen("gifts");
    if (window.innerWidth < 900) setSidebar(false);
  };

  const finishTour = useCallback(() => {
    setTour(false);
    setTopMenu(null);
    update((current) => (current.tourDone ? current : { ...current, tourDone: true }));
  }, [update]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    const text = `Preparamos um site para o nosso casamento! Veja os detalhes: ${siteUrl}`;
    if (navigator.share) {
      await navigator.share({ title: "Nosso casamento", text, url: siteUrl }).catch(() => undefined);
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
  };

  const downloadQr = async () => {
    const url = await QRCode.toDataURL(siteUrl, { width: 1024, margin: 2 });
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${slug}.png`;
    link.click();
  };

  const saveLink = async () => {
    setLinkError("");
    try {
      await api("/api/casar/site", "PATCH", { slug: linkDraft });
      setSlug(linkDraft);
      setEditingLink(false);
    } catch (err) {
      setLinkError((err as Error).message);
    }
  };

  const logout = async () => {
    await api("/api/casar/auth", "POST", { action: "logout" });
    window.location.href = "/lp-casar";
  };

  const tourSteps = useMemo<TourStep[]>(() => [
    {
      icon: "pencil",
      title: "Boas-vindas à edição do site!",
      body: <p>Vamos mostrar onde ficam as principais ferramentas para vocês editarem o site. É rápido.</p>,
    },
    {
      target: "account", icon: "users", title: "Dados do site em \"Minha Conta\"",
      body: <p>Aqui vocês editam a data e o local do casamento, o nome do casal e a privacidade do site.</p>,
    },
    {
      target: "look", icon: "monitor", title: "Personalizem do jeito de vocês",
      prepare: () => { setSidebar(true); setSettings(false); setMenuOpen("look"); },
      body: <p>Troquem o tema, ajustem as cores, editem as seções e escolham a música do site.</p>,
    },
    {
      target: "gifts", icon: "gift", title: "Editem a lista de presentes",
      prepare: () => setMenuOpen(null),
      body: <p>Montem uma lista só de vocês, acompanhem os presentes recebidos e incluam listas de outras lojas.</p>,
    },
    {
      target: "share", icon: "share", title: "Compartilhem o site facilmente!",
      prepare: () => { setSidebar(true); setSettings(true); },
      body: (
        <ul className="lc-tour-list">
          <li>Ver o site como convidado</li>
          <li>Compartilhar o link</li>
          <li>Alterar ou copiar o link</li>
        </ul>
      ),
    },
    {
      target: "wallet", icon: "wallet", title: "Os presentes ficam na Carteira",
      body: <p>Cadastrem a chave Pix e acompanhem o total recebido. O dinheiro vai direto para a conta de vocês.</p>,
    },
    {
      target: "collapse", icon: "left", title: "O menu está atrapalhando?",
      body: <p>Nesta setinha vocês escondem o menu lateral para ter mais foco no que estão editando.</p>,
    },
    {
      icon: "heart", title: "Vamos começar?",
      prepare: () => setSettings(false),
      body: (
        <p>
          Que tal começar cadastrando a chave Pix para receber os presentes?{" "}
          <button type="button" className="lc-inline-link" onClick={() => { finishTour(); setPanel("wallet"); }}>Abrir a Carteira</button>.
          {" "}Este tutorial fica sempre disponível na Central de Ajuda.
        </p>
      ),
    },
  ], [finishTour]);

  const props: PanelProps = { data, update, slug, siteUrl, whatsapp, email };
  const isFull = panel !== null && FULL_PANELS.includes(panel);

  const content = panel && {
    theme: <ThemePanel {...props} />,
    customize: <CustomizePanel {...props} />,
    intro: <IntroPanel {...props} />,
    sections: <SectionsPanel {...props} />,
    music: <MusicPanel {...props} />,
    guests: <GuestsPanel {...props} />,
    rsvp: <RsvpPanel {...props} />,
    "rsvp-settings": <RsvpSettingsPanel {...props} />,
    mural: <MuralPanel />,
    "save-the-date": <StationeryPanel key="save-the-date" {...props} kind="save-the-date" />,
    invite: <StationeryPanel key="invite" {...props} kind="invite" />,
    notice: <StationeryPanel key="notice" {...props} kind="notice" />,
    checklist: <ChecklistPanel {...props} />,
    budget: <BudgetPanel {...props} />,
    download: <DownloadPanel />,
    assessoria: <ContactPanel {...props} topic="assessoria" />,
    domain: <ContactPanel {...props} topic="domain" />,
    faq: <FaqPanel />,
    "gift-list": <GiftListPanel {...props} />,
    "gifts-received": <GiftsReceivedPanel {...props} />,
    "gift-settings": <GiftSettingsPanel {...props} />,
    "external-lists": <ExternalListsPanel {...props} />,
    wallet: <WalletPanel {...props} />,
    wedding: <WeddingPanel {...props} />,
    couple: <CouplePanel {...props} />,
    privacy: <PrivacyPanel {...props} />,
  }[panel];

  return (
    <div className="lc-root lc-editor">
      <header className="lc-top">
        <button type="button" className="lc-icon-btn lc-top-menu" aria-label="Abrir ou fechar o menu" aria-expanded={sidebar} onClick={() => setSidebar(!sidebar)}><Icon name="menu" /></button>
        <Logo />
        <nav aria-label="Painel">
          <button type="button" className={`lc-top-link${!panel ? " is-on" : ""}`} onClick={() => { setPanel(null); setTopMenu(null); }}>Editar meu site</button>
          <div className="lc-drop" data-tour="gifts">
            <button type="button" className="lc-top-link" aria-expanded={topMenu === "gifts"} onClick={() => setTopMenu(topMenu === "gifts" ? null : "gifts")}>Lista de Presentes <Badge count={badges["gifts-received"]} /> <Icon name="down" size={16} /></button>
            {topMenu === "gifts" && (
              <div className="lc-drop-menu">
                <button type="button" onClick={() => openPanel("gift-list")}>Editar lista de presentes</button>
                <button type="button" onClick={() => openPanel("gifts-received")}>Presentes recebidos <Badge count={badges["gifts-received"]} /></button>
                <button type="button" onClick={() => openPanel("gift-settings")}>Configurar lista</button>
                <button type="button" onClick={() => openPanel("external-lists")}>Adicionar outras listas</button>
              </div>
            )}
          </div>
          <button type="button" className={`lc-top-link${panel === "wallet" ? " is-on" : ""}`} data-tour="wallet" onClick={() => openPanel("wallet")}>Minha Carteira</button>
          <div className="lc-drop" data-tour="account">
            <button type="button" className="lc-top-link" aria-expanded={topMenu === "account"} onClick={() => setTopMenu(topMenu === "account" ? null : "account")}>
              <span className="lc-avatar" aria-hidden="true"><Icon name="users" size={16} /></span> Minha Conta <Icon name="down" size={16} />
            </button>
            {topMenu === "account" && (
              <div className="lc-drop-menu is-right">
                <p className="lc-drop-who"><strong>{data.couple.name1} &amp; {data.couple.name2}</strong><span>{email}</span></p>
                <button type="button" onClick={() => openPanel("wedding")}>Dados do casamento</button>
                <button type="button" onClick={() => openPanel("couple")}>Dados do casal</button>
                <button type="button" onClick={() => openPanel("privacy")}>Privacidade do site</button>
                <button type="button" onClick={() => void logout()}><Icon name="logout" size={16} /> Sair</button>
              </div>
            )}
          </div>
        </nav>
        <span className={`lc-save is-${saveState}`} role="status">
          {saveState === "saved" ? "Tudo salvo" : saveState === "saving" ? "Salvando…" : saveError || "Erro ao salvar"}
        </span>
      </header>

      <div className="lc-body">
        {sidebar ? (
          <aside className="lc-side" aria-label="Menu do site">
            <div className="lc-side-settings-head">
              <button type="button" className="lc-side-settings" aria-expanded={settings} onClick={() => setSettings(!settings)}>
                <span className="lc-side-icon"><Icon name="gear" /></span> Configurações
              </button>
              <button type="button" className="lc-icon-btn" data-tour="collapse" aria-label="Esconder o menu" onClick={() => setSidebar(false)}><Icon name="left" size={18} /></button>
            </div>

            {settings && (
              <div className="lc-settings">
                <button type="button" className="lc-qr-btn" onClick={() => void downloadQr()} aria-label="Baixar QR Code do site"><Icon name="qr" size={34} /></button>
                <p className="lc-settings-label">Este é o endereço do seu site:</p>
                <p className="lc-settings-url">{siteUrl.replace(/^https?:\/\//, "")}</p>
                <p className="lc-muted">{summary.views} {summary.views === 1 ? "acesso" : "acessos"} ao site</p>
                <div className="lc-icon-row" data-tour="share">
                  <a className="lc-icon-btn is-filled" href={`/lp-casar/${slug}`} target="_blank" rel="noopener noreferrer" aria-label="Ver como convidado" title="Ver como convidado"><Icon name="eye" /></a>
                  <button type="button" className="lc-icon-btn is-filled" aria-label="Compartilhar o link" title="Compartilhar o link" onClick={() => void share()}><Icon name="share" /></button>
                  <button type="button" className="lc-icon-btn is-filled" aria-label="Alterar o link" title="Alterar o link" onClick={() => { setLinkDraft(slug); setEditingLink(!editingLink); }}><Icon name="pencil" /></button>
                  <button type="button" className="lc-icon-btn is-filled" aria-label="Copiar o link" title="Copiar o link" onClick={() => void copyLink()}><Icon name={copied ? "check" : "copy"} /></button>
                </div>
                {editingLink && (
                  <div className="lc-link-edit">
                    <Field label="Novo link" hint="Links antigos já enviados deixam de funcionar." value={linkDraft} onChange={(e) => setLinkDraft(e.target.value.toLowerCase())} />
                    {linkError && <p className="lc-error" role="alert">{linkError}</p>}
                    <button type="button" className="lc-btn lc-btn-sm" onClick={() => void saveLink()}>Salvar link</button>
                  </div>
                )}
              </div>
            )}

            <div className="lc-side-menu">
              {MENU.map((group) => (
                <div key={group.id} className="lc-side-group" data-tour={group.id}>
                  <button type="button" aria-expanded={menuOpen === group.id} onClick={() => setMenuOpen(menuOpen === group.id ? null : group.id)}>
                    <Icon name={group.icon} size={22} /><span>{group.label}</span>{group.id === "guests" && <Badge count={groupBadge} />}<Icon name="down" size={16} />
                  </button>
                  {menuOpen === group.id && (
                    <div className="lc-side-items">
                      {group.items.map((item) => (
                        <button key={item.id} type="button" className={panel === item.id ? "is-on" : ""} onClick={() => openPanel(item.id)}>{item.label} <Badge count={badges[item.id] ?? 0} /></button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="lc-side-foot">
              <p><strong>Está gostando do LP Casar?</strong> Indique para quem vai casar</p>
              <a className="lc-btn lc-btn-sm lc-btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(`Estou fazendo o site do meu casamento no LP Casar. Veja: ${origin}/lp-casar`)}`} target="_blank" rel="noopener noreferrer">Indicar pelo WhatsApp</a>
            </div>
          </aside>
        ) : (
          <button type="button" className="lc-side-open" aria-label="Mostrar o menu" onClick={() => setSidebar(true)}><Icon name="right" size={16} /></button>
        )}

        {panel && !isFull && (
          <section className="lc-drawer" aria-label={PANEL_TITLES[panel]}>
            <div className="lc-drawer-head">
              <h2>{PANEL_TITLES[panel]}</h2>
              <button type="button" className="lc-icon-btn" aria-label="Fechar" onClick={() => setPanel(null)}><Icon name="close" /></button>
            </div>
            <div className="lc-drawer-body">{content}</div>
          </section>
        )}

        <main className="lc-stage">
          {panel && isFull ? (
            <div className="lc-full">
              <div className="lc-full-head">
                <h1>{PANEL_TITLES[panel]}</h1>
                <button type="button" className="lc-text-btn" onClick={() => setPanel(null)}>Voltar ao site</button>
              </div>
              {content}
            </div>
          ) : (
            <>
              <div className="lc-device" role="group" aria-label="Visualização">
                <button type="button" aria-pressed={device === "desktop"} className={device === "desktop" ? "is-on" : ""} aria-label="Ver no computador" onClick={() => setDevice("desktop")}><Icon name="monitor" size={18} /></button>
                <button type="button" aria-pressed={device === "phone"} className={device === "phone" ? "is-on" : ""} aria-label="Ver no celular" onClick={() => setDevice("phone")}><Icon name="phone" size={18} /></button>
              </div>
              <div className={device === "phone" ? "lc-phone-preview" : ""}>
                <SiteView slug={slug} data={toPublicData({ ...data })} messages={[]} preview narrow={device === "phone"} />
              </div>
            </>
          )}
        </main>
      </div>

      {tour && <Tour steps={tourSteps} onClose={finishTour} />}
    </div>
  );
}
