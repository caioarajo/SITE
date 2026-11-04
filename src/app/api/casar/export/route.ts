import { NextResponse, type NextRequest } from "next/server";
import { requireOwnSite } from "@/lib/casar/auth";
import { listRecords } from "@/lib/casar/store";
import { coupleNames, formatDate, paletteOf, sectionLabel, type Venue } from "@/lib/casar/types";

export const dynamic = "force-dynamic";

const esc = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Lembrança do site: um arquivo HTML único. As fotos continuam vindo do endereço original. */
export async function GET(request: NextRequest) {
  const guard = await requireOwnSite();
  if ("error" in guard) return guard.error;
  const { site } = guard;
  const { data } = site;
  const { palette } = paletteOf(data);
  const origin = request.nextUrl.origin;
  const src = (url: string) => esc(url.startsWith("/") ? `${origin}${url}` : url);
  const img = (url: string) => (url ? `<img src="${src(url)}" alt="">` : "");
  const section = (title: string, body: string) => (body ? `<section><h2>${esc(title)}</h2>${body}</section>` : "");
  const para = (text: string) => (text ? `<p>${esc(text)}</p>` : "");
  const venue = (item: Venue) => (item.name || item.address ? `<h3>${esc(item.name)}</h3>${para(item.time)}${para(item.address)}${para(item.notes)}` : "");

  const messages = (await listRecords(site.id, "messages")).filter((row) => !row.data.hidden);
  const gifts = (await listRecords(site.id, "gifts")).filter((row) => row.data.status === "confirmed" && row.data.message);

  const custom = data.customSections
    .filter((item) => item.visible)
    .map((item) => section(item.title, `${img(item.photo)}${para(item.text)}`))
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(coupleNames(data))}</title>
<style>
body{margin:0;font-family:Georgia,serif;color:${palette.text};background:${palette.bg};line-height:1.6}
header{padding:64px 20px;text-align:center;background:${palette.primary};color:#fff}
h1{margin:0;font-size:44px;font-weight:400}
section{max-width:760px;margin:0 auto;padding:36px 20px;text-align:center;white-space:pre-line}
h2{color:${palette.primary};font-weight:400;font-size:28px;margin:0 0 12px}
img{max-width:100%;height:auto;border-radius:6px;margin:6px}
.grid img{max-width:220px}
blockquote{margin:0 0 14px;padding:12px 16px;background:${palette.accent};border-radius:8px;text-align:left}
</style></head><body>
<header><h1>${esc(coupleNames(data))}</h1><p>${esc(formatDate(data.wedding.date))} ${esc(data.wedding.city)}</p></header>
${img(data.intro.heroImage) && `<section>${img(data.intro.heroImage)}</section>`}
${section("Boas-vindas", para(data.intro.welcome))}
${section(sectionLabel(data, "about"), para(data.couple.story))}
${section(sectionLabel(data, "gallery"), data.gallery.length ? `<div class="grid">${data.gallery.map(img).join("")}</div>` : "")}
${section(sectionLabel(data, "padrinhos"), data.padrinhos.map((person) => `<p><strong>${esc(person.name)}</strong> ${esc(person.role)}</p>`).join(""))}
${section(sectionLabel(data, "ceremony"), venue(data.ceremony))}
${section(sectionLabel(data, "party"), venue(data.party))}
${custom}
${section(sectionLabel(data, "mural"), messages.map((row) => `<blockquote>${esc(row.data.text)}<br><strong>${esc(row.data.author)}</strong></blockquote>`).join(""))}
${section("Mensagens com os presentes", gifts.map((row) => `<blockquote>${esc(row.data.message)}<br><strong>${esc(row.data.guestName)}</strong></blockquote>`).join(""))}
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="site-${site.slug}.html"`,
    },
  });
}
