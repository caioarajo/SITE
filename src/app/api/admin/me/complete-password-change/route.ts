import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/supabase/admin-guard";

export async function POST() {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { user, serviceClient } = guard;

  const { error } = await serviceClient
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
