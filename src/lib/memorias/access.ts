import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { eventById } from "./server";

export type ClientRow = Database["public"]["Tables"]["memorias_clients"]["Row"];

export type MemoriasAccount =
  | { kind: "staff"; userId: string }
  | { kind: "client"; userId: string; client: ClientRow };

/** Quem está logado, do ponto de vista da LP Memórias. Equipe do site vem antes de cliente. */
export async function currentAccount(): Promise<MemoriasAccount | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceRoleClient();
  const { data: profile } = await service.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle();
  if (profile?.is_active && (profile.role === "admin" || profile.role === "usuario_avancado")) {
    return { kind: "staff", userId: user.id };
  }

  const { data: client } = await service.from("memorias_clients").select("*").eq("id", user.id).maybeSingle();
  if (client?.is_active) return { kind: "client", userId: user.id, client };
  return null;
}

/** Libera o painel do evento para a equipe e para o cliente dono dele. */
export async function requireEventAccess(eventId: string) {
  const account = await currentAccount();
  if (!account) return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) } as const;
  if (account.kind === "client" && account.client.must_change_password) {
    return { error: NextResponse.json({ error: "Troque a senha provisória para continuar." }, { status: 403 }) } as const;
  }

  const event = await eventById(eventId);
  // Evento de outro cliente responde como inexistente, para não revelar que existe.
  if (!event || (account.kind === "client" && event.client_id !== account.client.id)) {
    return { error: NextResponse.json({ error: "Evento não encontrado." }, { status: 404 }) } as const;
  }
  return { account, event, serviceClient: createServiceRoleClient() } as const;
}
