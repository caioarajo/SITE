import type { Metadata } from "next";
import IconSprite from "@/components/site/IconSprite";
import InstagramBio from "@/components/site/InstagramBio";
import { getSiteSettings, getPortfolioCategories } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "LP Assessoria e Cerimonial | Link do Instagram",
  description: "Fale no WhatsApp, veja o portfólio por segmento e conheça a LP Assessoria e Cerimonial.",
};

export default async function InstagramLinkPage() {
  const [settings, categories] = await Promise.all([getSiteSettings(), getPortfolioCategories()]);

  return (
    <>
      <IconSprite />
      <InstagramBio whatsappNumber={settings.whatsapp} categories={categories} />
    </>
  );
}
