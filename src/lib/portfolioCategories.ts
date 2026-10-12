/** Gera um slug estável a partir do rótulo digitado pelo admin ao criar uma
 * categoria nova (ex.: "Eventos Corporativos" -> "eventos_corporativos").
 * As categorias em si moram na tabela portfolio_categories, não mais numa
 * lista fixa aqui — essa função só evita pedir pro admin digitar o slug. */
export function slugifyCategory(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}
