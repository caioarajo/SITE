import type { Metadata } from "next";
import QRCode from "qrcode";
import IconSprite from "@/components/site/IconSprite";
import LpMemorias from "@/components/site/lpMemorias/LpMemorias";
import { getSiteSettings } from "@/lib/data";
import "./lp-memorias.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "LP Memórias | LP Assessoria e Cerimonial",
  description:
    "Seu casamento por todos os ângulos. Cada convidado tem uma história para contar. A LP Memórias reúne todas elas em um só álbum.",
  // Fora dos buscadores até o serviço estar pronto para venda (hoje só existe o protótipo local).
  robots: { index: false, follow: false },
};

export default async function LpMemoriasPage() {
  const settings = await getSiteSettings();

  // QR code de verdade nas amostras de cartão: quem escanear cai no WhatsApp da Lia.
  const sampleQr = await QRCode.toString(`https://wa.me/${settings.whatsapp}`, {
    type: "svg",
    margin: 0,
    color: { dark: "#182c52", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  return (
    <>
      <IconSprite />
      <LpMemorias
        whatsapp={settings.whatsapp}
        email={settings.email}
        instagram={settings.instagram}
        sampleQr={sampleQr}
      />
    </>
  );
}
