import { NextResponse, type NextRequest } from "next/server";
import { searchSites } from "@/lib/casar/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return NextResponse.json({ results: await searchSites(String(params.get("q") ?? "").slice(0, 80), params.get("date") ?? "") });
}
