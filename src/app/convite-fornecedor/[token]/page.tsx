import { createServiceRoleClient } from "@/lib/supabase/server";
import { AGENDA_CATEGORY_LABELS } from "@/lib/agendaCategories";
import { formatDateTime } from "@/lib/utils";
import SupplierConfirmButton from "@/components/site/SupplierConfirmButton";
import type { AgendaCategory } from "@/lib/types";

export default async function ConviteFornecedorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createServiceRoleClient();

  // Seleção deliberadamente mínima: só o necessário para o fornecedor
  // decidir e confirmar presença — sem dados financeiros nem internos.
  const { data: item } = await supabase
    .from("agenda_items")
    .select("id, title, category, start_at, location, location_type, meeting_link, event_id, supplier_confirmed_at")
    .eq("supplier_invite_token", token)
    .maybeSingle();

  let eventTitle: string | null = null;
  if (item?.event_id) {
    const { data: eventRow } = await supabase.from("events").select("title").eq("id", item.event_id).maybeSingle();
    eventTitle = eventRow?.title ?? null;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--cream)" }}>
      <div className="admin-card" style={{ maxWidth: 460, width: "100%" }}>
        <img src="/logo-icon-navy.png" alt="LP" style={{ height: 36, marginBottom: 20 }} />
        {!item ? (
          <>
            <h1 style={{ fontSize: 20, marginBottom: 10 }}>Convite não encontrado</h1>
            <p style={{ fontSize: 14, color: "var(--taupe-deep)" }}>
              Este link não é válido ou já expirou. Entre em contato com a equipe da LP Assessoria &amp; Cerimonial.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold)", marginBottom: 6 }}>
              {AGENDA_CATEGORY_LABELS[item.category as AgendaCategory]}
            </p>
            <h1 style={{ fontSize: 22, marginBottom: 16 }}>{item.title}</h1>
            <div style={{ display: "grid", gap: 10, fontSize: 14.5, marginBottom: 24 }}>
              <div>
                <b>Quando:</b> {formatDateTime(item.start_at)}
              </div>
              {eventTitle && (
                <div>
                  <b>Evento:</b> {eventTitle}
                </div>
              )}
              {item.location_type === "online" ? (
                item.meeting_link && (
                  <div>
                    <b>Link:</b>{" "}
                    <a href={item.meeting_link} target="_blank" rel="noopener noreferrer">
                      {item.meeting_link}
                    </a>
                  </div>
                )
              ) : (
                item.location && (
                  <div>
                    <b>Local:</b> {item.location}
                  </div>
                )
              )}
            </div>
            <SupplierConfirmButton token={token} alreadyConfirmed={!!item.supplier_confirmed_at} />
          </>
        )}
      </div>
    </div>
  );
}
