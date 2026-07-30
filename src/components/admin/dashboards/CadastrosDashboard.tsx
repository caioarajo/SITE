"use client";

import { useMemo } from "react";
import { format, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EChartsOption } from "echarts";
import EChart from "@/components/admin/EChart";
import type { EventRow, EventRecordStatus, StaffRow, SupplierRow, ProductRow } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { NAVY, GOLD, ROSE, TAUPE, ESPRESSO, GREEN } from "@/lib/chartColors";

const STATUS_LABELS: Record<EventRecordStatus, string> = {
  planejamento: "Planejamento",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<EventRecordStatus, string> = {
  planejamento: TAUPE,
  confirmado: NAVY,
  em_andamento: GOLD,
  concluido: GREEN,
  cancelado: ROSE,
};

export default function CadastrosDashboard({
  events,
  staff,
  suppliers,
  products,
}: {
  events: EventRow[];
  staff: StaffRow[];
  suppliers: SupplierRow[];
  products: ProductRow[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter((e) => e.event_date && e.event_date >= today && e.status !== "cancelado")
    .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""))
    .slice(0, 6);

  const monthOption = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i));
    const counts = months.map(
      (m) => events.filter((e) => e.event_date && e.event_date.slice(0, 7) === format(m, "yyyy-MM")).length
    );

    return {
      grid: { left: 36, right: 16, top: 20, bottom: 30 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: months.map((m) => format(m, "MMM/yy", { locale: ptBR })),
        axisLine: { lineStyle: { color: "#d8cdbe" } },
        axisLabel: { color: "#8f7c66", fontSize: 11 },
      },
      yAxis: { type: "value", minInterval: 1, splitLine: { lineStyle: { color: "#efe7da" } }, axisLabel: { color: "#8f7c66" } },
      series: [{ type: "bar", data: counts, itemStyle: { color: GOLD }, barWidth: 28 }],
    };
  }, [events]);

  const statusOption = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      counts[e.status] = (counts[e.status] ?? 0) + 1;
    });

    return {
      tooltip: { trigger: "item" },
      legend: { bottom: 0, textStyle: { color: "#5b4f42", fontSize: 12 } },
      series: [
        {
          type: "pie",
          radius: ["45%", "72%"],
          center: ["50%", "42%"],
          itemStyle: { borderColor: "#faf6ef", borderWidth: 2 },
          label: { color: "#352b22", fontSize: 12 },
          data: Object.entries(counts).map(([status, value]) => ({
            value,
            name: STATUS_LABELS[status as EventRecordStatus] ?? status,
            itemStyle: { color: STATUS_COLORS[status as EventRecordStatus] ?? ESPRESSO },
          })),
        },
      ],
    };
  }, [events]);

  return (
    <>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="label">Eventos ativos</div>
          <div className="value">{events.filter((e) => e.status !== "cancelado" && e.status !== "concluido").length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Colaboradores ativos</div>
          <div className="value">{staff.filter((s) => s.is_active).length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Fornecedores ativos</div>
          <div className="value">{suppliers.filter((s) => s.is_active).length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Produtos ativos</div>
          <div className="value">{products.filter((p) => p.is_active).length}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 24 }}>
        <div className="chart-card">
          <h2>Eventos por mês</h2>
          <EChart option={monthOption as EChartsOption} />
        </div>
        <div className="chart-card">
          <h2>Eventos por status</h2>
          <EChart option={statusOption as EChartsOption} />
        </div>
      </div>

      <div className="admin-card">
        <h2 style={{ marginBottom: 16 }}>Próximos eventos</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>{formatDate(e.event_date)}</td>
                  <td>
                    <span className={`status-badge status-${e.status}`}>{STATUS_LABELS[e.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {upcoming.length === 0 && <div className="empty-state">Nenhum evento futuro.</div>}
        </div>
      </div>
    </>
  );
}
