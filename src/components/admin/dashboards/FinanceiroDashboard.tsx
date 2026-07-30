"use client";

import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EChartsOption } from "echarts";
import EChart from "@/components/admin/EChart";
import type { PayableRow, ReceivableRow } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { GREEN, RED, NAVY } from "@/lib/chartColors";

function isOverduePayable(item: PayableRow, today: string) {
  return item.status === "pendente" && item.due_date < today;
}
function isOverdueReceivable(item: ReceivableRow, today: string) {
  return item.status === "pendente" && item.due_date < today;
}

export default function FinanceiroDashboard({
  payable,
  receivable,
}: {
  payable: PayableRow[];
  receivable: ReceivableRow[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  const overduePayable = payable.filter((p) => isOverduePayable(p, today));
  const overdueReceivable = receivable.filter((r) => isOverdueReceivable(r, today));
  const overdueTotal =
    overduePayable.reduce((s, p) => s + p.amount, 0) + overdueReceivable.reduce((s, r) => s + r.amount, 0);

  const openPayable = payable.filter((p) => p.status === "pendente").reduce((s, p) => s + p.amount, 0);
  const openReceivable = receivable.filter((r) => r.status === "pendente").reduce((s, r) => s + r.amount, 0);
  const projectedBalance = openReceivable - openPayable;

  const cashFlowOption = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i));
    const monthKeys = months.map((m) => format(m, "yyyy-MM"));

    const received = monthKeys.map((key) =>
      receivable
        .filter((r) => r.status === "recebido" && r.received_date?.slice(0, 7) === key)
        .reduce((s, r) => s + r.amount, 0)
    );
    const paid = monthKeys.map((key) =>
      payable.filter((p) => p.status === "pago" && p.paid_date?.slice(0, 7) === key).reduce((s, p) => s + p.amount, 0)
    );
    const balance = received.map((v, i) => v - paid[i]);

    return {
      grid: { left: 50, right: 16, top: 30, bottom: 30 },
      tooltip: { trigger: "axis", valueFormatter: (v: number) => formatCurrency(v) },
      legend: { top: 0, textStyle: { color: "#5b4f42", fontSize: 12 } },
      xAxis: {
        type: "category",
        data: months.map((m) => format(m, "MMM/yy", { locale: ptBR })),
        axisLine: { lineStyle: { color: "#d8cdbe" } },
        axisLabel: { color: "#8f7c66", fontSize: 11 },
      },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "#efe7da" } }, axisLabel: { color: "#8f7c66" } },
      series: [
        { name: "Recebido", type: "line", data: received, smooth: true, lineStyle: { color: GREEN, width: 2.5 }, itemStyle: { color: GREEN } },
        { name: "Pago", type: "line", data: paid, smooth: true, lineStyle: { color: RED, width: 2.5 }, itemStyle: { color: RED } },
        { name: "Saldo", type: "bar", data: balance, itemStyle: { color: NAVY }, barWidth: 14 },
      ],
    };
  }, [payable, receivable]);

  // Projeção simples e auditável: soma das contas pendentes agrupadas pela
  // janela de vencimento a partir de hoje (sem machine learning).
  const projectionOption = useMemo(() => {
    const windows = [
      { label: "Próximos 30 dias", days: 30 },
      { label: "31–60 dias", days: 60 },
      { label: "61–90 dias", days: 90 },
    ];
    const todayDate = new Date();

    function amountInWindow(items: { due_date: string; amount: number; status: string }[], from: number, to: number) {
      return items
        .filter((item) => item.status === "pendente")
        .filter((item) => {
          const due = new Date(item.due_date);
          const diffDays = Math.ceil((due.getTime() - todayDate.getTime()) / 86400000);
          return diffDays > from && diffDays <= to;
        })
        .reduce((s, item) => s + item.amount, 0);
    }

    let previousDays = 0;
    const receivableByWindow = windows.map((w) => {
      const value = amountInWindow(receivable, previousDays, w.days);
      previousDays = w.days;
      return value;
    });
    previousDays = 0;
    const payableByWindow = windows.map((w) => {
      const value = amountInWindow(payable, previousDays, w.days);
      previousDays = w.days;
      return value;
    });

    return {
      grid: { left: 60, right: 16, top: 30, bottom: 30 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (v: number) => formatCurrency(v) },
      legend: { top: 0, textStyle: { color: "#5b4f42", fontSize: 12 } },
      xAxis: {
        type: "category",
        data: windows.map((w) => w.label),
        axisLabel: { color: "#8f7c66", fontSize: 11 },
      },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "#efe7da" } }, axisLabel: { color: "#8f7c66" } },
      series: [
        { name: "A receber", type: "bar", data: receivableByWindow, itemStyle: { color: GREEN }, barWidth: 24 },
        { name: "A pagar", type: "bar", data: payableByWindow, itemStyle: { color: RED }, barWidth: 24 },
      ],
    };
  }, [payable, receivable]);

  return (
    <>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="label">A receber (em aberto)</div>
          <div className="value">{formatCurrency(openReceivable)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">A pagar (em aberto)</div>
          <div className="value">{formatCurrency(openPayable)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Saldo previsto</div>
          <div className="value" style={{ color: projectedBalance >= 0 ? undefined : "#b3311c" }}>
            {formatCurrency(projectedBalance)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Total vencido</div>
          <div className="value" style={{ color: overdueTotal > 0 ? "#b3311c" : undefined }}>
            {formatCurrency(overdueTotal)}
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 20 }}>
        <h2>Fluxo de caixa (últimos 6 meses)</h2>
        <EChart option={cashFlowOption as EChartsOption} height={260} />
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <h2>Projeção de saldo — 30/60/90 dias</h2>
        <p style={{ fontSize: 12, color: "var(--taupe-deep)", marginTop: -8, marginBottom: 12 }}>
          Soma das contas pendentes por janela de vencimento a partir de hoje.
        </p>
        <EChart option={projectionOption as EChartsOption} height={220} />
      </div>

      {(overduePayable.length > 0 || overdueReceivable.length > 0) && (
        <div className="admin-card">
          <h2 style={{ marginBottom: 16 }}>Contas vencidas</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {overdueReceivable.map((r) => (
                  <tr key={`r-${r.id}`}>
                    <td>{r.description}</td>
                    <td>A receber</td>
                    <td>{formatDate(r.due_date)}</td>
                    <td>{formatCurrency(r.amount)}</td>
                  </tr>
                ))}
                {overduePayable.map((p) => (
                  <tr key={`p-${p.id}`}>
                    <td>{p.description}</td>
                    <td>A pagar</td>
                    <td>{formatDate(p.due_date)}</td>
                    <td>{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
