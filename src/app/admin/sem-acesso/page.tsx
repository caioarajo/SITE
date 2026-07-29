"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SemAcessoPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/logo-icon-navy.png" alt="LP" className="logo" />
        <h1>Sem acesso ao painel</h1>
        <p className="sub">
          Sua conta ainda não tem uma área própria neste sistema. Fale com um administrador se
          acha que isso é um engano.
        </p>
        <button className="admin-btn admin-btn-line" style={{ width: "100%", marginTop: 8 }} onClick={handleSignOut}>
          Sair
        </button>
      </div>
    </div>
  );
}
