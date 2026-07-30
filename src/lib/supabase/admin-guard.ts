import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

/**
 * Confere que quem está chamando a rota está logado e é admin. Roda antes de
 * qualquer ação que use o client de service role (que ignora RLS), já que
 * essas rotas são o único lugar do app com privilégio total sobre usuários.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) } as const;
  }

  const serviceClient = createServiceRoleClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active || (profile.role as UserRole) !== "admin") {
    return { error: NextResponse.json({ error: "Sem permissão." }, { status: 403 }) } as const;
  }

  return { user, serviceClient } as const;
}

/** Igual ao acima, mas só exige que o usuário esteja logado e ativo — usada
 * pela rota que o próprio usuário chama para limpar seu must_change_password. */
export async function requireActiveUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) } as const;
  }

  const serviceClient = createServiceRoleClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    return { error: NextResponse.json({ error: "Conta inativa." }, { status: 403 }) } as const;
  }

  return { user, serviceClient } as const;
}
