import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user, profile } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isLoginRoute = path.startsWith("/admin/login");

  // Bloqueia qualquer rota /admin/* para quem não estiver logado,
  // exceto a própria página de login.
  if (isAdminRoute && !isLoginRoute && !user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(loginUrl);
  }

  // Se já está logado e tenta acessar /admin/login, manda direto pro painel.
  if (isLoginRoute && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAdminRoute && !isLoginRoute && user) {
    // Conta desativada: o token pode ainda não ter expirado, mas a linha em
    // profiles (ou o ban_duration setado pela API de usuários) já bloqueia.
    if (!profile || !profile.is_active) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "conta_desativada");
      return NextResponse.redirect(loginUrl);
    }

    // Papel "Cliente" ainda não tem área própria — ver PROJECT_CONTEXT.md.
    if (profile.role === "cliente" && path !== "/admin/sem-acesso") {
      return NextResponse.redirect(new URL("/admin/sem-acesso", request.url));
    }

    // Senha provisória/redefinida: obriga a trocar antes de acessar o resto.
    if (profile.must_change_password && path !== "/admin/change-password") {
      return NextResponse.redirect(new URL("/admin/change-password", request.url));
    }
    if (!profile.must_change_password && path === "/admin/change-password") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Gestão de usuários é exclusiva do admin.
    if (path.startsWith("/admin/usuarios") && profile.role !== "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
