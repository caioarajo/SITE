export type HeroLayout = "split" | "blob" | "line" | "script" | "photo" | "oval" | "mosaic" | "night" | "leaves";

export type Palette = { name: string; primary: string; bg: string; text: string; accent: string };

export type Theme = {
  id: string;
  name: string;
  layout: HeroLayout;
  display: string;
  body: string;
  isNew?: boolean;
  palettes: Palette[];
};

const SERIF = "'Playfair Display', serif";
const CORMORANT = "'Cormorant Garamond', serif";
const SCRIPT = "'Great Vibes', cursive";
const CAPS = "'Cinzel', serif";
const SANS = "'Jost', sans-serif";
const MONT = "'Montserrat', sans-serif";

const OWN_THEMES: Theme[] = [
  {
    id: "carmim", name: "Carmim", layout: "split", display: SERIF, body: SANS,
    palettes: [
      { name: "Carmim", primary: "#b3122b", bg: "#ffffff", text: "#2c2024", accent: "#efe9e2" },
      { name: "Marinho", primary: "#182c52", bg: "#ffffff", text: "#1e2536", accent: "#e9edf4" },
      { name: "Vinho", primary: "#6d1f3a", bg: "#fffafa", text: "#2e1a22", accent: "#f2e6ea" },
    ],
  },
  {
    id: "pessego", name: "Pêssego", layout: "blob", display: CAPS, body: SANS, isNew: true,
    palettes: [
      { name: "Pêssego", primary: "#e08458", bg: "#fffaf6", text: "#5a4238", accent: "#fde6d8" },
      { name: "Rosa", primary: "#cc6f88", bg: "#fff9fa", text: "#57404a", accent: "#fae3e9" },
      { name: "Lavanda", primary: "#8877b8", bg: "#fbfaff", text: "#453f58", accent: "#e9e5f6" },
    ],
  },
  {
    id: "lirio", name: "Lírio", layout: "line", display: CAPS, body: SANS, isNew: true,
    palettes: [
      { name: "Dourado", primary: "#ab7f3f", bg: "#fdfcf9", text: "#4b4133", accent: "#f3ecdf" },
      { name: "Grafite", primary: "#55585f", bg: "#fbfbfb", text: "#33353a", accent: "#ebebed" },
      { name: "Sálvia", primary: "#64806a", bg: "#fbfdfb", text: "#3c4a3e", accent: "#e6eee7" },
    ],
  },
  {
    id: "tracos", name: "Traços", layout: "script", display: SCRIPT, body: SANS, isNew: true,
    palettes: [
      { name: "Areia", primary: "#967f69", bg: "#f8f7f4", text: "#6d5d4f", accent: "#ece6df" },
      { name: "Terracota", primary: "#b9694b", bg: "#fbf7f4", text: "#5e3f32", accent: "#f2e1d9" },
      { name: "Oceano", primary: "#3f7c8c", bg: "#f6fafb", text: "#2f4d55", accent: "#dcebef" },
    ],
  },
  {
    id: "entardecer", name: "Entardecer", layout: "photo", display: CORMORANT, body: SANS, isNew: true,
    palettes: [
      { name: "Bronze", primary: "#a4644e", bg: "#ffffff", text: "#4f4038", accent: "#f4ebe5" },
      { name: "Noite", primary: "#27384f", bg: "#ffffff", text: "#27384f", accent: "#e6eaf0" },
      { name: "Musgo", primary: "#5b6a45", bg: "#ffffff", text: "#3e4632", accent: "#e9ecdf" },
    ],
  },
  {
    id: "folhas", name: "Folhas Azuis", layout: "leaves", display: MONT, body: SANS, isNew: true,
    palettes: [
      { name: "Azul", primary: "#5f769c", bg: "#fbfcfe", text: "#465573", accent: "#e6ebf3" },
      { name: "Verde", primary: "#5c8067", bg: "#fbfdfb", text: "#425a4a", accent: "#e4ede6" },
      { name: "Malva", primary: "#8f6a84", bg: "#fdfbfc", text: "#5a4553", accent: "#f0e6ed" },
    ],
  },
  {
    id: "jardim", name: "Jardim", layout: "oval", display: SCRIPT, body: MONT, isNew: true,
    palettes: [
      { name: "Oliva", primary: "#7f7f42", bg: "#f5f5f1", text: "#565633", accent: "#e8e8d9" },
      { name: "Eucalipto", primary: "#5a8074", bg: "#f5f8f7", text: "#3f5a52", accent: "#dfeae6" },
      { name: "Ocre", primary: "#a97a2d", bg: "#fbf8f2", text: "#5e4a25", accent: "#f2e8d3" },
    ],
  },
  {
    id: "nos", name: "Nós Dois", layout: "mosaic", display: MONT, body: SANS, isNew: true,
    palettes: [
      { name: "Preto", primary: "#161616", bg: "#ffffff", text: "#333333", accent: "#eeeeee" },
      { name: "Marinho", primary: "#182c52", bg: "#ffffff", text: "#27324a", accent: "#e8ecf3" },
      { name: "Bordô", primary: "#5e1b2d", bg: "#ffffff", text: "#3a252b", accent: "#f0e5e8" },
    ],
  },
  {
    id: "serenata", name: "Serenata", layout: "blob", display: SCRIPT, body: SANS, isNew: true,
    palettes: [
      { name: "Rosé", primary: "#b5657b", bg: "#fffbfb", text: "#59404a", accent: "#f7e6ea" },
      { name: "Vinho", primary: "#7b2f45", bg: "#fffafa", text: "#3f2730", accent: "#f1e2e6" },
      { name: "Dourado", primary: "#a57d38", bg: "#fffdf8", text: "#55462a", accent: "#f4ecdb" },
    ],
  },
  {
    id: "sereno", name: "Sereno", layout: "line", display: CORMORANT, body: MONT, isNew: true,
    palettes: [
      { name: "Névoa", primary: "#5f7f8c", bg: "#fbfdfd", text: "#3f525a", accent: "#e4edf0" },
      { name: "Lago", primary: "#34707a", bg: "#f9fdfd", text: "#2d4a50", accent: "#dcecee" },
      { name: "Argila", primary: "#9b6f58", bg: "#fdfbf9", text: "#54423a", accent: "#f0e6df" },
    ],
  },
  {
    id: "gala", name: "Traje de Gala", layout: "night", display: SERIF, body: MONT, isNew: true,
    palettes: [
      { name: "Prata", primary: "#d6d6d6", bg: "#0e0e0f", text: "#f1f1f1", accent: "#1f1f21" },
      { name: "Champanhe", primary: "#dcc7a0", bg: "#100f0c", text: "#f4efe5", accent: "#221f19" },
      { name: "Marinho", primary: "#b9c6dc", bg: "#0b1220", text: "#edf1f8", accent: "#182132" },
    ],
  },
  {
    id: "noite", name: "Noite de Pétalas", layout: "night", display: CAPS, body: SANS, isNew: true,
    palettes: [
      { name: "Rubi", primary: "#d9a6a0", bg: "#0b0b0d", text: "#f2ecea", accent: "#1d1b1f" },
      { name: "Ouro", primary: "#c9a86a", bg: "#0d0c0a", text: "#f3eee3", accent: "#201d17" },
      { name: "Azul-noite", primary: "#9db4d8", bg: "#0a0e18", text: "#e9eef7", accent: "#171e2e" },
    ],
  },
];

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
const mix = (a: string, b: string, amount: number) =>
  `#${[0, 1, 2].map((i) => Math.round(channel(a, i) * (1 - amount) + channel(b, i) * amount).toString(16).padStart(2, "0")).join("")}`;

const SHARED_COLORS: [string, string][] = [
  ["Petróleo", "#17494f"], ["Rosa antigo", "#a9626f"], ["Vermelho", "#b3122b"],
  ["Sálvia", "#6f8a72"], ["Blush", "#c17f8c"], ["Ferrugem", "#a13d2d"],
  ["Pink", "#d6336c"], ["Azul", "#2c5282"], ["Lilás", "#8e6bb0"],
];

/** Cada tema tem as próprias cores e mais nove em comum, sempre legíveis sobre o fundo dele. */
export const THEMES: Theme[] = OWN_THEMES.map((theme) => {
  const { bg, text } = theme.palettes[0];
  const shared = SHARED_COLORS.map(([name, color]) => {
    const primary = theme.layout === "night" ? mix(color, "#ffffff", 0.55) : color;
    return { name, primary, bg, text, accent: mix(bg, primary, 0.14) };
  });
  return { ...theme, palettes: [...theme.palettes, ...shared] };
});

export const FONT_OPTIONS = [
  { name: "Clássica", value: CAPS },
  { name: "Caligrafia", value: SCRIPT },
  { name: "Elegante", value: SERIF },
  { name: "Moderna", value: MONT },
  { name: "Delicada", value: CORMORANT },
  { name: "Simples", value: SANS },
];

export const themeById = (id: string) => THEMES.find((theme) => theme.id === id) ?? THEMES[0];
