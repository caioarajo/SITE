"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, formatDate, statusLabels } from "@/lib/utils";
import type { LeadRow, EventStatus } from "@/lib/types";

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [promotedLeadIds, setPromotedLeadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [promoting, setPromoting] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  async function load() {
    setLoading(true);
    const [leadsRes, opportunitiesRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("opportunities").select("lead_id").not("lead_id", "is", null),
    ]);
    setLeads((leadsRes.data as LeadRow[] | null) ?? []);
    setPromotedLeadIds(new Set((opportunitiesRes.data ?? []).map((o) => o.lead_id as string)));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id: string, status: EventStatus) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await supabase.from("leads").update({ status }).eq("id", id);
  }

  async function removeLead(id: string) {
    if (!confirm("Apagar este lead? Essa ação não pode ser desfeita.")) return;
    setLeads((prev) => prev.filter((l) => l.id !== id));
    await supabase.from("leads").delete().eq("id", id);
  }

  async function promoteToOpportunity(lead: LeadRow) {
    setPromoting(lead.id);
    const { error } = await supabase.from("opportunities").insert({
      lead_id: lead.id,
      name: lead.name,
      event_type: lead.event_type,
      source: "site_form",
      stage: "novo",
      notes: lead.message,
    });
    setPromoting(null);
    if (error) {
      alert(error.message);
      return;
    }
    router.push("/admin/crm");
  }

  const filtered = filter === "todos" ? leads : leads.filter((l) => l.status === filter);

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Leads</h1>
          <p>Contatos recebidos pelo formulário do site</p>
        </div>
        <select className="field-select" style={{ width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="todos">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="em_contato">Em contato</option>
          <option value="fechado">Fechado</option>
        </select>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo de evento</th>
                <th>Data do evento</th>
                <th>Mensagem</th>
                <th>Recebido em</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.event_type ?? "—"}</td>
                  <td>{formatDate(lead.event_date)}</td>
                  <td style={{ maxWidth: 260, whiteSpace: "normal" }}>{lead.message ?? "—"}</td>
                  <td>{formatDateTime(lead.created_at)}</td>
                  <td>
                    <select
                      className="field-select"
                      style={{ padding: "6px 10px", fontSize: 12.5 }}
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value as EventStatus)}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="row-actions">
                    {promotedLeadIds.has(lead.id) ? (
                      <span className="status-badge status-confirmado">No CRM</span>
                    ) : (
                      <button
                        className="admin-btn admin-btn-line admin-btn-sm"
                        onClick={() => promoteToOpportunity(lead)}
                        disabled={promoting === lead.id}
                      >
                        {promoting === lead.id ? "Promovendo..." : "Promover a Oportunidade"}
                      </button>
                    )}
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => removeLead(lead.id)}>
                      Apagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="empty-state">Nenhum lead encontrado.</div>}
          {loading && <div className="empty-state">Carregando...</div>}
        </div>
      </div>
    </>
  );
}
