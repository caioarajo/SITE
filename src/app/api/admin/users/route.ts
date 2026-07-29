import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { validatePasswordComplexity } from "@/lib/utils";
import type { AdminUser, ProfileRow, UserRole } from "@/lib/types";

const VALID_ROLES: UserRole[] = ["admin", "usuario_avancado", "cliente"];

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { serviceClient } = guard;

  const [{ data: authList, error: authError }, { data: profiles, error: profilesError }] = await Promise.all([
    serviceClient.auth.admin.listUsers({ perPage: 1000 }),
    serviceClient.from("profiles").select("*"),
  ]);

  if (authError || profilesError) {
    return NextResponse.json({ error: authError?.message ?? profilesError?.message }, { status: 500 });
  }

  const profileById = new Map((profiles as ProfileRow[]).map((p) => [p.id, p]));

  const users: AdminUser[] = (authList?.users ?? [])
    .map((u) => {
      const profile = profileById.get(u.id);
      if (!profile) return null;
      return {
        id: u.id,
        email: u.email ?? "",
        name: profile.name,
        role: profile.role as UserRole,
        is_active: profile.is_active,
        must_change_password: profile.must_change_password,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      };
    })
    .filter((u): u is AdminUser => u !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { serviceClient } = guard;

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = body.role as UserRole;

  if (!name) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Informe o e-mail." }, { status: 400 });
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Nível de acesso inválido." }, { status: 400 });
  }
  const passwordError = validatePasswordComplexity(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    const message = createError?.message.includes("already been registered")
      ? "Já existe um usuário com esse e-mail."
      : createError?.message ?? "Não foi possível criar o usuário.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: created.user.id,
    name,
    role,
    is_active: true,
    must_change_password: true,
  });

  if (profileError) {
    // Sem o profile o login trava (nenhuma policy reconhece o papel dele) —
    // desfaz a criação em vez de deixar um usuário "fantasma" no Auth.
    await serviceClient.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ id: created.user.id }, { status: 201 });
}
