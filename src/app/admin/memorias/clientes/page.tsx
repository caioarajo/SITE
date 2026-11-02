"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { ClientSummary } from "@/lib/memorias/types";
import MemoriasNav from "../MemoriasNav";
import "@/app/lp-memorias/memorias-app.css";

interface Issued {
  name: string;
  email: string;
  password: string;
}

const EMPTY = { name: "", email: "", phone: "", notes: "" };

export default function MemoriasClientesPage() {
  const [clients, setClients] = useState<ClientSummary[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", phone: "", notes: "" });
  const [issued, setIssued] = useState<Issued | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/memorias/clients", { cache: "no-store" });
    const data = (await res.json()) as { clients?: ClientSummary[]; error?: string };
    if (!res.ok) {
      setClients([]);
      setError(data.error ?? "Não foi possível carregar os clientes.");
      return;
    }
    setClients(data.clients ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setIssued(null);
    const res = await fetch("/api/admin/memorias/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as { email?: string; password?: string; error?: string };
    setBusy(false);
    if (!res.ok || !data.password) {
      setError(data.error ?? "Não foi possível criar o cliente.");
      return;
    }
    setIssued({ name: form.name.trim(), email: data.email ?? form.email, password: data.password });
    setForm(EMPTY);
    await load();
  };

  const act = async (client: ClientSummary, action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/memorias/clients/${client.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = (await res.json()) as { password?: string; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Falha na ação.");
      return false;
    }
    if (data.password) setIssued({ name: client.name, email: client.email, password: data.password });
    await load();
    return true;
  };

  const startEdit = (client: ClientSummary) => {
    setEditing(client.id);
    setDraft({ name: client.name, phone: client.phone, notes: client.notes });
  };

  const accessText = (item: Issued) =>
    `Acesso à LP Memórias\nEndereço: ${window.location.origin}/lp-memorias/entrar\nE-mail: ${item.email}\nSenha provisória: ${item.password}\nNo primeiro acesso, será pedida uma nova senha.`;

  const copy = async (item: Issued) => {
    try {
      await navigator.clipboard.writeText(accessText(item));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie os dados de acesso:", accessText(item));
    }
  };

  return (
    <div className="tl-root tl-panel">
      <p className="tl-eyebrow">LP Memórias</p>
      <h1 className="tl-serif tl-list-title">Clientes</h1>
      <MemoriasNav />
      <p className="tl-hint tl-clients-intro">
        Contas de quem contratou o serviço. São separadas dos usuários do site: não entram no painel da LP e cada cliente vê só os próprios eventos.
      </p>
      {error && <p className="tl-error tl-panel-error" role="alert">{error}</p>}

      {issued && (
        <section className="tl-card tl-issued" role="status" data-testid="issued">
          <h2 className="tl-serif">Dados de acesso de {issued.name}</h2>
          <p className="tl-hint">Esta senha aparece só agora. Envie ao cliente; no primeiro acesso, será pedida uma nova.</p>
          <dl>
            <div><dt>E-mail</dt><dd>{issued.email}</dd></div>
            <div><dt>Senha provisória</dt><dd data-testid="issued-password">{issued.password}</dd></div>
          </dl>
          <div className="tl-row-wrap">
            <button type="button" className="tl-btn tl-btn-primary" onClick={() => void copy(issued)}>{copied ? "Copiado" : "Copiar dados de acesso"}</button>
            <button type="button" className="tl-btn" onClick={() => setIssued(null)}>Fechar</button>
          </div>
        </section>
      )}

      <div className="tl-panel-grid">
        <div className="tl-card">
          {clients === null ? (
            <p className="tl-empty">Carregando…</p>
          ) : clients.length === 0 ? (
            <p className="tl-empty">Nenhum cliente ainda. Crie o primeiro ao lado.</p>
          ) : (
            <ul className="tl-client-list" data-testid="client-list">
              {clients.map((client) => (
                <li key={client.id}>
                  {editing === client.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void act(client, "update", draft).then((ok) => {
                          if (ok) setEditing(null);
                        });
                      }}
                    >
                      <label className="tl-field"><span>Nome</span><input required maxLength={120} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
                      <label className="tl-field"><span>Telefone</span><input maxLength={40} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
                      <label className="tl-field"><span>Observações</span><textarea rows={2} maxLength={1000} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
                      <div className="tl-row-wrap">
                        <button type="submit" className="tl-btn tl-btn-primary" disabled={busy}>Salvar</button>
                        <button type="button" className="tl-btn" onClick={() => setEditing(null)}>Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="tl-client-name">
                        <strong>{client.name}</strong>
                        {!client.isActive && <span className="tl-tag tl-tag-warn">Desativado</span>}
                        {client.isActive && client.mustChangePassword && <span className="tl-tag">Aguardando 1º acesso</span>}
                      </p>
                      <p className="tl-client-meta">{[client.email, client.phone].filter(Boolean).join(" · ")}</p>
                      {client.notes && <p className="tl-client-meta">{client.notes}</p>}
                      <p className="tl-client-meta">
                        {client.events.length === 0 ? "Sem evento vinculado" : "Eventos: "}
                        {client.events.map((event, i) => (
                          <span key={event.id}>
                            {i > 0 && ", "}
                            <Link href={`/admin/memorias/${event.id}`}>{event.title}</Link>
                          </span>
                        ))}
                      </p>
                      <div className="tl-row-wrap">
                        <button type="button" className="tl-btn" onClick={() => startEdit(client)}>Editar</button>
                        <button
                          type="button"
                          className="tl-btn"
                          disabled={busy}
                          onClick={() => { if (window.confirm(`Gerar uma nova senha provisória para ${client.name}? A senha atual deixa de funcionar.`)) void act(client, "resetPassword"); }}
                        >
                          Redefinir senha
                        </button>
                        <button
                          type="button"
                          className="tl-btn"
                          disabled={busy}
                          onClick={() => {
                            if (!client.isActive || window.confirm(`Desativar o acesso de ${client.name}? O evento e as fotos continuam guardados.`)) void act(client, "setActive", { isActive: !client.isActive });
                          }}
                        >
                          {client.isActive ? "Desativar" : "Reativar"}
                        </button>
                        <button
                          type="button"
                          className="tl-btn tl-btn-danger"
                          disabled={busy}
                          onClick={() => {
                            if (window.prompt(`Isto exclui a conta de ${client.name}, sem volta. Os eventos e as fotos continuam com a equipe. Digite EXCLUIR para confirmar.`) === "EXCLUIR") void act(client, "delete");
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="tl-card" onSubmit={(e) => void create(e)}>
          <h2 className="tl-serif">Novo cliente</h2>
          <label className="tl-field"><span>Nome</span><input required maxLength={120} value={form.name} placeholder="Ana e Pedro" onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="tl-field"><span>E-mail de acesso</span><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="tl-field"><span>Telefone (opcional)</span><input maxLength={40} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="tl-field"><span>Observações (opcional)</span><textarea rows={2} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <p className="tl-hint tl-form-hint">Uma senha provisória é gerada ao criar. Depois, vincule o cliente ao evento.</p>
          <div className="tl-row-wrap">
            <button type="submit" className="tl-btn tl-btn-primary" disabled={busy}>{busy ? "Criando…" : "Criar cliente"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
