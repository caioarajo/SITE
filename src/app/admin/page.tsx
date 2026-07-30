import { createClient } from "@/lib/supabase/server";
import DashboardCharts from "@/components/admin/DashboardCharts";
import { formatDateTime } from "@/lib/utils";
import type { LeadRow } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [leadsRes, portfolioRes, testimonialsRes, servicesRes] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("portfolio_items").select("id", { count: "exact", head: true }),
    supabase.from("testimonials").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }),
  ]);

  const leads = (leadsRes.data as LeadRow[] | null) ?? [];
  const novoCount = leads.filter((l) => l.status === "novo").length;

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do site e dos contatos recebidos</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="label">Leads no total</div>
          <div className="value">{leads.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Leads novos</div>
          <div className="value">{novoCount}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Itens no portfólio</div>
          <div className="value">{portfolioRes.count ?? 0}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Depoimentos</div>
          <div className="value">{testimonialsRes.count ?? 0}</div>
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
