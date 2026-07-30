"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: "Visão Geral", links: [{ href: "/admin", label: "Dashboard", icon: "grid" }] },
  {
    label: "Comercial",
    links: [
      { href: "/admin/crm", label: "CRM", icon: "funnel" },
      { href: "/admin/leads", label: "Leads", icon: "inbox" },
    ],
  },
  {
    label: "Cadastros",
    links: [
      { href: "/admin/clientes", label: "Clientes", icon: "users" },
      { href: "/admin/eventos", label: "Eventos", icon: "calendar" },
      { href: "/admin/colaboradores", label: "Colaboradores", icon: "badge" },
      { href: "/admin/fornecedores", label: "Fornecedores", icon: "truck" },
      { href: "/admin/produtos", label: "Produtos", icon: "box" },
      { href: "/admin/listas-convidados", label: "Listas de Convidados", icon: "list" },
      { href: "/admin/convidados", label: "Convidados", icon: "user-check" },
    ],
  },
  {
    label: "Financeiro",
    links: [
      { href: "/admin/financeiro/contas-a-pagar", label: "Contas a Pagar", icon: "arrow-up-circle" },
      { href: "/admin/financeiro/contas-a-receber", label: "Contas a Receber", icon: "arrow-down-circle" },
    ],
  },
  {
    label: "Site",
    links: [
      { href: "/admin/portfolio", label: "Portfólio", icon: "image" },
      { href: "/admin/depoimentos", label: "Depoimentos", icon: "quote" },
      { href: "/admin/servicos", label: "Serviços", icon: "tag" },
      { href: "/admin/faq", label: "FAQ", icon: "help" },
      { href: "/admin/settings", label: "Configurações", icon: "gear" },
    ],
  },
];

const ADMIN_ONLY_GROUP: NavGroup = {
  label: "Administração",
  links: [{ href: "/admin/usuarios", label: "Usuários", icon: "users-cog" }],
};

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
  "users-cog": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="8" r="3" />
      <path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
      <circle cx="18" cy="16" r="2.4" />
      <path d="M18 12.2v.8M18 18.6v.8M21.4 14.3l-.7.4M15.3 16.9l-.7.4M21.4 17.7l-.7-.4M15.3 15.1l-.7-.4" strokeLinecap="round" />
    </svg>
  ),
  funnel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  ),
  badge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="9" r="4" />
      <path d="M7 21l1.5-6M17 21l-1.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 7h13v10H2z" strokeLinejoin="round" />
      <path d="M15 10h4l3 3v4h-7z" strokeLinejoin="round" />
      <circle cx="6.5" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" strokeLinejoin="round" />
    </svg>
  ),
  "arrow-up-circle": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16V8M8.5 11.5L12 8l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "arrow-down-circle": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8.5 12.5L12 16l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  "user-check": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
      <path d="M16 11l2 2 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 11l8-7 8 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function AdminSidebar({ userEmail, role }: { userEmail: string; role: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = role === "admin" ? [...NAV_GROUPS, ADMIN_ONLY_GROUP] : NAV_GROUPS;

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
        {groups.map((group) => (
          <div key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.links.map((link) => {
              const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} className={active ? "active" : ""}>
                  {ICONS[link.icon]}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <Link href="/" target="_blank" rel="noopener noreferrer" className="back-to-site">
        {ICONS.home}
        <span>Voltar ao Site</span>
      </Link>

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
