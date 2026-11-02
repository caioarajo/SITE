import { NextResponse, type NextRequest } from "next/server";
import { adminState, db, guestState, isDisabled, wallState } from "@/lib/telaoDemo/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (isDisabled()) return new NextResponse(null, { status: 404 });
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("t");
  const key = request.headers.get("x-telao-key") ?? searchParams.get("k");
  const data = db();

  if (key && key === data.adminKey) return NextResponse.json(adminState(request.headers.get("host")));
  if (token && token === data.wallToken) return NextResponse.json(wallState());
  if (token && token === data.guestToken) return NextResponse.json(guestState(searchParams.get("d") ?? ""));
  return NextResponse.json({ error: "Link inválido." }, { status: 403 });
}
