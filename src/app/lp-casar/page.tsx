import type { Metadata } from "next";
import Landing from "@/components/casar/Landing";
import { getSiteSettings } from "@/lib/data";
import "./lp-casar.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "LP Casar | Site de casamento e lista de presentes",
  description: "Crie o site do casamento de vocês, confirme presenças e receba presentes via Pix, com o cuidado da LP Assessoria e Cerimonial.",
  // Fora dos buscadores até o serviço estar pronto para venda.
  robots: { index: false, follow: false },
};

export default async function LpCasarPage() {
  const settings = await getSiteSettings();
  return <Landing whatsapp={settings.whatsapp} />;
}
