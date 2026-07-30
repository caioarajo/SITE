import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import type { Database, UserRole } from "@/lib/types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const VALID_ROLES: UserRole[] = ["admin", "usuario_avancado", "cliente"];
// ~100 anos — usado como "banimento" permanente ao desativar uma conta, pra
// invalidar a capacidade de gerar uma sessão nova mesmo com a senha certa.
const PERMANENT_BAN = "876000h";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { user, serviceClient } = guard;

  const body = await request.json();
  const updates: ProfileUpdate = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
    updates.name = name;
  }

  if (typeof body.role === "string") {
    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Nível de acesso inválido." }, { status: 400 });
    }
    if (id === user.id && body.role !== "admin") {
      return NextResponse.json({ error: "Você não pode remover seu próprio acesso de admin." }, { status: 400 });
    }
    updates.role = body.role;
  }

  if (typeof body.is_active === "boolean") {
    if (id === user.id && body.is_active === false) {
      return NextResponse.json({ error: "Você não pode desativar sua própria conta." }, { status: 400 });
    }
    updates.is_active = body.is_active;

    const { error: banError } = await serviceClient.auth.admin.updateUserById(id, {
      ban_duration: body.is_active ? "none" : PERMANENT_BAN,
    });
    if (banError) return NextResponse.json({ error: banError.message }, { status: 500 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const { error } = await serviceClient.from("profiles").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
