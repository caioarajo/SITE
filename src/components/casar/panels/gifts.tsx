"use client";

import { useMemo, useState } from "react";
import { pixKeyError } from "@/lib/casar/pix";
import { brl, EXTRA_GIFT_LISTS, GIFT_CATEGORIES, type GiftItem, type GiftStatus, type PixKeyType } from "@/lib/casar/types";
import type { PanelProps } from "../Editor";
import { api, Field, Icon, ImageField, newId, TextArea, Toggle } from "../ui";
import { downloadCsv, shortDate, useRows } from "./useRows";

export function GiftListPanel({ data, update }: PanelProps) {
  const items = data.gifts.items;
  const setItems = (next: GiftItem[]) => update((d) => ({ ...d, gifts: { ...d.gifts, items: next } }));
  const [template, setTemplate] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"recent" | "az" | "asc" | "desc">("recent");
  const [editing, setEditing] = useState<string | null>(null);
  const [percent, setPercent] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const visible = useMemo(() => {
    const list = category ? items.filter((item) => (item.category || "Outros") === category) : [...items].reverse();
    if (sort === "az") return [...list].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    if (sort === "asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "desc") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [items, category, sort]);

  const adjust = () => {
    const factor = 1 + Number(percent.replace(",", ".")) / 100;
    if (!(factor > 0)) return;
    setItems(items.map((item) => ({ ...item, price: Math.max(Math.round(item.price * factor * 100) / 100, 1) })));
    setPercent("");
  };

  return (
    <>
      <div className="lc-stats lc-stats-small">
        <div><b>{items.length}</b><span>presentes</span></div>
        <div><b>{brl(total)}</b><span>total da lista</span></div>
      </div>

      <div className="lc-subcard">
        <label className="lc-field">
          <span>Adicionar lista pronta</span>
          <select value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="">Escolha um modelo</option>
            {EXTRA_GIFT_LISTS.map((list) => <option key={list.label} value={list.label}>{list.label}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="lc-btn lc-btn-ghost lc-btn-sm"
          disabled={!template}
          onClick={() => {
            const list = EXTRA_GIFT_LISTS.find((item) => item.label === template);
            // Ids novos: o mesmo modelo pode ser adicionado de novo sem repetir chave.
            if (list) setItems([...items, ...list.items.map((item) => ({ ...item, id: newId() }))]);
            setTemplate("");
          }}
        >
          Adicionar modelo
        </button>
      </div>

      <div className="lc-row-2">
        <label className="lc-field">
          <span>Categoria</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Todas</option>
            {GIFT_CATEGORIES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label className="lc-field">
          <span>Ordenar</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="recent">Últimos adicionados</option>
            <option value="az">A-Z</option>
            <option value="asc">Menor valor</option>
            <option value="desc">Maior valor</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        className="lc-btn lc-btn-ghost lc-btn-sm lc-add-section"
        onClick={() => {
          const id = newId();
          setItems([...items, { id, title: "", price: 100, emoji: "🎁", category: "Outros" }]);
          setEditing(id);
          setCategory("");
          setSort("recent");
        }}
      >
        <Icon name="plus" size={16} /> Criar presente
      </button>

      <h3 className="lc-panel-h3">Presentes ({visible.length})</h3>
      {visible.map((item, i) => {
        const patch = (change: Partial<GiftItem>) => setItems(items.map((gift) => (gift.id === item.id ? { ...gift, ...change } : gift)));
        return (
          <div key={item.id} className="lc-gift-card">
            <div className="lc-gift-row">
              <input className="lc-gift-emoji" aria-label={`Ícone do presente ${i + 1}`} maxLength={4} value={item.emoji} onChange={(e) => patch({ emoji: e.target.value })} />
              <input aria-label={`Nome do presente ${i + 1}`} placeholder="Nome do presente" maxLength={80} value={item.title} onChange={(e) => patch({ title: e.target.value })} />
              <input aria-label={`Valor do presente ${i + 1} em reais`} type="number" min={1} max={100000} step="any" value={item.price} onChange={(e) => patch({ price: Number(e.target.value) })} />
              <button type="button" className="lc-icon-btn" aria-expanded={editing === item.id} aria-label={`Detalhes de ${item.title}`} onClick={() => setEditing(editing === item.id ? null : item.id)}><Icon name="pencil" size={16} /></button>
              <button type="button" className="lc-icon-btn" aria-label={`Remover ${item.title}`} onClick={() => setItems(items.filter((gift) => gift.id !== item.id))}><Icon name="trash" size={16} /></button>
            </div>
            {editing === item.id && (
              <div className="lc-subcard">
                <label className="lc-field">
                  <span>Categoria</span>
                  <select value={item.category || "Outros"} onChange={(e) => patch({ category: e.target.value })}>
                    {GIFT_CATEGORIES.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>
                <TextArea label="Descrição (opcional)" rows={2} maxLength={200} value={item.description ?? ""} onChange={(e) => patch({ description: e.target.value })} />
                <ImageField label="Foto (substitui o ícone)" value={item.image ?? ""} onChange={(image) => patch({ image })} />
              </div>
            )}
          </div>
        );
      })}

      <h3 className="lc-panel-h3">Ajustar todos os valores</h3>
      <div className="lc-row">
        <input className="lc-input-small" aria-label="Percentual de ajuste" inputMode="decimal" placeholder="Ex.: 10 ou -5" value={percent} onChange={(e) => setPercent(e.target.value)} />
        <span>%</span>
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" disabled={!percent || !items.length} onClick={adjust}>Aplicar</button>
      </div>

      <h3 className="lc-panel-h3">Excluir lista</h3>
      {confirmClear ? (
        <div className="lc-row">
          <span>Apagar os {items.length} presentes?</span>
          <button type="button" className="lc-link-danger" onClick={() => { setItems([]); setConfirmClear(false); }}>Sim, apagar</button>
          <button type="button" className="lc-text-btn" onClick={() => setConfirmClear(false)}>Cancelar</button>
        </div>
      ) : (
        <button type="button" className="lc-link-danger" disabled={!items.length} onClick={() => setConfirmClear(true)}>Excluir todos os presentes</button>
      )}
    </>
  );
}

export function GiftSettingsPanel({ data, update }: PanelProps) {
  return (
    <>
      <h3 className="lc-panel-h3">Visibilidade da lista</h3>
      <Toggle label="Lista publicada no site" checked={data.gifts.visible} onChange={(visible) => update((d) => ({ ...d, gifts: { ...d.gifts, visible } }))} />
      <h3 className="lc-panel-h3">Exibição dos presentes</h3>
      <div className="lc-options">
        {([["asc", "Do menor para o maior valor"], ["desc", "Do maior para o menor valor"], ["az", "Ordem alfabética (A-Z)"]] as const).map(([value, label]) => (
          <label key={value} className={`lc-option${data.gifts.order === value ? " is-on" : ""}`}>
            <input type="radio" name="gift-order" checked={data.gifts.order === value} onChange={() => update((d) => ({ ...d, gifts: { ...d.gifts, order: value } }))} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <TextArea label="Texto sobre a lista" rows={3} maxLength={800} value={data.gifts.about} onChange={(e) => update((d) => ({ ...d, gifts: { ...d.gifts, about: e.target.value } }))} />
      <h3 className="lc-panel-h3">Taxas e pagamento</h3>
      <p className="lc-muted">O LP Casar não cobra taxa: o convidado paga por Pix direto na conta de vocês. Cartão e boleto dependem de contratar um intermediador de pagamento.</p>
    </>
  );
}

export function ExternalListsPanel({ data, update }: PanelProps) {
  const lists = data.gifts.external;
  const setLists = (external: typeof lists) => update((d) => ({ ...d, gifts: { ...d.gifts, external } }));
  return (
    <>
      <p className="lc-muted">Têm lista em outra loja? Coloquem o link para aparecer no site.</p>
      {lists.map((list) => {
        const patch = (change: Partial<typeof list>) => setLists(lists.map((item) => (item.id === list.id ? { ...item, ...change } : item)));
        return (
          <div key={list.id} className="lc-subcard">
            <Field label="Nome da loja" maxLength={60} value={list.name} onChange={(e) => patch({ name: e.target.value })} />
            <Field label="Link" inputMode="url" maxLength={300} value={list.url} onChange={(e) => patch({ url: e.target.value })} />
            <Field label="Endereço físico (opcional)" maxLength={200} value={list.address ?? ""} onChange={(e) => patch({ address: e.target.value })} />
            <button type="button" className="lc-link-danger" onClick={() => setLists(lists.filter((item) => item.id !== list.id))}>Remover</button>
          </div>
        );
      })}
      <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" onClick={() => setLists([...lists, { id: newId(), name: "", url: "" }])}>
        <Icon name="plus" size={16} /> Adicionar lista
      </button>
    </>
  );
}

const STATUS: Record<GiftStatus, string> = { pending: "A conferir", confirmed: "Recebido", rejected: "Não recebido" };
const STATUS_CLASS: Record<GiftStatus, string> = { pending: "", confirmed: "is-yes", rejected: "is-no" };

function thankLink(phone: string, name: string, couple: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length <= 11 ? `55${digits}` : digits;
  const text = `Oi, ${name.split(" ")[0]}! Recebemos seu presente e ficamos muito felizes. Muito obrigado pelo carinho! ${couple}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function GiftsReceivedPanel({ data }: PanelProps) {
  const { rows, setRows, loading, error, setError } = useRows("gifts");
  const couple = `${data.couple.name1} e ${data.couple.name2}`;

  const patch = async (id: string, change: { status?: GiftStatus; thanked?: boolean }) => {
    try {
      await api("/api/casar/records", "PATCH", { kind: "gifts", id, ...change });
      setRows((list) => list.map((row) => (row.id === id ? { ...row, data: { ...row.data, ...change } } : row)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const cards = rows.filter((row) => row.data.message && row.data.status !== "rejected");

  const downloadCards = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a5" });
    cards.forEach((row, i) => {
      if (i) pdf.addPage();
      pdf.setFontSize(11);
      pdf.text(`Para ${couple}`, 15, 25);
      pdf.setFontSize(14);
      pdf.text(pdf.splitTextToSize(row.data.message, 118), 15, 45);
      pdf.setFontSize(11);
      pdf.text(`Com carinho, ${row.data.guestName}`, 15, 170);
    });
    pdf.save("cartoes-de-felicitacoes.pdf");
  };

  return (
    <>
      <p className="lc-muted">O convidado avisa que fez o Pix. Confiram no extrato do banco e marquem como recebido.</p>
      {error && <p className="lc-error" role="alert">{error}</p>}
      <div className="lc-toolbar lc-no-print">
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" disabled={!rows.length} onClick={() => downloadCsv("presentes.csv", [["Convidado", "WhatsApp", "Presente", "Valor", "Situação", "Mensagem", "Data"], ...rows.map((row) => [row.data.guestName, row.data.phone ?? "", row.data.title, row.data.amount.toFixed(2).replace(".", ","), STATUS[row.data.status], row.data.message, shortDate(row.createdAt)])])}>Baixar planilha</button>
        <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" disabled={!cards.length} onClick={() => void downloadCards()}>Baixar cartões em PDF ({cards.length})</button>
      </div>
      {loading ? <p className="lc-empty">Carregando…</p> : !rows.length ? (
        <p className="lc-empty">Quando um convidado presentear, o aviso aparece aqui.</p>
      ) : (
        <div className="lc-table-wrap">
          <table className="lc-table">
            <thead><tr><th>Convidado</th><th>Presente</th><th>Valor</th><th>Mensagem</th><th>Data</th><th>Situação</th><th>Agradecer</th></tr></thead>
            <tbody>
              {[...rows].reverse().map((row) => (
                <tr key={row.id}>
                  <td>{row.data.guestName}</td>
                  <td>{row.data.title}</td>
                  <td>{brl(row.data.amount)}</td>
                  <td>{row.data.message || "—"}</td>
                  <td>{shortDate(row.createdAt)}</td>
                  <td>
                    <span className={`lc-tag ${STATUS_CLASS[row.data.status]}`}>{STATUS[row.data.status]}</span>
                    <div className="lc-row lc-no-print">
                      {row.data.status !== "confirmed" && <button type="button" className="lc-text-btn" onClick={() => void patch(row.id, { status: "confirmed" })}>Recebi</button>}
                      {row.data.status !== "rejected" && <button type="button" className="lc-text-btn" onClick={() => void patch(row.id, { status: "rejected" })}>Não recebi</button>}
                    </div>
                  </td>
                  <td>
                    {row.data.thanked ? <span className="lc-tag is-yes">Agradecido</span> : row.data.phone ? (
                      <a className="lc-text-btn" href={thankLink(row.data.phone, row.data.guestName, couple)} target="_blank" rel="noopener noreferrer" onClick={() => void patch(row.id, { thanked: true })}>Agradecer no WhatsApp</a>
                    ) : (
                      <button type="button" className="lc-text-btn" onClick={() => void patch(row.id, { thanked: true })}>Marcar como agradecido</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const KEY_TYPES: { id: PixKeyType; label: string }[] = [
  { id: "email", label: "E-mail" },
  { id: "phone", label: "Celular" },
  { id: "cpf", label: "CPF" },
  { id: "cnpj", label: "CNPJ" },
  { id: "random", label: "Chave aleatória" },
];

export function WalletPanel({ data, update }: PanelProps) {
  const { rows, loading } = useRows("gifts");
  const [pix, setPix] = useState(data.gifts.pix);
  const [saved, setSaved] = useState(false);
  const keyError = pixKeyError(pix.keyType, pix.key);
  const incomplete = Boolean(pix.key.trim()) && (!pix.holder.trim() || !pix.city.trim());

  const received = rows.filter((row) => row.data.status === "confirmed");
  const pending = rows.filter((row) => row.data.status === "pending");
  const sum = (list: typeof rows) => list.reduce((total, row) => total + row.data.amount, 0);

  // Salva só no botão: chave pela metade não pode virar QR Code para os convidados.
  const save = () => {
    update((d) => ({ ...d, gifts: { ...d.gifts, pix } }));
    setSaved(true);
  };

  return (
    <>
      <div className="lc-stats">
        <div><b>{brl(sum(received))}</b><span>recebido e conferido</span></div>
        <div><b>{brl(sum(pending))}</b><span>a conferir no banco</span></div>
        <div><b>{received.length}</b><span>presentes recebidos</span></div>
      </div>

      <div className="lc-card lc-wallet">
        <h2>Chave Pix para receber os presentes</h2>
        <p className="lc-muted">O convidado paga direto para esta chave, sem taxa do LP Casar e sem esperar repasse. Ela só é usada para gerar o Pix no momento do presente.</p>
        <div className="lc-row-2">
          <label className="lc-field">
            <span>Tipo de chave</span>
            <select value={pix.keyType} onChange={(e) => { setPix({ ...pix, keyType: e.target.value as PixKeyType }); setSaved(false); }}>
              {KEY_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
            </select>
          </label>
          <Field label="Chave" maxLength={120} value={pix.key} onChange={(e) => { setPix({ ...pix, key: e.target.value }); setSaved(false); }} />
          <Field label="Nome de quem recebe" hint="Igual ao cadastrado no banco." maxLength={60} value={pix.holder} onChange={(e) => { setPix({ ...pix, holder: e.target.value }); setSaved(false); }} />
          <Field label="Cidade" maxLength={40} value={pix.city} onChange={(e) => { setPix({ ...pix, city: e.target.value }); setSaved(false); }} />
        </div>
        {keyError && <p className="lc-error" role="alert">{keyError}</p>}
        {incomplete && !keyError && <p className="lc-muted">Preencham também o nome e a cidade.</p>}
        <div className="lc-row">
          <button type="button" className="lc-btn lc-btn-sm" disabled={Boolean(keyError) || incomplete} onClick={save}>Salvar chave Pix</button>
          {saved && <span className="lc-ok" role="status">Chave salva. Façam um Pix de teste de R$ 1 pelo site.</span>}
        </div>
      </div>

      <h2 className="lc-panel-h2">Extrato de presentes</h2>
      {loading ? <p className="lc-empty">Carregando…</p> : !received.length ? (
        <p className="lc-empty">Os presentes marcados como recebidos aparecem aqui.</p>
      ) : (
        <ul className="lc-statement">
          {[...received].reverse().map((row) => (
            <li key={row.id}>
              <div><strong>{row.data.title}</strong><small>{row.data.guestName} · {shortDate(row.createdAt)}</small></div>
              <b>{brl(row.data.amount)}</b>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
