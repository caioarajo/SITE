import { NextResponse, type NextRequest } from "next/server";
import { eventByGuestToken, eventByWallToken, guestState, wallState } from "@/lib/memorias/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("t");

  const wall = await eventByWallToken(token);
  if (wall) return NextResponse.json(await wallState(wall));

  const guest = await eventByGuestToken(token);
  if (guest) return NextResponse.json(await guestState(guest, searchParams.get("d") ?? ""));

  return NextResponse.json({ error: "Link inválido." }, { status: 403 });
}
