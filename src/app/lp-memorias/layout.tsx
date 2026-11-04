import type { Metadata } from "next";

// Imagem do cartão ao compartilhar qualquer link da LP Memórias.
export const metadata: Metadata = {
  openGraph: {
    images: [{ url: "/og-lp-memorias.jpg", width: 1200, height: 630, alt: "LP Memórias" }],
  },
};

export default function LpMemoriasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
