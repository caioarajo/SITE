"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import EChart from "@/components/admin/EChart";
import type { OpportunityRow, OpportunityStage, OpportunitySource } from "@/lib/types";
import { NAVY, GOLD, ROSE, TAUPE, ESPRESSO, GREEN, CATEGORY_PALETTE } from "@/lib/chartColors";
import { formatCurrency } from "@/lib/utils";

const STAGE_LABELS: Record<OpportunityStage, string> = {
  novo: "Novo",
  qualificando: "Qualificando",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

const SOURCE_LABELS: Record<OpportunitySource, string> = {
  site_form: "Formulário do site",
  whatsapp: "WhatsApp",
  manual: "Manual",
  indicacao: "Indicação",
  outro: "Outro",
};

export default function CrmDashboard({ opportunities }: { opportunities: OpportunityRow[] }) {
  const openOpportunities = opportunities.filter((o) => o.stage !== "ganho" && o.stage !== "perdido");
  const wonCount = opportunities.filter((o) => o.stage === "ganho").length;
  const lostCount = opportunities.filter((o) => o.stage === "perdido").length;
  const closedCount = wonCount + lostCount;
  const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;
  const openValue = openOpportunities.reduce((sum, o) => sum + (o.estimated_value ?? 0), 0);

  const funnelOption = useMemo(() => {
    const stages: OpportunityStage[] = ["novo", "qualificando", "proposta", "negociacao", "ganho"];
    const data = stages.map((stage, i) => ({
      value: opportunities.filter((o) => o.stage === stage).length,
      name: STAGE_LABELS[stage],
      itemStyle: { color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] },
    }));

    return {
      tooltip: { trigger: "item" },
      series: [
        {
          type: "funnel",
          left: "6%",
          right: "6%",
          top: 10,
          bottom: 10,
          minSize: "20%",
          maxSize: "100%",
          sort: "descending",
          label: { color: "#fff", fontSize: 12 },
          data,
        },
      ],
    };
  }, [opportunities]);

  const sourceOption = useMemo(() => {
    const counts: Record<string, number> = {};
    opportunities.forEach((o) => {
      counts[o.source] = (counts[o.source] ?? 0) + 1;
    });
    const entries = Object.entries(counts);
    const colors: Record<OpportunitySource, string> = {
      site_form: NAVY,
      whatsapp: GREEN,
      manual: GOLD,
      indicacao: ROSE,
      outro: TAUPE,
    };

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
          data: entries.map(([source, value]) => ({
            value,
            name: SOURCE_LABELS[source as OpportunitySource] ?? source,
            itemStyle: { color: colors[source as OpportunitySource] ?? ESPRESSO },
          })),
        },
      ],
    };
  }, [opportunities]);

  const valueByStageOption = useMemo(() => {
    const stages: OpportunityStage[] = ["novo", "qualificando", "proposta", "negociacao"];
    const data = stages.map((stage) =>
      opportunities.filter((o) => o.stage === stage).reduce((sum, o) => sum + (o.estimated_value ?? 0), 0)
    );

    return {
      grid: { left: 90, right: 24, top: 10, bottom: 10 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (v: number) => formatCurrency(v) },
      xAxis: { type: "value", splitLine: { lineStyle: { color: "#efe7da" } }, axisLabel: { color: "#8f7c66" } },
      yAxis: {
        type: "category",
        data: stages.map((s) => STAGE_LABELS[s]),
        axisLabel: { color: "#5b4f42", fontSize: 12 },
      },
      series: [
        {
          type: "bar",
          data: data.map((v, i) => ({ value: v, itemStyle: { color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] } })),
          barWidth: 18,
          label: { show: true, position: "right", color: "#5b4f42", formatter: (p: { value: number }) => formatCurrency(p.value) },
        },
      ],
    };
  }, [opportunities]);

  return (
    <>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="label">Oportunidades abertas</div>
          <div className="value">{openOpportunities.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Valor em negociação</div>
          <div className="value">{formatCurrency(openValue)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Taxa de conversão</div>
          <div className="value">{conversionRate}%</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Ganhas / Perdidas</div>
          <div className="value">
            {wonCount} / {lostCount}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginBottom: 24 }}>
        <div className="chart-card">
          <h2>Funil por estágio</h2>
          <EChart option={funnelOption as EChartsOption} height={280} />
        </div>
        <div className="chart-card">
          <h2>Origem das oportunidades</h2>
          <EChart option={sourceOption as EChartsOption} />
        </div>
        <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
          <h2>Valor estimado em aberto por estágio</h2>
          <EChart option={valueByStageOption as EChartsOption} height={200} />
        </div>
      </div>
    </>
  );
}
