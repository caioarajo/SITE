"use client";

import { useEffect, useState } from "react";
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
  // "unknown" enquanto a sessão ainda não foi checada no navegador — evita
  // piscar "Entrar" e depois trocar para "Painel" assim que a página carrega.
  const [session, setSession] = useState<"unknown" | "out" | "in">("unknown");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

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

  return (
    <header id="site-header" className={cn(scrolled && "scrolled")}>
      <div className="wrap">
        <a className="brand" href="#top">
          <img className="logo-light" src={logoCreamSrc} alt="LP Assessoria e Cerimonial" />
          <img className="logo-dark" src={logoNavySrc} alt="LP Assessoria e Cerimonial" />
        </a>

        <nav id="site-nav" className={cn(menuOpen && "open")}>
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
            className="menu-toggle"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
