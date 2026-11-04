"use client";

import { useState, type FormEvent } from "react";
import { brl, type BudgetLine } from "@/lib/casar/types";
import type { PanelProps } from "../Editor";
import { Icon, newId } from "../ui";
import { downloadCsv } from "./useRows";

export function ChecklistPanel({ data, update }: PanelProps) {
  const tasks = data.planning.tasks;
  const [title, setTitle] = useState("");
  const setTasks = (next: typeof tasks) => update((d) => ({ ...d, planning: { ...d.planning, tasks: next } }));
  const done = tasks.filter((task) => task.done).length;

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks([...tasks, { id: newId(), title: title.trim().slice(0, 120), when: "", done: false }]);
    setTitle("");
  };

  return (
    <>
      <div className="lc-stats">
        <div><b>{done} de {tasks.length}</b><span>tarefas concluídas</span></div>
      </div>
      <form className="lc-toolbar lc-no-print" onSubmit={add}>
        <input aria-label="Nova tarefa" placeholder="Nova tarefa" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="lc-btn lc-btn-sm">Adicionar</button>
      </form>
      <ul className="lc-tasks">
        {tasks.map((task) => (
          <li key={task.id} className={task.done ? "is-done" : ""}>
            <label>
              <input type="checkbox" checked={task.done} onChange={(e) => setTasks(tasks.map((item) => (item.id === task.id ? { ...item, done: e.target.checked } : item)))} />
              <span>{task.title}</span>
            </label>
            {task.when && <small>{task.when}</small>}
            <button type="button" className="lc-icon-btn lc-no-print" aria-label={`Excluir ${task.title}`} onClick={() => setTasks(tasks.filter((item) => item.id !== task.id))}><Icon name="trash" size={16} /></button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function BudgetPanel({ data, update }: PanelProps) {
  const lines = data.planning.budget;
  const setLines = (budget: BudgetLine[]) => update((d) => ({ ...d, planning: { ...d.planning, budget } }));
  const estimated = lines.reduce((sum, line) => sum + line.estimated, 0);
  const paid = lines.reduce((sum, line) => sum + line.paid, 0);
  const patch = (id: string, change: Partial<BudgetLine>) => setLines(lines.map((line) => (line.id === id ? { ...line, ...change } : line)));

  return (
    <>
      <div className="lc-stats">
        <div><b>{brl(estimated)}</b><span>orçamento previsto</span></div>
        <div><b>{brl(paid)}</b><span>já pago</span></div>
        <div><b>{brl(Math.max(estimated - paid, 0))}</b><span>falta pagar</span></div>
      </div>
      <div className="lc-toolbar lc-no-print">
        <button type="button" className="lc-btn lc-btn-sm" onClick={() => setLines([...lines, { id: newId(), item: "", estimated: 0, paid: 0 }])}><Icon name="plus" size={16} /> Novo item</button>
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" disabled={!lines.length} onClick={() => downloadCsv("orcamento.csv", [["Item", "Previsto", "Pago"], ...lines.map((line) => [line.item, line.estimated.toFixed(2).replace(".", ","), line.paid.toFixed(2).replace(".", ",")])])}>Baixar planilha</button>
      </div>
      {!lines.length ? <p className="lc-empty">Adicionem buffet, decoração, foto, vestido e o que mais estiver no planejamento.</p> : (
        <div className="lc-table-wrap">
          <table className="lc-table lc-budget">
            <thead><tr><th>Item</th><th>Previsto (R$)</th><th>Pago (R$)</th><th><span className="lc-sr">Ações</span></th></tr></thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={line.id}>
                  <td><input aria-label={`Item ${i + 1}`} maxLength={100} value={line.item} onChange={(e) => patch(line.id, { item: e.target.value })} /></td>
                  <td><input aria-label={`Valor previsto do item ${i + 1}`} type="number" min={0} step="any" value={line.estimated} onChange={(e) => patch(line.id, { estimated: Number(e.target.value) })} /></td>
                  <td><input aria-label={`Valor pago do item ${i + 1}`} type="number" min={0} step="any" value={line.paid} onChange={(e) => patch(line.id, { paid: Number(e.target.value) })} /></td>
                  <td className="lc-table-actions"><button type="button" className="lc-icon-btn" aria-label={`Excluir ${line.item}`} onClick={() => setLines(lines.filter((item) => item.id !== line.id))}><Icon name="trash" size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
