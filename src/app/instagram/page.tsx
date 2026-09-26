import type { Metadata } from "next";
import IconSprite from "@/components/site/IconSprite";
import InstagramBio from "@/components/site/InstagramBio";
import { getSiteSettings } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "LP Assessoria e Cerimonial | Link do Instagram",
  description: "Fale no WhatsApp, veja o portfólio por segmento e conheça a LP Assessoria e Cerimonial.",
};

export default async function InstagramLinkPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <IconSprite />
      <InstagramBio whatsappNumber={settings.whatsapp} />
    </>
  );
}
