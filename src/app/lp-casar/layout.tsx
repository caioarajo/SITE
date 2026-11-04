import type { Metadata } from "next";

// Imagem do cartão ao compartilhar qualquer link da LP Casar, inclusive os sites dos casais.
export const metadata: Metadata = {
  openGraph: {
    images: [{ url: "/og-lp-casar.jpg", width: 1200, height: 630, alt: "LP Casar" }],
  },
};

export default function LpCasarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
