import type { PortfolioCategory } from "@/lib/types";

/** Ordem e rótulos dos álbuns do portfólio — única fonte de verdade,
 * usada tanto no site público (grade de segmentos) quanto no admin
 * (seletor de categoria no upload). */
export const PORTFOLIO_CATEGORIES: { value: PortfolioCategory; label: string }[] = [
  { value: "quinze_anos", label: "15 Anos" },
  { value: "casamentos", label: "Casamentos" },
  { value: "formaturas", label: "Formaturas" },
  { value: "empresarial", label: "Empresarial" },
  { value: "infantil", label: "Infantil" },
  { value: "eventos_gerais", label: "Eventos em Geral" },
];

export const PORTFOLIO_CATEGORY_LABELS: Record<PortfolioCategory, string> = Object.fromEntries(
  PORTFOLIO_CATEGORIES.map((c) => [c.value, c.label])
) as Record<PortfolioCategory, string>;
