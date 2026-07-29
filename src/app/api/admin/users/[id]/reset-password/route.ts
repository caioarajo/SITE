import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { generateStrongPassword } from "@/lib/utils";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { serviceClient } = guard;

  const body = await request.json().catch(() => ({}));
  const forceChange = body.forceChange !== false;

  const temporaryPassword = generateStrongPassword();

  const { error: updateError } = await serviceClient.auth.admin.updateUserById(params.id, {
    password: temporaryPassword,
  });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ must_change_password: forceChange })
    .eq("id", params.id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // A senha só existe nesta resposta — não fica salva em lugar nenhum, nem
  // em log. O admin precisa copiar e repassar agora.
  return NextResponse.json({ temporaryPassword });
}
