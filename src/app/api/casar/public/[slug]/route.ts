import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { isUnlocked, unlock } from "@/lib/casar/auth";
import { notifyCouple } from "@/lib/casar/notify";
import { pixPayload } from "@/lib/casar/pix";
import { addRecords, listRecords, siteBySlug } from "@/lib/casar/store";
import { brl, plainName } from "@/lib/casar/types";

export const dynamic = "force-dynamic";

const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
const MAX_RECORDS = 5000;

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await siteBySlug(slug);
  if (!site) return NextResponse.json({ error: "Site não encontrado." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.action === "unlock") {
    return (await unlock(site, String(body.password ?? "")))
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Senha incorreta." }, { status: 403 });
  }

  if (!(await isUnlocked(site))) return NextResponse.json({ error: "Site protegido por senha." }, { status: 403 });
  // Campo invisível: quem preenche é robô. Responde sucesso para não dar pista.
  if (body.website) return NextResponse.json({ ok: true });

  const { data } = site;
  // Os valores vêm da lista salva, não do navegador. Sem itens: presente de valor livre.
  const ids = Array.isArray(body.itemIds) ? (body.itemIds as unknown[]).slice(0, 50) : [];
  const giftItems = ids.flatMap((id) => data.gifts.items.filter((gift) => gift.id === id));
  const giftAmount = giftItems.length
    ? giftItems.reduce((sum, item) => sum + item.price, 0)
    : Math.round(Number(body.amount) * 100) / 100;
  const validAmount = giftAmount >= 1 && giftAmount <= 100000;
  const giftsOpen = data.sections.gifts && data.gifts.visible;

  switch (body.action) {
    case "rsvp": {
      if (!data.sections.rsvp) break;
      const { rsvp } = data;
      const name = text(body.name, 120);
      if (!name) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
      if (rsvp.mode === "closed") {
        const guests = await listRecords(site.id, "guests");
        if (!guests.some((row) => plainName(row.data.name) === plainName(name))) {
          return NextResponse.json({ error: "Não encontramos este nome na lista. Digite como está no convite ou fale com os noivos." }, { status: 403 });
        }
      }
      if ((await listRecords(site.id, "rsvps")).length >= MAX_RECORDS) break;
      const count = (value: unknown, max: number) => Math.min(Math.max(Math.floor(Number(value) || 0), 0), max);
      const attending = Boolean(body.attending);
      const adults = attending ? Math.max(count(body.adults, rsvp.maxAdults), 1) : 0;
      const children = attending ? count(body.children, rsvp.maxChildren) : 0;
      const companions = attending && rsvp.fullNames === "all" && Array.isArray(body.companions)
        ? (body.companions as unknown[]).slice(0, adults + children - 1).map((item) => text(item, 120)).filter(Boolean)
        : [];
      await addRecords(site.id, "rsvps", [{
        name,
        attending,
        adults,
        children,
        phone: text(body.phone, 30),
        note: rsvp.showNotes ? text(body.note, 500) : "",
        companions,
      }]);
      await notifyCouple(data, attending ? `${name} confirmou presença` : `${name} não poderá ir`, [
        attending ? `${name} confirmou presença: ${adults} adulto(s) e ${children} criança(s).` : `${name} avisou que não poderá ir.`,
      ]);
      return NextResponse.json({ ok: true });
    }
    case "message": {
      if (!data.sections.mural) break;
      const author = text(body.author, 80);
      const message = text(body.text, 600);
      if (!author || !message) return NextResponse.json({ error: "Preencha seu nome e o recado." }, { status: 400 });
      if ((await listRecords(site.id, "messages")).length >= MAX_RECORDS) break;
      const [row] = await addRecords(site.id, "messages", [{ author, text: message, hidden: false }]);
      await notifyCouple(data, `Novo recado de ${author}`, [message]);
      return NextResponse.json({ message: { id: row.id, author, text: message, createdAt: row.createdAt } });
    }
    case "pix": {
      if (!giftsOpen || !data.gifts.pix.key.trim()) break;
      if (!validAmount) return NextResponse.json({ error: "Informe um valor entre R$ 1 e R$ 100.000." }, { status: 400 });
      const description = giftItems.length === 1 ? giftItems[0].title : giftItems.length ? "Presentes de casamento" : undefined;
      const payload = pixPayload({ ...data.gifts.pix, amount: giftAmount, description });
      const qr = await QRCode.toString(payload, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
      return NextResponse.json({ payload, qr, amount: giftAmount, holder: data.gifts.pix.holder });
    }
    case "gift": {
      if (!giftsOpen) break;
      const guestName = text(body.guestName, 120);
      if (!guestName) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
      if (!validAmount) return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
      if ((await listRecords(site.id, "gifts")).length >= MAX_RECORDS) break;
      const title = giftItems.length ? giftItems.map((item) => item.title).join(", ").slice(0, 300) : "Presente de valor livre";
      const message = text(body.message, 600);
      await addRecords(site.id, "gifts", [{
        guestName,
        phone: text(body.phone, 30),
        message,
        title,
        amount: giftAmount,
        status: "pending",
      }]);
      await notifyCouple(data, `${guestName} avisou de um presente`, [
        `${guestName} avisou que fez um Pix de ${brl(giftAmount)}: ${title}.`,
        ...(message ? [`Mensagem: ${message}`] : []),
        "Confira no extrato do banco e marque como recebido no painel.",
      ]);
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ error: "Esta opção não está disponível." }, { status: 400 });
}
