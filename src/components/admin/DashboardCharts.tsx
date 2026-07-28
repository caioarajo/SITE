"use client";

import { useMemo } from "react";
import { format, subDays, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EChartsOption } from "echarts";
import EChart from "./EChart";
import type { LeadRow } from "@/lib/types";

const NAVY = "#182c52";
const GOLD = "#ab7f3f";
const ROSE = "#c98f8a";
const TAUPE = "#b6a48d";

export default function DashboardCharts({ leads }: { leads: LeadRow[] }) {
  // --- Leads nos últimos 30 dias (gráfico de linha) ---
  const lineOption = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({ start: subDays(today, 29), end: today });

    const counts = days.map(
      (day) => leads.filter((lead) => isSameDay(parseISO(lead.created_at), day)).length
    );

    return {
      grid: { left: 36, right: 16, top: 20, bottom: 30 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: days.map((d) => format(d, "dd/MM", { locale: ptBR })),
        axisLine: { lineStyle: { color: "#d8cdbe" } },
        axisLabel: { color: "#8f7c66", fontSize: 10, interval: 3 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: "#efe7da" } },
        axisLabel: { color: "#8f7c66", fontSize: 11 },
      },
      series: [
        {
          type: "line",
          data: counts,
          smooth: true,
          symbolSize: 6,
          lineStyle: { color: GOLD, width: 2.5 },
          itemStyle: { color: GOLD },
          areaStyle: { color: "rgba(171,127,63,0.12)" },
        },
      ],
    };
  }, [leads]);

  // --- Distribuição por status (pizza) ---
  const statusOption = useMemo(() => {
    const counts: Record<string, number> = { novo: 0, em_contato: 0, fechado: 0 };
    leads.forEach((lead) => {
      counts[lead.status] = (counts[lead.status] ?? 0) + 1;
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
          data: [
            { value: counts.novo, name: "Novo", itemStyle: { color: NAVY } },
            { value: counts.em_contato, name: "Em contato", itemStyle: { color: GOLD } },
            { value: counts.fechado, name: "Fechado", itemStyle: { color: "#3a8a5c" } },
          ],
        },
      ],
    };
  }, [leads]);

  // --- Interesse por tipo de evento (barras) ---
  const eventTypeOption = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((lead) => {
      const type = lead.event_type || "Outro";
      counts[type] = (counts[type] ?? 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const colors = [NAVY, GOLD, ROSE, TAUPE, "#8f7c66", "#3a8a5c"];

    return {
      grid: { left: 90, right: 24, top: 10, bottom: 10 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: { type: "value", splitLine: { lineStyle: { color: "#efe7da" } }, axisLabel: { color: "#8f7c66" } },
      yAxis: {
        type: "category",
        data: entries.map((e) => e[0]),
        axisLabel: { color: "#5b4f42", fontSize: 12 },
      },
      series: [
        {
          type: "bar",
          data: entries.map((e, i) => ({ value: e[1], itemStyle: { color: colors[i % colors.length] } })),
          barWidth: 18,
          label: { show: true, position: "right", color: "#5b4f42" },
        },
      ],
    };
  }, [leads]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 24 }}>
      <div className="chart-card">
        <h2>Leads nos últimos 30 dias</h2>
        <EChart option={lineOption as EChartsOption} />
      </div>
      <div className="chart-card">
        <h2>Status dos leads</h2>
        <EChart option={statusOption as EChartsOption} />
      </div>
      <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
        <h2>Interesse por tipo de evento</h2>
        <EChart option={eventTypeOption as EChartsOption} height={Math.max(180, 60 * 3)} />
      </div>
    </div>
  );
}
