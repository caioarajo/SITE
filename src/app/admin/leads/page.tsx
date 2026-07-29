"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, formatDate, statusLabels } from "@/lib/utils";
import type { LeadRow, EventStatus } from "@/lib/types";

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as LeadRow[] | null) ?? []);
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
                  <td>
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
