import { NextResponse, type NextRequest } from "next/server";
import { currentUser, hashPassword, requireOwnSite } from "@/lib/casar/auth";
import { pixKeyError } from "@/lib/casar/pix";
import { createSite, deleteSite, siteByOwner, slugAvailable, updateSite } from "@/lib/casar/store";
import { THEMES } from "@/lib/casar/themes";
import { defaultSiteData, GIFT_TEMPLATES, isValidSlug, normalizeData, WIZARD_SECTIONS, type GiftTemplateId, type SectionId, type SiteData } from "@/lib/casar/types";

export const dynamic = "force-dynamic";

const MAX_DOC_BYTES = 400_000;

/** Conclusão do assistente de criação: nasce um site completo, já no ar. */
export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  if (await siteByOwner(user.id)) return NextResponse.json({ error: "Sua conta já tem um site." }, { status: 409 });

  const body = (await request.json().catch(() => ({}))) as {
    slug?: string;
    name1?: string;
    name2?: string;
    date?: string;
    sections?: SectionId[] | null;
    giftTemplate?: GiftTemplateId | null;
    themeId?: string;
  };

  const slug = String(body.slug ?? "");
  if (!isValidSlug(slug)) return NextResponse.json({ error: "Use só letras, números e hífen no link." }, { status: 400 });
  if (!(await slugAvailable(slug))) return NextResponse.json({ error: "Este link já está em uso. Escolha outro." }, { status: 409 });

  const data = defaultSiteData();
  data.couple.name1 = String(body.name1 ?? "").trim().slice(0, 60);
  data.couple.name2 = String(body.name2 ?? "").trim().slice(0, 60);
  if (!data.couple.name1 || !data.couple.name2) return NextResponse.json({ error: "Informe o nome de vocês dois." }, { status: 400 });
  data.wedding.date = /^\d{4}-\d{2}-\d{2}$/.test(body.date ?? "") ? String(body.date) : "";

  // "Pular etapa" não manda lista: fica tudo ligado, e os noivos desligam depois se quiserem.
  if (Array.isArray(body.sections)) {
    for (const id of WIZARD_SECTIONS) data.sections[id] = body.sections.includes(id);
  }
  const template = body.giftTemplate && GIFT_TEMPLATES[body.giftTemplate];
  if (template) data.gifts.items = template.items.map((item) => ({ ...item }));
  if (THEMES.some((theme) => theme.id === body.themeId)) data.theme.id = String(body.themeId);

  try {
    const site = await createSite(user.id, slug, data);
    return NextResponse.json({ slug: site.slug });
  } catch {
    // Dois casais escolhendo o mesmo link ao mesmo tempo: a restrição do banco decide.
    return NextResponse.json({ error: "Não foi possível criar o site. Tente outro link." }, { status: 409 });
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireOwnSite();
  if ("error" in guard) return guard.error;
  const { site } = guard;

  const body = (await request.json().catch(() => ({}))) as { data?: unknown; slug?: string; password?: string | null };

  if (body.slug !== undefined) {
    const slug = String(body.slug);
    if (!isValidSlug(slug)) return NextResponse.json({ error: "Use só letras, números e hífen no link." }, { status: 400 });
    if (!(await slugAvailable(slug, site.id))) return NextResponse.json({ error: "Este link já está em uso." }, { status: 409 });
    await updateSite(site, { slug });
    return NextResponse.json({ slug });
  }

  if (body.password !== undefined) {
    const password = body.password === null ? "" : String(body.password);
    if (password && password.length < 4) return NextResponse.json({ error: "Use pelo menos 4 caracteres." }, { status: 400 });
    const data: SiteData = {
      ...site.data,
      privacy: { ...site.data.privacy, hasPassword: Boolean(password) },
      secret: password ? { passwordHash: hashPassword(password) } : undefined,
    };
    await updateSite(site, { data });
    return NextResponse.json({ hasPassword: Boolean(password) });
  }

  if (JSON.stringify(body.data ?? {}).length > MAX_DOC_BYTES) {
    return NextResponse.json({ error: "Conteúdo grande demais." }, { status: 413 });
  }

  const incoming = normalizeData(body.data);
  const pixError = pixKeyError(incoming.gifts.pix.keyType, incoming.gifts.pix.key);
  if (pixError) return NextResponse.json({ error: pixError }, { status: 400 });
  // A senha só muda pelo bloco acima: o navegador nunca vê nem regrava `secret`.
  await updateSite(site, {
    data: {
      ...incoming,
      privacy: { ...incoming.privacy, hasPassword: site.data.privacy.hasPassword },
      secret: site.data.secret,
    },
  });
  return NextResponse.json({ ok: true });
}

/** Exclusão definitiva: o painel pede para digitar o link, e o servidor confere de novo. */
export async function DELETE(request: NextRequest) {
  const guard = await requireOwnSite();
  if ("error" in guard) return guard.error;
  const body = (await request.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== guard.site.slug) return NextResponse.json({ error: "Digite o link do site para confirmar." }, { status: 400 });
  await deleteSite(guard.site);
  return NextResponse.json({ ok: true });
}
