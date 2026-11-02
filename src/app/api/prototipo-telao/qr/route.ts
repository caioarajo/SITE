import QRCode from "qrcode";
import { NextResponse, type NextRequest } from "next/server";
import { baseUrl, db, guestPath, isDisabled } from "@/lib/telaoDemo/store";

export const dynamic = "force-dynamic";

/** QR code do link do convidado. Acesso pelo telão ou pelo painel. */
export async function GET(request: NextRequest) {
  if (isDisabled()) return new NextResponse(null, { status: 404 });
  const { searchParams } = request.nextUrl;
  const data = db();
  const credential = searchParams.get("t") ?? searchParams.get("k");
  if (credential !== data.wallToken && credential !== data.adminKey) return new NextResponse(null, { status: 403 });

  const url = baseUrl(request.headers.get("host")) + guestPath();
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
