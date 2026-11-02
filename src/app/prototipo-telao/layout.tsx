import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { isDisabled } from "@/lib/telaoDemo/store";
import "./telao.css";

export const metadata: Metadata = {
  title: "Protótipo do telão | LP Assessoria e Cerimonial",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Protótipo de teste: não abre em produção, mesmo se este código for publicado.
export default function PrototipoLayout({ children }: { children: React.ReactNode }) {
  if (isDisabled()) notFound();
  return <div className="tl-root">{children}</div>;
}
