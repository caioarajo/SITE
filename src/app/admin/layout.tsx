import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import IconSprite from "@/components/site/IconSprite";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já bloqueia /admin/* sem sessão, mas página de login
  // não tem sidebar — então ela usa este mesmo layout sem o "shell".
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <IconSprite />
      <AdminSidebar userEmail={user.email ?? ""} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
