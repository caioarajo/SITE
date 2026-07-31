import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createServiceRoleClient();

  const { data: item, error: findError } = await supabase
    .from("agenda_items")
    .select("id")
    .eq("supplier_invite_token", token)
    .single();

  if (findError || !item) {
    return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
  }

  const { error } = await supabase
    .from("agenda_items")
    .update({ supplier_confirmed_at: new Date().toISOString() })
    .eq("id", item.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
