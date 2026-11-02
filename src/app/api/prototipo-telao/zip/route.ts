import fs from "node:fs";
import path from "node:path";
import { crc32 } from "node:zlib";
import { NextResponse, type NextRequest } from "next/server";
import { db, isDisabled, MEDIA_DIR } from "@/lib/telaoDemo/store";

export const dynamic = "force-dynamic";

/** ZIP sem compressão (fotos e vídeos já são comprimidos), com os originais aprovados. */
export async function GET(request: NextRequest) {
  if (isDisabled()) return new NextResponse(null, { status: 404 });
  const data = db();
  if (request.nextUrl.searchParams.get("k") !== data.adminKey) return new NextResponse(null, { status: 403 });

  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  let index = 0;

  for (const post of data.posts.filter((p) => p.status === "approved" && p.original)) {
    index += 1;
    const bytes = fs.readFileSync(path.join(MEDIA_DIR, post.original));
    const who = (post.guestName || "convidado").normalize("NFD").replace(/[^\w-]+/g, "-").slice(0, 40);
    const name = Buffer.from(`${String(index).padStart(4, "0")}-${who}${path.extname(post.original)}`, "utf8");
    const crc = crc32(bytes);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(bytes.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, bytes);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(bytes.length, 20);
    entry.writeUInt32LE(bytes.length, 24);
    entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, name);

    offset += local.length + name.length + bytes.length;
  }

  const centralBytes = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(index, 8);
  end.writeUInt16LE(index, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);

  return new NextResponse(new Uint8Array(Buffer.concat([...parts, centralBytes, end])), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="fotos-do-evento.zip"',
      "Cache-Control": "no-store",
    },
  });
}
