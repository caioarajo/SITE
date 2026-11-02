import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/supabase/admin-guard";
import { generateStrongPassword } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PERMANENT_BAN = "876000h";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if ("error" in guard) return guard.error;
  const { serviceClient } = guard;
  const { id } = await params;

  // Só age sobre contas desta tabela: daqui nunca se alcança um usuário da equipe do site.
  const { data: client } = await serviceClient.from("memorias_clients").select("id").eq("id", id).maybeSingle();
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    name?: string;
    phone?: string;
    notes?: string;
    isActive?: boolean;
  };

  switch (body.action) {
    case "update": {
      const name = String(body.name ?? "").trim().slice(0, 120);
      if (!name) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
      const { error } = await serviceClient
        .from("memorias_clients")
        .update({ name, phone: String(body.phone ?? "").trim().slice(0, 40), notes: String(body.notes ?? "").trim().slice(0, 1000) })
        .eq("id", id);
      if (error) return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    case "setActive": {
      const isActive = body.isActive === true;
      const { error: banError } = await serviceClient.auth.admin.updateUserById(id, { ban_duration: isActive ? "none" : PERMANENT_BAN });
      if (banError) return NextResponse.json({ error: "Não foi possível alterar o acesso." }, { status: 500 });
      await serviceClient.from("memorias_clients").update({ is_active: isActive }).eq("id", id);
      return NextResponse.json({ ok: true });
    }
    case "resetPassword": {
      const password = generateStrongPassword();
      const { error } = await serviceClient.auth.admin.updateUserById(id, { password });
      if (error) return NextResponse.json({ error: "Não foi possível redefinir a senha." }, { status: 500 });
      await serviceClient.from("memorias_clients").update({ must_change_password: true }).eq("id", id);
      return NextResponse.json({ ok: true, password });
    }
    case "delete": {
      const { error } = await serviceClient.auth.admin.deleteUser(id);
      if (error) return NextResponse.json({ error: "Não foi possível excluir o cliente." }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  }
}
