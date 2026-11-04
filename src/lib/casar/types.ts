import { THEMES } from "./themes";

// Tudo o que os noivos editam fica neste documento; convidados, confirmações,
// recados e presentes são registros à parte (ver store.ts).

export type Venue = { name: string; address: string; time: string; notes: string };
export type Padrinho = { id: string; name: string; role: string; photo: string };
export type Lodging = { id: string; name: string; url: string; notes: string };
export type GiftItem = { id: string; title: string; price: number; emoji: string; image?: string; description?: string; category?: string };
export type ExternalList = { id: string; name: string; url: string; address?: string };
export type CustomSection = { id: string; title: string; text: string; photo: string; video: string; visible: boolean };
export type RsvpConfig = {
  mode: "open" | "closed";
  title: string;
  intro: string;
  fullNames: "all" | "one";
  maxAdults: number;
  maxChildren: number;
  childAge: number | null;
  showNotes: boolean;
};
export type PlanTask = { id: string; title: string; when: string; done: boolean };
export type BudgetLine = { id: string; item: string; estimated: number; paid: number };
export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random";
export type SectionId = "about" | "gallery" | "padrinhos" | "ceremony" | "party" | "dresscode" | "lodging" | "gifts" | "rsvp" | "mural";

export type SiteData = {
  couple: { name1: string; name2: string; story: string; photo1: string; photo2: string };
  wedding: { date: string; city: string };
  theme: { id: string; palette: number; custom: { primary: string; accent: string } | null; font: string; decor: boolean };
  intro: {
    subtitle: string;
    welcome: string;
    heroImage: string;
    heroImageMobile: string;
    gallery: string[];
    slider: { enabled: boolean; photos: string[]; seconds: number };
  };
  sections: Record<SectionId, boolean>;
  /** Ordem do menu e do site: ids de SectionId e de customSections. */
  sectionOrder: string[];
  sectionLabels: Record<string, string>;
  customSections: CustomSection[];
  gallery: string[];
  rsvp: RsvpConfig;
  ceremony: Venue;
  party: Venue;
  padrinhos: Padrinho[];
  dressCode: string;
  lodging: Lodging[];
  gifts: {
    about: string;
    visible: boolean;
    order: "asc" | "desc" | "az";
    items: GiftItem[];
    external: ExternalList[];
    pix: { keyType: PixKeyType; key: string; holder: string; city: string };
  };
  music: { tracks: string[]; autoplay: boolean };
  privacy: { searchable: boolean; hasPassword: boolean };
  notifications: { email: boolean; address: string };
  planning: { tasks: PlanTask[]; budget: BudgetLine[] };
  tourDone: boolean;
  /** Só existe no servidor: nunca sai nas respostas da API. */
  secret?: { passwordHash?: string };
};

/** O que o convidado recebe: sem a chave Pix e sem nada de `secret`. */
export type PublicSiteData = Omit<SiteData, "secret" | "gifts" | "notifications" | "planning"> & {
  gifts: Omit<SiteData["gifts"], "pix"> & { pixEnabled: boolean };
};

export type PublicMessage = { id: string; author: string; text: string; createdAt: string };

export type Guest = { name: string; phone: string; group: string; companions: number };
export type Rsvp = { name: string; attending: boolean; adults: number; children: number; phone: string; note: string; companions?: string[] };
export type Message = { author: string; text: string; hidden: boolean };
export type GiftStatus = "pending" | "confirmed" | "rejected";
export type GiftRecord = { guestName: string; phone?: string; message: string; title: string; amount: number; status: GiftStatus; thanked?: boolean };

export type RecordKind = "guests" | "rsvps" | "messages" | "gifts";
export type RecordData = { guests: Guest; rsvps: Rsvp; messages: Message; gifts: GiftRecord };
export type Row<K extends RecordKind> = { id: string; createdAt: string; data: RecordData[K] };

export const SECTION_LABELS: Record<SectionId, string> = {
  about: "Sobre o casal",
  gallery: "Mural de fotos",
  padrinhos: "Sobre os padrinhos",
  ceremony: "Local da cerimônia",
  party: "Local da festa",
  dresscode: "Dress code",
  lodging: "Hospedagem e dicas",
  gifts: "Lista de presentes",
  rsvp: "Confirme sua presença",
  mural: "Mural de recados",
};

export const WIZARD_SECTIONS: SectionId[] = ["about", "ceremony", "party", "padrinhos", "mural"];

type GiftSeed = [string, number, string];
const seed = (prefix: string, category: string, rows: GiftSeed[]): GiftItem[] =>
  rows.map(([title, price, emoji], i) => ({ id: `${prefix}${i}`, title, price, emoji, category }));

const HONEYMOON_BR = seed("n", "Lua de mel", [
  ["Jantar à luz de velas", 180, "🕯️"],
  ["Passeio de barco", 320, "⛵"],
  ["Diária na pousada", 550, "🏨"],
  ["Café da manhã na cama", 90, "🥐"],
  ["Mergulho para dois", 420, "🤿"],
  ["Passagem aérea nacional", 900, "✈️"],
]);

const HONEYMOON_WORLD = seed("i", "Lua de mel", [
  ["Passagem internacional", 3200, "🌍"],
  ["Passeio de balão", 900, "🎈"],
  ["Noite em hotel de luxo", 1500, "🏰"],
  ["Jantar com vista", 450, "🍽️"],
  ["Passeio guiado", 380, "🗺️"],
  ["Seguro de viagem", 300, "🧳"],
]);

const HOME = seed("c", "Casa", [
  ["Jogo de cama", 280, "🛏️"],
  ["Jogo de toalhas", 160, "🧺"],
  ["Mop giratório", 99, "🧹"],
  ["Cesto de roupa", 190, "🧺"],
  ["Conjunto de cabides", 80, "👔"],
  ["Tapete para a sala", 450, "🏠"],
]);

const KITCHEN = seed("k", "Cozinha", [
  ["Jogo de panelas", 450, "🍳"],
  ["Faqueiro", 220, "🍴"],
  ["Conjunto de taças", 190, "🥂"],
  ["Aparelho de jantar", 390, "🍽️"],
  ["Tábua de frios", 120, "🧀"],
  ["Jogo de facas", 260, "🔪"],
]);

const APPLIANCES = seed("e", "Eletrodomésticos", [
  ["Cafeteira", 350, "☕"],
  ["Liquidificador", 180, "🥤"],
  ["Air fryer", 480, "🍟"],
  ["Aspirador de pó", 620, "🧹"],
  ["Ferro a vapor", 170, "👕"],
  ["Batedeira", 390, "🍰"],
]);

const DECOR = seed("o", "Decoração", [
  ["Porta-retratos", 60, "🖼️"],
  ["Vaso de cerâmica", 130, "🏺"],
  ["Quadro para a sala", 280, "🎨"],
  ["Luminária", 240, "💡"],
  ["Almofadas", 110, "🛋️"],
  ["Espelho", 340, "🪞"],
]);

const FUN = seed("d", "Divertidos", [
  ["Vale-pizza para a primeira briga", 80, "🍕"],
  ["Cota do controle da TV", 60, "📺"],
  ["Fundo para a noiva não atrasar", 120, "⏰"],
  ["Ajuda no boleto do buffet", 200, "🧾"],
  ["Curso de dança para o noivo", 150, "💃"],
  ["Estoque de café para a vida a dois", 100, "☕"],
]);

export const GIFT_CATEGORIES = ["Casa", "Cozinha", "Eletrodomésticos", "Decoração", "Lua de mel", "Divertidos", "Outros"];

export const GIFT_TEMPLATES = {
  honeymoon: { label: "Viagens e experiências de lua de mel", emoji: "⛵", items: [...HONEYMOON_BR, ...HONEYMOON_WORLD.slice(0, 2)] },
  home: { label: "Produtos para casa", emoji: "🍳", items: [...HOME, ...KITCHEN.slice(0, 2)] },
  general: { label: "Geral de casamento (lua de mel + produtos para casa)", emoji: "💍", items: [...HONEYMOON_BR.slice(0, 3), ...HOME.slice(0, 3), ...KITCHEN.slice(0, 2)] },
  fun: { label: "Presentes divertidos", emoji: "🤪", items: FUN },
  custom: { label: "Personalizar do nosso jeito", emoji: "✏️", items: [] as GiftItem[] },
} as const;
export type GiftTemplateId = keyof typeof GIFT_TEMPLATES;

/** Modelos do painel, além dos oferecidos ao criar o site. */
export const EXTRA_GIFT_LISTS: { label: string; items: GiftItem[] }[] = [
  { label: "Itens para casa", items: HOME },
  { label: "Lua de mel nacional", items: HONEYMOON_BR },
  { label: "Lua de mel internacional", items: HONEYMOON_WORLD },
  { label: "Decoração", items: DECOR },
  { label: "Divertidos", items: FUN },
  { label: "Eletrodomésticos", items: APPLIANCES },
  { label: "Itens para cozinha", items: KITCHEN },
];

const DEFAULT_TASKS: [string, string][] = [
  ["Definir a data e o orçamento", "12 meses antes"],
  ["Escolher cerimônia e recepção", "12 meses antes"],
  ["Contratar assessoria", "12 meses antes"],
  ["Montar a lista de convidados", "10 meses antes"],
  ["Contratar buffet, foto e música", "10 meses antes"],
  ["Enviar o save the date", "8 meses antes"],
  ["Escolher vestido e traje", "8 meses antes"],
  ["Publicar a lista de presentes", "6 meses antes"],
  ["Reservar a lua de mel", "6 meses antes"],
  ["Enviar os convites", "3 meses antes"],
  ["Cobrar as confirmações de presença", "1 mês antes"],
  ["Fechar o mapa de mesas", "2 semanas antes"],
  ["Conferir tudo com os fornecedores", "1 semana antes"],
];

const emptyVenue: Venue = { name: "", address: "", time: "", notes: "" };

const SECTION_ORDER: SectionId[] = ["about", "gallery", "padrinhos", "ceremony", "party", "dresscode", "lodging", "gifts", "rsvp", "mural"];

export function defaultSiteData(): SiteData {
  return {
    couple: { name1: "", name2: "", story: "", photo1: "", photo2: "" },
    wedding: { date: "", city: "" },
    theme: { id: THEMES[0].id, palette: 0, custom: null, font: "", decor: true },
    intro: {
      subtitle: "Vamos nos casar!",
      welcome: "Preparamos este site com muito carinho para compartilhar com vocês os detalhes do nosso grande dia.",
      heroImage: "",
      heroImageMobile: "",
      gallery: [],
      slider: { enabled: false, photos: [], seconds: 4 },
    },
    sections: { about: true, gallery: true, padrinhos: true, ceremony: true, party: true, dresscode: true, lodging: true, gifts: true, rsvp: true, mural: true },
    sectionOrder: [...SECTION_ORDER],
    sectionLabels: {},
    customSections: [],
    gallery: [],
    rsvp: { mode: "open", title: "", intro: "", fullNames: "one", maxAdults: 4, maxChildren: 4, childAge: null, showNotes: true },
    ceremony: { ...emptyVenue },
    party: { ...emptyVenue },
    padrinhos: [],
    dressCode: "",
    lodging: [],
    gifts: {
      about: "A presença de vocês é o nosso maior presente. Se quiserem nos presentear, escolham uma das opções abaixo.",
      visible: true,
      order: "asc",
      items: [],
      external: [],
      pix: { keyType: "email", key: "", holder: "", city: "" },
    },
    music: { tracks: [], autoplay: false },
    privacy: { searchable: true, hasPassword: false },
    notifications: { email: false, address: "" },
    planning: {
      tasks: DEFAULT_TASKS.map(([title, when], i) => ({ id: `t${i}`, title, when, done: false })),
      budget: [],
    },
    tourDone: false,
  };
}

/** Mantém a ordem salva, tira o que não existe mais e coloca no fim o que for novo. */
function mergeOrder(saved: string[] | undefined, custom: CustomSection[] | undefined) {
  const known = [...SECTION_ORDER, ...(custom ?? []).map((section) => section.id)];
  const kept = (Array.isArray(saved) ? saved : []).filter((id) => known.includes(id));
  return [...new Set([...kept, ...known])];
}

/** Completa documentos antigos com os campos novos. Também aceita o que vem do navegador. */
export function normalizeData(raw: unknown): SiteData {
  const base = defaultSiteData();
  const value = (raw ?? {}) as Partial<SiteData>;
  const list = <T,>(input: T[] | undefined, max: number) => (Array.isArray(input) ? input.slice(0, max) : []);
  return {
    couple: { ...base.couple, ...value.couple },
    wedding: { ...base.wedding, ...value.wedding },
    theme: { ...base.theme, ...value.theme },
    intro: {
      ...base.intro,
      ...value.intro,
      gallery: list(value.intro?.gallery, 3),
      slider: { ...base.intro.slider, ...value.intro?.slider, photos: list(value.intro?.slider?.photos, 12) },
    },
    sections: { ...base.sections, ...value.sections },
    sectionOrder: mergeOrder(value.sectionOrder, value.customSections),
    sectionLabels: { ...value.sectionLabels },
    customSections: list(value.customSections, 20),
    gallery: list(value.gallery, 40),
    rsvp: { ...base.rsvp, ...value.rsvp },
    ceremony: { ...base.ceremony, ...value.ceremony },
    party: { ...base.party, ...value.party },
    padrinhos: list(value.padrinhos, 40),
    dressCode: String(value.dressCode ?? ""),
    lodging: list(value.lodging, 30),
    gifts: {
      ...base.gifts,
      ...value.gifts,
      items: list(value.gifts?.items, 200),
      external: list(value.gifts?.external, 20),
      pix: { ...base.gifts.pix, ...value.gifts?.pix },
    },
    music: { autoplay: Boolean(value.music?.autoplay), tracks: list(value.music?.tracks, 10) },
    privacy: { ...base.privacy, ...value.privacy },
    notifications: { ...base.notifications, ...value.notifications },
    planning: {
      tasks: Array.isArray(value.planning?.tasks) ? value.planning.tasks.slice(0, 100) : base.planning.tasks,
      budget: list(value.planning?.budget, 100),
    },
    tourDone: Boolean(value.tourDone),
    ...(value.secret ? { secret: value.secret } : {}),
  };
}

export function toPublicData(data: SiteData): PublicSiteData {
  const { secret: _secret, notifications: _notifications, planning: _planning, gifts, ...rest } = data;
  const { pix, ...publicGifts } = gifts;
  return { ...rest, gifts: { ...publicGifts, pixEnabled: Boolean(pix.key.trim()) } };
}

export const coupleNames = (data: Pick<SiteData, "couple">, joiner = " & ") =>
  [data.couple.name1, data.couple.name2].filter(Boolean).join(joiner) || "Nosso casamento";

export const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const isValidSlug = (slug: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 60;

/** Links digitados pelos noivos: só http(s), para nunca virar `javascript:` no site do convidado. */
export const safeUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return /^https?:\/\//i.test(withProtocol) ? withProtocol : "";
};

export const sectionLabel = (data: Pick<SiteData, "sectionLabels">, id: SectionId) => data.sectionLabels[id]?.trim() || SECTION_LABELS[id];

export const plainName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");

export const youtubeId = (url: string) =>
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/.exec(url)?.[1] ?? "";

/** Data no formato do input (AAAA-MM-DD) para "21 de julho de 2027", sem depender do fuso. */
export function formatDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${Number(match[3])} de ${months[Number(match[2]) - 1]} de ${match[1]}`;
}

export const paletteOf = (data: Pick<SiteData, "theme">) => {
  const theme = THEMES.find((item) => item.id === data.theme.id) ?? THEMES[0];
  const palette = theme.palettes[data.theme.palette] ?? theme.palettes[0];
  return { theme, palette: data.theme.custom ? { ...palette, ...data.theme.custom } : palette };
};
