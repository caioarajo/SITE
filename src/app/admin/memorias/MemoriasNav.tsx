"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MemoriasNav() {
  const pathname = usePathname();
  const clients = pathname.startsWith("/admin/memorias/clientes");
  return (
    <nav className="tl-tabs" aria-label="LP Memórias">
      <Link href="/admin/memorias" className={clients ? "" : "is-on"}>Eventos</Link>
      <Link href="/admin/memorias/clientes" className={clients ? "is-on" : ""}>Clientes</Link>
    </nav>
  );
}
