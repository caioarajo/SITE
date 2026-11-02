import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PanelClient from "@/app/admin/memorias/[id]/PanelClient";
import { requireEventAccess } from "@/lib/memorias/access";
import { adminState } from "@/lib/memorias/server";
import { AccountShell } from "../AccountShell";
import "../../memorias-app.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Painel do evento | LP Memórias", robots: { index: false, follow: false } };

export default async function ContaEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireEventAccess((await params).id);
  if ("error" in access) {
    // Sem login ou com senha provisória: a página da conta resolve. Evento de outro cliente: 404.
    if (access.error?.status === 404) notFound();
    redirect("/lp-memorias/conta");
  }
  if (access.account.kind === "staff") redirect(`/admin/memorias/${access.event.id}`);

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return (
    <AccountShell name={access.account.client.name}>
      <PanelClient initial={await adminState(access.event, `${protocol}://${host}`)} scope="client" />
    </AccountShell>
  );
}
