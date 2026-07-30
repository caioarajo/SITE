"use client";

import Link from "next/link";
import DashboardCharts from "@/components/admin/DashboardCharts";
import { formatDateTime } from "@/lib/utils";
import type { LeadRow, ClientRow, EventRow, OpportunityRow, PayableRow, ReceivableRow } from "@/lib/types";

export default function GeneralDashboard({
  leads,
  clients,
  events,
  opportunities,
  payable,
  receivable,
}: {
  leads: LeadRow[];
  clients: ClientRow[];
  events: EventRow[];
  opportunities: OpportunityRow[];
  payable: PayableRow[];
  receivable: ReceivableRow[];
}) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const activeClients = clients.filter((c) => c.is_active).length;
  const confirmedEventsThisMonth = events.filter(
    (e) => e.status === "confirmado" && e.event_date?.slice(0, 7) === currentMonth
  ).length;
  const openOpportunityValue = opportunities
    .filter((o) => o.stage !== "ganho" && o.stage !== "perdido")
    .reduce((sum, o) => sum + (o.estimated_value ?? 0), 0);
  const receivableThisMonth = receivable
    .filter((r) => r.status === "pendente" && r.due_date.slice(0, 7) === currentMonth)
    .reduce((sum, r) => sum + r.amount, 0);
  const payableThisMonth = payable
    .filter((p) => p.status === "pendente" && p.due_date.slice(0, 7) === currentMonth)
    .reduce((sum, p) => sum + p.amount, 0);
  const projectedBalanceThisMonth = receivableThisMonth - payableThisMonth;

  return (
    <>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="label">Clientes ativos</div>
          <div className="value">{activeClients}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Eventos confirmados no mês</div>
          <div className="value">{confirmedEventsThisMonth}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Valor em negociação (CRM)</div>
          <div className="value">R$ {openOpportunityValue.toFixed(0)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Saldo previsto do mês</div>
          <div className="value" style={{ color: projectedBalanceThisMonth >= 0 ? undefined : "#b3311c" }}>
            R$ {projectedBalanceThisMonth.toFixed(0)}
          </div>
        </div>
      </div>

      <DashboardCharts leads={leads} />

      <div className="admin-card">
        <h2 style={{ marginBottom: 16 }}>Últimos leads recebidos</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo de evento</th>
                <th>Recebido em</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 6).map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.event_type ?? "—"}</td>
                  <td>{formatDateTime(lead.created_at)}</td>
                  <td>
                    <span className={`status-badge status-${lead.status}`}>{lead.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && <div className="empty-state">Nenhum lead recebido ainda.</div>}
        </div>
        <div style={{ marginTop: 16 }}>
          <Link href="/admin/leads" className="admin-btn admin-btn-line admin-btn-sm">
            Ver todos os leads
          </Link>
        </div>
      </div>
    </>
  );
}
