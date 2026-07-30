import IconSprite from "@/components/site/IconSprite";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import About from "@/components/site/About";
import Process from "@/components/site/Process";
import Services from "@/components/site/Services";
import Portfolio from "@/components/site/Portfolio";
import Testimonials from "@/components/site/Testimonials";
import Faq from "@/components/site/Faq";
import ContactSection from "@/components/site/ContactSection";
import Footer from "@/components/site/Footer";
import WhatsAppFloat from "@/components/site/WhatsAppFloat";
import { getServices, getPortfolioItems, getTestimonials, getFaqs, getSiteSettings } from "@/lib/data";

// Revalida o conteúdo a cada 60s — assim, quando a Lia edita algo no
// admin, a mudança aparece no site público em no máximo um minuto,
// sem precisar de um novo deploy.
export const revalidate = 60;

export default async function HomePage() {
  const [services, portfolioItems, testimonials, faqs, settings] = await Promise.all([
    getServices(),
    getPortfolioItems(),
    getTestimonials(),
    getFaqs(),
    getSiteSettings(),
  ]);

  return (
    <>
      <IconSprite />
      <Header logoCreamSrc="/logo-full-cream.png" logoNavySrc="/logo-full-navy.png" />

      <main id="top">
        <Hero heroPhotoSrc="/images/hero-couple.jpg" whatsappNumber={settings.whatsapp} />
        <About liaPortraitSrc="/images/lia-portrait.jpg" />
        <Process />
        <Services services={services} whatsappNumber={settings.whatsapp} />
        <Portfolio items={portfolioItems} />
        <Testimonials testimonials={testimonials} />
        <Faq faqs={faqs} />
        <ContactSection
          liaPhotoSrc="/images/lia-contact.jpg"
          settings={{
            phone: settings.phone,
            email: settings.email,
            instagram: settings.instagram,
            whatsapp: settings.whatsapp,
          }}
        />
      </main>

      <Footer
        logoCreamSrc="/logo-full-cream.png"
        settings={{
          whatsapp: settings.whatsapp,
          email: settings.email,
          instagram: settings.instagram,
        }}
      />

      <WhatsAppFloat number={settings.whatsapp} />
    </>
  );
}
