import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/memorias/access";
import { eventSummaries } from "@/lib/memorias/server";
import { AccountShell, ChangePasswordForm } from "./AccountShell";
import "../memorias-app.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Meus eventos | LP Memórias", robots: { index: false, follow: false } };

const formatDate = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "Data a definir");

export default async function ContaPage() {
  const account = await currentAccount();
  if (!account) redirect("/lp-memorias/entrar");
  if (account.kind === "staff") redirect("/admin/memorias");

  if (account.client.must_change_password) {
    return (
      <AccountShell name={account.client.name}>
        <ChangePasswordForm />
      </AccountShell>
    );
  }

  const events = await eventSummaries(account.client.id);
  return (
    <AccountShell name={account.client.name}>
      <main className="tl-panel">
        <p className="tl-eyebrow">LP Memórias</p>
        <h1 className="tl-serif tl-list-title">Meus eventos</h1>
        <div className="tl-card">
          {events.length === 0 ? (
            <p className="tl-empty">Seu evento ainda não foi liberado. Fale com a equipe da LP pelo WhatsApp.</p>
          ) : (
            <ul className="tl-event-list" data-testid="client-events">
              {events.map((event) => (
                <li key={event.id}>
                  <Link href={`/lp-memorias/conta/${event.id}`}>
                    <strong>{event.title}</strong>
                    <span>
                      {formatDate(event.eventDate)} · {event.total} {event.total === 1 ? "publicação" : "publicações"}
                      {event.pending > 0 && ` · ${event.pending} ${event.pending === 1 ? "pendente" : "pendentes"}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </AccountShell>
  );
}
