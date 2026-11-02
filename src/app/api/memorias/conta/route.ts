import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/memorias/access";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Para onde a tela de entrada deve mandar quem acabou de logar. */
export async function GET() {
  const account = await currentAccount();
  return NextResponse.json({ kind: account?.kind ?? null });
}

/** O cliente já trocou a senha provisória no Supabase Auth: libera o acesso aos eventos. */
export async function POST() {
  const account = await currentAccount();
  if (account?.kind !== "client") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  await createServiceRoleClient().from("memorias_clients").update({ must_change_password: false }).eq("id", account.client.id);
  return NextResponse.json({ ok: true });
}
