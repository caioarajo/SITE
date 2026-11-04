"use client";

import { useMemo, useState, type FormEvent } from "react";
import { plainName as nameKey, type Guest, type Row } from "@/lib/casar/types";
import type { PanelProps } from "../Editor";
import { api, Field, Icon, Toggle } from "../ui";
import { downloadCsv, shortDate, useRows } from "./useRows";

const EMPTY: Guest = { name: "", phone: "", group: "", companions: 0 };

/** "Maria Silva;92 99999-0000;Família;2", um por linha. Só o nome é obrigatório. */
const parseGuests = (text: string): Guest[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.split(/[;\t]/).map((part) => part.trim()))
    .filter(([name]) => name)
    .map(([name, phone = "", group = "", companions = "0"]) => ({ name, phone, group, companions: Number(companions) || 0 }));

export function GuestsPanel({ siteUrl, data }: PanelProps) {
  const { rows, setRows, loading, error, setError } = useRows("guests");
  const { rows: rsvps } = useRows("rsvps");
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [importText, setImportText] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const statusOf = useMemo(() => {
    const byName = new Map(rsvps.map((row) => [nameKey(row.data.name), row.data.attending]));
    return (name: string) => byName.get(nameKey(name));
  }, [rsvps]);

  const visible = rows.filter((row) => nameKey(`${row.data.name} ${row.data.group}`).includes(nameKey(filter)));
  const totalPeople = rows.reduce((sum, row) => sum + 1 + row.data.companions, 0);

  const add = async (guests: Guest[]) => {
    const result = await api<{ rows: Row<"guests">[] }>("/api/casar/records", "POST", { guests });
    setRows((list) => [...list, ...result.rows]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await api("/api/casar/records", "PATCH", { kind: "guests", id: editing, guest: form });
        setRows((list) => list.map((row) => (row.id === editing ? { ...row, data: form } : row)));
        setEditing(null);
      } else {
        await add([form]);
      }
      setForm(EMPTY);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (id: string) => {
    await api(`/api/casar/records?kind=guests&id=${id}`, "DELETE");
    setRows((list) => list.filter((row) => row.id !== id));
  };

  const runImport = async () => {
    setError("");
    try {
      await add(parseGuests(importText ?? ""));
      setImportText(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const inviteLink = (guest: Guest) => {
    const phone = guest.phone.replace(/\D/g, "");
    const number = phone.length <= 11 ? `55${phone}` : phone;
    const text = `Oi, ${guest.name.split(" ")[0]}! ${data.couple.name1} e ${data.couple.name2} vão se casar e queremos você lá. Confirme sua presença em: ${siteUrl}#rsvp`;
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <div className="lc-stats">
        <div><b>{rows.length}</b><span>convites</span></div>
        <div><b>{totalPeople}</b><span>pessoas com acompanhantes</span></div>
        <div><b>{rows.filter((row) => statusOf(row.data.name) === true).length}</b><span>confirmados da lista</span></div>
      </div>

      <form className="lc-card lc-form-row" onSubmit={(e) => void submit(e)}>
        <Field label="Nome" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Field label="WhatsApp" inputMode="tel" maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Field label="Grupo" placeholder="Família, amigos…" maxLength={60} value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} />
        <Field label="Acompanhantes" type="number" min={0} max={20} value={form.companions} onChange={(e) => setForm({ ...form, companions: Number(e.target.value) })} />
        <button className="lc-btn lc-btn-sm">{editing ? "Salvar" : "Adicionar"}</button>
        {editing && <button type="button" className="lc-text-btn" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancelar</button>}
      </form>
      {error && <p className="lc-error" role="alert">{error}</p>}

      <div className="lc-toolbar lc-no-print">
        <input aria-label="Buscar convidado" placeholder="Buscar por nome ou grupo" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" onClick={() => setImportText(importText === null ? "" : null)}>Importar lista</button>
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" disabled={!rows.length} onClick={() => downloadCsv("convidados.csv", [["Nome", "WhatsApp", "Grupo", "Acompanhantes", "Resposta"], ...rows.map((row) => [row.data.name, row.data.phone, row.data.group, row.data.companions, statusLabel(statusOf(row.data.name))])])}>Baixar planilha</button>
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" disabled={!rows.length} onClick={() => window.print()}>Imprimir</button>
      </div>

      {importText !== null && (
        <div className="lc-card lc-no-print">
          <label className="lc-field">
            <span>Cole um convidado por linha: nome; WhatsApp; grupo; acompanhantes</span>
            <textarea rows={6} placeholder={"Maria Silva; 92 99999-0000; Família; 1\nJoão Souza"} value={importText} onChange={(e) => setImportText(e.target.value)} />
          </label>
          <button type="button" className="lc-btn lc-btn-sm" disabled={!parseGuests(importText).length} onClick={() => void runImport()}>
            Importar {parseGuests(importText).length || ""}
          </button>
        </div>
      )}

      {loading ? <p className="lc-empty">Carregando…</p> : !visible.length ? (
        <p className="lc-empty">{rows.length ? "Ninguém encontrado com essa busca." : "Adicionem o primeiro convidado no formulário acima."}</p>
      ) : (
        <div className="lc-table-wrap">
          <table className="lc-table">
            <thead><tr><th>Nome</th><th>WhatsApp</th><th>Grupo</th><th>Acomp.</th><th>Resposta</th><th className="lc-no-print"><span className="lc-sr">Ações</span></th></tr></thead>
            <tbody>
              {visible.map((row) => {
                const status = statusOf(row.data.name);
                return (
                  <tr key={row.id}>
                    <td>{row.data.name}</td>
                    <td>{row.data.phone || "—"}</td>
                    <td>{row.data.group || "—"}</td>
                    <td>{row.data.companions}</td>
                    <td><span className={`lc-tag ${status === true ? "is-yes" : status === false ? "is-no" : ""}`}>{statusLabel(status)}</span></td>
                    <td className="lc-table-actions lc-no-print">
                      {row.data.phone.replace(/\D/g, "").length >= 10 && (
                        <a className="lc-text-btn" href={inviteLink(row.data)} target="_blank" rel="noopener noreferrer">Convidar</a>
                      )}
                      <button type="button" className="lc-icon-btn" aria-label={`Editar ${row.data.name}`} onClick={() => { setEditing(row.id); setForm(row.data); window.scrollTo({ top: 0 }); }}><Icon name="pencil" size={16} /></button>
                      <button type="button" className="lc-icon-btn" aria-label={`Excluir ${row.data.name}`} onClick={() => void remove(row.id)}><Icon name="trash" size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const statusLabel = (status: boolean | undefined) => (status === true ? "Confirmado" : status === false ? "Não vai" : "Sem resposta");

export function RsvpPanel({ siteUrl, data }: PanelProps) {
  const { rows, setRows, loading, error } = useRows("rsvps");
  const { rows: guests } = useRows("guests");
  const [tab, setTab] = useState<"all" | "yes" | "no" | "pending">("all");
  const [filter, setFilter] = useState("");
  const yes = rows.filter((row) => row.data.attending);
  const adults = yes.reduce((sum, row) => sum + row.data.adults, 0);
  const children = yes.reduce((sum, row) => sum + row.data.children, 0);

  const remove = async (id: string) => {
    await api(`/api/casar/records?kind=rsvps&id=${id}`, "DELETE");
    setRows((list) => list.filter((row) => row.id !== id));
  };

  const answered = new Set(rows.map((row) => nameKey(row.data.name)));
  const pending = guests.filter((row) => !answered.has(nameKey(row.data.name)));
  const askText = `Oi! Falta pouco para o casamento de ${data.couple.name1} e ${data.couple.name2}. Pode confirmar sua presença? ${siteUrl}#rsvp`;
  const shown = [...rows]
    .reverse()
    .filter((row) => tab === "all" || (tab === "yes" ? row.data.attending : tab === "no" ? !row.data.attending : false))
    .filter((row) => nameKey(row.data.name).includes(nameKey(filter)));
  const TABS: [typeof tab, string][] = [
    ["all", `Todos (${rows.length})`],
    ["yes", `Confirmados (${yes.length})`],
    ["no", `Cancelados (${rows.length - yes.length})`],
    ["pending", `Pendentes (${pending.length})`],
  ];

  return (
    <>
      <div className="lc-stats">
        <div><b>{adults + children}</b><span>confirmados: {adults} adultos e {children} crianças</span></div>
        <div><b>{rows.length - yes.length}</b><span>cancelados</span></div>
        <div><b>{pending.length}</b><span>pendentes da lista</span></div>
      </div>
      <div className="lc-tabs" role="tablist" aria-label="Situação da resposta">
        {TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "is-on" : ""} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {error && <p className="lc-error" role="alert">{error}</p>}
      <div className="lc-toolbar lc-no-print">
        <input aria-label="Buscar um convidado" placeholder="Buscar um convidado" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <a className="lc-btn lc-btn-ghost lc-btn-sm" href={`https://wa.me/?text=${encodeURIComponent(askText)}`} target="_blank" rel="noopener noreferrer">Pedir confirmação</a>
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" disabled={!rows.length} onClick={() => downloadCsv("confirmacoes.csv", [["Nome", "Vai?", "Adultos", "Crianças", "Acompanhantes", "WhatsApp", "Observação", "Data"], ...rows.map((row) => [row.data.name, row.data.attending ? "Sim" : "Não", row.data.adults, row.data.children, (row.data.companions ?? []).join(", "), row.data.phone, row.data.note, shortDate(row.createdAt)])])}>Baixar planilha</button>
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" disabled={!rows.length} onClick={() => window.print()}>Imprimir</button>
      </div>
      {tab === "pending" ? (
        !pending.length ? <p className="lc-empty">Ninguém da lista de convidados está pendente.</p> : (
          <div className="lc-table-wrap">
            <table className="lc-table">
              <thead><tr><th>Nome</th><th>WhatsApp</th><th>Grupo</th></tr></thead>
              <tbody>
                {pending.filter((row) => nameKey(row.data.name).includes(nameKey(filter))).map((row) => (
                  <tr key={row.id}><td>{row.data.name}</td><td>{row.data.phone || "—"}</td><td>{row.data.group || "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : loading ? <p className="lc-empty">Carregando…</p> : !shown.length ? (
        <p className="lc-empty">{rows.length ? "Nenhuma resposta nesta busca." : "As respostas do formulário “Confirme sua presença” aparecem aqui."}</p>
      ) : (
        <div className="lc-table-wrap">
          <table className="lc-table">
            <thead><tr><th>Nome</th><th>Resposta</th><th>Adultos</th><th>Crianças</th><th>WhatsApp</th><th>Observação</th><th>Data</th><th className="lc-no-print"><span className="lc-sr">Ações</span></th></tr></thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id}>
                  <td>{row.data.name}{row.data.companions?.length ? <small className="lc-companions">Com: {row.data.companions.join(", ")}</small> : null}</td>
                  <td><span className={`lc-tag ${row.data.attending ? "is-yes" : "is-no"}`}>{row.data.attending ? "Confirmado" : "Não vai"}</span></td>
                  <td>{row.data.adults}</td>
                  <td>{row.data.children}</td>
                  <td>{row.data.phone || "—"}</td>
                  <td>{row.data.note || "—"}</td>
                  <td>{shortDate(row.createdAt)}</td>
                  <td className="lc-table-actions lc-no-print"><button type="button" className="lc-icon-btn" aria-label={`Excluir resposta de ${row.data.name}`} onClick={() => void remove(row.id)}><Icon name="trash" size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function RsvpSettingsPanel({ data, update }: PanelProps) {
  const config = data.rsvp;
  const set = (patch: Partial<typeof config>) => update((d) => ({ ...d, rsvp: { ...d.rsvp, ...patch } }));
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <>
      <div className="lc-options" role="radiogroup" aria-label="Modelo de confirmação">
        <label className={`lc-option lc-option-col${config.mode === "open" ? " is-on" : ""}`}>
          <input type="radio" name="rsvp-mode" checked={config.mode === "open"} onChange={() => set({ mode: "open" })} />
          <span><strong>Confirmação aberta</strong><small>Qualquer pessoa com o link pode confirmar. Não precisa cadastrar.</small></span>
        </label>
        <label className={`lc-option lc-option-col${config.mode === "closed" ? " is-on" : ""}`}>
          <input type="radio" name="rsvp-mode" checked={config.mode === "closed"} onChange={() => set({ mode: "closed" })} />
          <span><strong>Confirmação fechada</strong><small>Só confirma quem estiver na Lista de convidados, com o nome igual ao cadastrado.</small></span>
        </label>
      </div>
      <Field label="Título" placeholder="Confirme sua presença" maxLength={40} value={data.sectionLabels.rsvp ?? ""} onChange={(e) => update((d) => ({ ...d, sectionLabels: { ...d.sectionLabels, rsvp: e.target.value } }))} />
      <label className="lc-field">
        <span>Introdução (opcional)</span>
        <textarea rows={2} maxLength={300} value={config.intro} onChange={(e) => set({ intro: e.target.value })} />
      </label>
      <label className="lc-field">
        <span>Solicitar o nome completo</span>
        <select value={config.fullNames} onChange={(e) => set({ fullNames: e.target.value as typeof config.fullNames })}>
          <option value="one">Apenas de quem preencheu o formulário</option>
          <option value="all">De quem preencheu e dos acompanhantes</option>
        </select>
      </label>
      <div className="lc-row-2">
        <label className="lc-field">
          <span>Máximo de adultos</span>
          <select value={config.maxAdults} onChange={(e) => set({ maxAdults: Number(e.target.value) })}>
            {range(1, 9).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="lc-field">
          <span>Máximo de crianças</span>
          <select value={config.maxChildren} onChange={(e) => set({ maxChildren: Number(e.target.value) })}>
            {range(0, 10).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <label className="lc-field">
        <span>Idade máxima das crianças</span>
        <select value={config.childAge ?? ""} onChange={(e) => set({ childAge: e.target.value ? Number(e.target.value) : null })}>
          <option value="">Prefiro não informar</option>
          {range(1, 18).map((value) => <option key={value} value={value}>{value} anos</option>)}
        </select>
      </label>
      <Toggle label="Incluir campo de observação" checked={config.showNotes} onChange={(showNotes) => set({ showNotes })} />
    </>
  );
}

export function MuralPanel() {
  const { rows, setRows, loading, error } = useRows("messages");

  const setHidden = async (id: string, hidden: boolean) => {
    await api("/api/casar/records", "PATCH", { kind: "messages", id, hidden });
    setRows((list) => list.map((row) => (row.id === id ? { ...row, data: { ...row.data, hidden } } : row)));
  };
  const remove = async (id: string) => {
    await api(`/api/casar/records?kind=messages&id=${id}`, "DELETE");
    setRows((list) => list.filter((row) => row.id !== id));
  };

  return (
    <>
      {error && <p className="lc-error" role="alert">{error}</p>}
      {loading ? <p className="lc-empty">Carregando…</p> : !rows.length ? (
        <p className="lc-empty">Os recados dos convidados aparecem aqui. Vocês podem ocultar ou excluir qualquer um.</p>
      ) : (
        <ul className="lc-msg-list">
          {[...rows].reverse().map((row) => (
            <li key={row.id} className={`lc-card${row.data.hidden ? " is-hidden" : ""}`}>
              <p>{row.data.text}</p>
              <div className="lc-row-between">
                <small><strong>{row.data.author}</strong> · {shortDate(row.createdAt)}{row.data.hidden && " · oculto no site"}</small>
                <div className="lc-row">
                  <button type="button" className="lc-text-btn" onClick={() => void setHidden(row.id, !row.data.hidden)}>{row.data.hidden ? "Mostrar" : "Ocultar"}</button>
                  <button type="button" className="lc-icon-btn" aria-label={`Excluir recado de ${row.data.author}`} onClick={() => void remove(row.id)}><Icon name="trash" size={16} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
