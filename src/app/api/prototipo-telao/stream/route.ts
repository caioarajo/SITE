import { NextResponse, type NextRequest } from "next/server";
import { bus, db, isDisabled } from "@/lib/telaoDemo/store";

export const dynamic = "force-dynamic";

/** Server-Sent Events: só avisa "mudou"; o cliente busca o estado permitido ao seu link. */
export async function GET(request: NextRequest) {
  if (isDisabled()) return new NextResponse(null, { status: 404 });
  const { searchParams } = request.nextUrl;
  const data = db();
  const credential = searchParams.get("t") ?? searchParams.get("k");
  if (!credential || ![data.guestToken, data.wallToken, data.adminKey].includes(credential)) {
    return NextResponse.json({ error: "Link inválido." }, { status: 403 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      const onChanged = () => send("data: changed\n\n");
      const heartbeat = setInterval(() => send(": ping\n\n"), 20_000);
      cleanup = () => {
        clearInterval(heartbeat);
        bus().off("changed", onChanged);
      };
      bus().on("changed", onChanged);
      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // já fechado
        }
      });
      send("retry: 3000\n\n");
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
