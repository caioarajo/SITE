"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Serviços" },
  { href: "#portfolio", label: "Portfólio" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#contato", label: "Contato" },
];

export default function Header({ logoCreamSrc, logoNavySrc }: { logoCreamSrc: string; logoNavySrc: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

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
        </nav>

        <div className="cta-wrap">
          <a href="#contato" className="btn btn-ghost">
            Contato
          </a>
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
