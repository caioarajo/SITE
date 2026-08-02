"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Serviços" },
  { href: "#portfolio", label: "Portfólio" },
  { href: "#depoimentos", label: "Depoimentos" },
];

export default function Header({ logoCreamSrc, logoNavySrc }: { logoCreamSrc: string; logoNavySrc: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Drawer mobile é renderizado via portal (ver abaixo) para escapar do
  // "backdrop-filter" do header, que cria um containing block para
  // descendentes "position:fixed" e quebrava o "inset:0" do menu quando
  // a página estava rolada. "mounted" evita chamar createPortal no SSR,
  // onde "document" ainda não existe.
  const [mounted, setMounted] = useState(false);
  // "unknown" enquanto a sessão ainda não foi checada no navegador — evita
  // piscar "Entrar" e depois trocar para "Painel" assim que a página carrega.
  const [session, setSession] = useState<"unknown" | "out" | "in">("unknown");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setSession(user ? "in" : "out"));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession?.user ? "in" : "out");
    });
    return () => subscription.unsubscribe();
  }, []);

  const authHref = session === "in" ? "/admin" : "/admin/login";
  const authLabel = session === "in" ? "Painel" : "Entrar";

  const navContent = (
    <>
      {NAV_LINKS.map((link) => (
        <a key={link.href} href={link.href} className="nav-link" onClick={() => setMenuOpen(false)}>
          {link.label}
        </a>
      ))}
      {/* No mobile (menu-drawer), os botões abaixo ficam ocultos — estas
          versões em texto cobrem esse caso. No desktop elas somem via
          CSS, já que os botões ao lado já cumprem o mesmo papel. */}
      <a href="#contato" className="nav-link nav-cta-duplicate" onClick={() => setMenuOpen(false)}>
        Contato
      </a>
      {session !== "unknown" && (
        <a href={authHref} className="nav-link nav-cta-duplicate" onClick={() => setMenuOpen(false)}>
          {authLabel}
        </a>
      )}
    </>
  );

  return (
    <>
      <header id="site-header" className={cn(scrolled && "scrolled")}>
        <div className="wrap">
          <a className="brand" href="#top">
            <img className="logo-light" src={logoCreamSrc} alt="LP Assessoria e Cerimonial" />
            <img className="logo-dark" src={logoNavySrc} alt="LP Assessoria e Cerimonial" />
          </a>

          {/* Nav de desktop (linha horizontal). No mobile ela some via CSS e
              o drawer abaixo (portalizado para fora do header) assume. */}
          <nav id="site-nav-desktop" className="site-nav-desktop">
            {navContent}
          </nav>

          <div className="cta-wrap">
            <a href="#contato" className="btn btn-ghost">
              Contato
            </a>
            {session !== "unknown" && (
              <a href={authHref} className="btn btn-ghost">
                {authLabel}
              </a>
            )}
            <button
              className={cn("menu-toggle", menuOpen && "open")}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {mounted &&
        createPortal(
          <>
            <div className={cn("nav-scrim", menuOpen && "open")} onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <nav id="site-nav" className={cn("nav-drawer", menuOpen && "open")}>
              {navContent}
            </nav>
          </>,
          document.body,
        )}
    </>
  );
}
