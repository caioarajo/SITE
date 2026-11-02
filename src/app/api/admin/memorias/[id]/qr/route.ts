import QRCode from "qrcode";
import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/supabase/admin-guard";
import { eventById, guestPath } from "@/lib/memorias/server";

export const dynamic = "force-dynamic";

/** QR code do link do convidado, para o painel e para impressão (PNG ou SVG). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if ("error" in guard) return guard.error;
  const event = await eventById((await params).id);
  if (!event) return new NextResponse(null, { status: 404 });

  const { searchParams, origin } = request.nextUrl;
  const url = origin + guestPath(event);
  const color = { dark: "#182c52", light: "#ffffff" };
  const download = searchParams.get("download") === "1";

  if (searchParams.get("format") === "png") {
    const png = await QRCode.toBuffer(url, { width: 1200, margin: 2, color, errorCorrectionLevel: "M" });
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        ...(download ? { "Content-Disposition": 'attachment; filename="qrcode-convidados.png"' } : {}),
      },
    });
  }
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, color, errorCorrectionLevel: "M" });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
      ...(download ? { "Content-Disposition": 'attachment; filename="qrcode-convidados.svg"' } : {}),
    },
  });
}
