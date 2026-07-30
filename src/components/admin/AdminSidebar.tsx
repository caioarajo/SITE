"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/leads", label: "Leads", icon: "inbox" },
  { href: "/admin/portfolio", label: "Portfólio", icon: "image" },
  { href: "/admin/depoimentos", label: "Depoimentos", icon: "quote" },
  { href: "/admin/servicos", label: "Serviços", icon: "tag" },
  { href: "/admin/faq", label: "FAQ", icon: "help" },
  { href: "/admin/settings", label: "Configurações", icon: "gear" },
];

const ADMIN_ONLY_LINKS = [{ href: "/admin/usuarios", label: "Usuários", icon: "users" }];

const ICONS: Record<string, React.ReactNode> = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12h5l2 3h4l2-3h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 5h14l2 7v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7l2-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5.5-5.5L4 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  quote: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 8c-2 0-3.5 1.5-3.5 4S5 16 7 16v2c-3 0-5.5-2.5-5.5-6S4 5 7 5v3z" />
      <path d="M17 8c-2 0-3.5 1.5-3.5 4s1.5 4 3.5 4v2c-3 0-5.5-2.5-5.5-6S14 5 17 5v3z" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2l9 9-9 9-9-9V2h9z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  help: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1-1.5 2.2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.3 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1L11 21h4l.3-2.6a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
      <path d="M16 8.5a3 3 0 1 1 0 6" strokeLinecap="round" />
      <path d="M21.5 20c0-2.8-2-5.1-4.6-5.8" strokeLinecap="round" />
    </svg>
  ),
};

export default function AdminSidebar({ userEmail, role }: { userEmail: string; role: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "admin" ? [...LINKS, ...ADMIN_ONLY_LINKS] : LINKS;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
      <div className="brand">
        <img src="/logo-icon-cream.png" alt="LP" />
        <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "var(--cream)" }}>
          Painel
        </span>
      </div>

      <nav>
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} className={active ? "active" : ""}>
              {ICONS[link.icon]}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ fontSize: 11, color: "rgba(250,246,239,0.4)", padding: "0 12px 8px" }}>{userEmail}</div>
      <button className="signout" onClick={handleSignOut}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sair
      </button>
    </aside>
  );
}
