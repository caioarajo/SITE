import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/supabase/admin-guard";
import { settingsOf } from "@/lib/memorias/server";
import type { ClientSummary } from "@/lib/memorias/types";
import { generateStrongPassword } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireStaff();
  if ("error" in guard) return guard.error;
  const { serviceClient } = guard;

  const [clients, events] = await Promise.all([
    serviceClient.from("memorias_clients").select("*").order("name"),
    serviceClient.from("memorias_events").select("*").not("client_id", "is", null),
  ]);
  if (clients.error || events.error) {
    return NextResponse.json({ error: "Não foi possível carregar os clientes." }, { status: 500 });
  }

  const summaries: ClientSummary[] = (clients.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
    isActive: c.is_active,
    mustChangePassword: c.must_change_password,
    events: (events.data ?? [])
      .filter((e) => e.client_id === c.id)
      .map((e) => ({ id: e.id, title: settingsOf(e).title })),
  }));
  return NextResponse.json({ clients: summaries });
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if ("error" in guard) return guard.error;
  const { serviceClient, user } = guard;

  const body = (await request.json().catch(() => ({}))) as { name?: string; email?: string; phone?: string; notes?: string };
  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!name) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });

  const password = generateStrongPassword();
  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError || !created.user) {
    const taken = createError?.message.includes("already been registered");
    return NextResponse.json(
      { error: taken ? "Este e-mail já tem uma conta (de cliente ou da equipe do site). Use outro." : "Não foi possível criar o acesso." },
      { status: 409 },
    );
  }

  const { error } = await serviceClient.from("memorias_clients").insert({
    id: created.user.id,
    name,
    email,
    phone: String(body.phone ?? "").trim().slice(0, 40),
    notes: String(body.notes ?? "").trim().slice(0, 1000),
    created_by: user.id,
  });
  if (error) {
    await serviceClient.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Não foi possível salvar o cliente." }, { status: 500 });
  }
  // A senha provisória só existe nesta resposta: não é guardada em lugar nenhum.
  return NextResponse.json({ id: created.user.id, email, password });
}
