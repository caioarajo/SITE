import QRCode from "qrcode";
import { NextResponse, type NextRequest } from "next/server";
import { eventByWallToken, guestPath } from "@/lib/memorias/server";

export const dynamic = "force-dynamic";

/** QR code do link do convidado, exibido no telão. */
export async function GET(request: NextRequest) {
  const event = await eventByWallToken(request.nextUrl.searchParams.get("t"));
  if (!event) return new NextResponse(null, { status: 403 });
  const svg = await QRCode.toString(request.nextUrl.origin + guestPath(event), {
    type: "svg",
    margin: 2,
    color: { dark: "#182c52", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" } });
}
