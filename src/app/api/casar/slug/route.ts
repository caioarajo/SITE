import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/casar/auth";
import { siteByOwner, slugAvailable } from "@/lib/casar/store";
import { isValidSlug } from "@/lib/casar/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!isValidSlug(slug)) return NextResponse.json({ available: false, reason: "invalid" });
  const user = await currentUser();
  const own = user ? await siteByOwner(user.id) : null;
  return NextResponse.json({ available: await slugAvailable(slug, own?.id) });
}
