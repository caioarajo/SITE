"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Modal from "@/components/admin/Modal";
import { ToastProvider, useToast } from "@/components/admin/Toast";
import { formatDateTime, generateStrongPassword, roleLabels, validatePasswordComplexity } from "@/lib/utils";
import type { AdminUser, UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["admin", "usuario_avancado", "cliente"];
const PAGE_SIZE = 10;

type CreateForm = { name: string; email: string; password: string; role: UserRole };
type EditForm = { id: string; name: string; role: UserRole; is_active: boolean };

async function parseJsonError(res: Response) {
  try {
    const body = await res.json();
    return body.error as string | undefined;
  } catch {
    return undefined;
  }
}

function UsuariosPageContent() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [page, setPage] = useState(1);

  const [createForm, setCreateForm] = useState<CreateForm | null>(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [forceChange, setForceChange] = useState(true);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetResult, setResetResult] = useState<{ user: AdminUser; password: string } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const body = await res.json();
      setUsers(body.users);
    } else {
      toast.error((await parseJsonError(res)) ?? "Não foi possível carregar os usuários.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (term && !u.name.toLowerCase().includes(term) && !u.email.toLowerCase().includes(term)) return false;
      if (roleFilter !== "todos" && u.role !== roleFilter) return false;
      if (statusFilter !== "todos" && (statusFilter === "ativo") !== u.is_active) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetFiltersPage() {
    setPage(1);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!createForm) return;
    setCreateError(null);

    const passwordError = validatePasswordComplexity(createForm.password);
    if (passwordError) {
      setCreateError(passwordError);
      return;
    }

    setCreateSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    setCreateSaving(false);

    if (!res.ok) {
      setCreateError((await parseJsonError(res)) ?? "Não foi possível criar o usuário.");
      return;
    }

    toast.success(`Usuário ${createForm.name} criado.`);
    setCreateForm(null);
    load();
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    setEditSaving(true);

    const res = await fetch(`/api/admin/users/${editForm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, role: editForm.role, is_active: editForm.is_active }),
    });
    setEditSaving(false);

    if (!res.ok) {
      toast.error((await parseJsonError(res)) ?? "Não foi possível salvar as alterações.");
      return;
    }

    toast.success("Usuário atualizado.");
    setEditForm(null);
    load();
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    setResetSaving(true);

    const res = await fetch(`/api/admin/users/${resetTarget.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forceChange }),
    });
    setResetSaving(false);

    if (!res.ok) {
      toast.error((await parseJsonError(res)) ?? "Não foi possível redefinir a senha.");
      return;
    }

    const body = await res.json();
    setResetResult({ user: resetTarget, password: body.temporaryPassword });
    setResetTarget(null);
    load();
  }

  async function copyPassword(password: string) {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Senha copiada.");
    } catch {
      toast.error("Não foi possível copiar automaticamente — selecione e copie manualmente.");
    }
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Usuários</h1>
          <p>Contas com acesso ao painel administrativo e seus níveis de permissão</p>
        </div>
        <button
          className="admin-btn admin-btn-gold"
          onClick={() => setCreateForm({ name: "", email: "", password: "", role: "usuario_avancado" })}
        >
          + Novo usuário
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-filters-bar">
          <input
            className="field-input"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetFiltersPage();
            }}
          />
          <select
            className="field-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              resetFiltersPage();
            }}
          >
            <option value="todos">Todos os níveis</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </select>
          <select
            className="field-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetFiltersPage();
            }}
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Nível de acesso</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => (
                <tr key={u.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`rbac-badge rbac-role-${u.role}`}>{roleLabels[u.role]}</span>
                  </td>
                  <td>
                    <span className={`rbac-badge ${u.is_active ? "rbac-status-active" : "rbac-status-inactive"}`}>
                      {u.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>{formatDateTime(u.last_sign_in_at)}</td>
                  <td className="row-actions">
                    <button
                      className="admin-btn admin-btn-line admin-btn-sm"
                      onClick={() => setEditForm({ id: u.id, name: u.name, role: u.role, is_active: u.is_active })}
                    >
                      Editar
                    </button>
                    <button
                      className="admin-btn admin-btn-line admin-btn-sm"
                      onClick={() => {
                        setForceChange(true);
                        setResetTarget(u);
                      }}
                    >
                      Redefinir senha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="empty-state">Nenhum usuário encontrado.</div>}
          {loading && <div className="empty-state">Carregando...</div>}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="admin-btn admin-btn-line admin-btn-sm"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              className="admin-btn admin-btn-line admin-btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* Criar usuário */}
      <Modal open={!!createForm} onClose={() => setCreateForm(null)} title="Novo usuário">
        {createForm && (
          <form onSubmit={handleCreate}>
            <div className="field-group">
              <label className="field-label">Nome</label>
              <input
                className="field-input"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">E-mail</label>
              <input
                className="field-input"
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Senha provisória</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="field-input"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-line admin-btn-sm"
                  onClick={() => setCreateForm({ ...createForm, password: generateStrongPassword() })}
                >
                  Gerar
                </button>
              </div>
              <p className="inquiry-note">Mínimo de 8 caracteres, com letras, números e símbolos.</p>
            </div>
            <div className="field-group">
              <label className="field-label">Nível de acesso</label>
              <select
                className="field-select"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
            </div>
            {createError && <div className="login-error">{createError}</div>}
            <div className="modal-actions">
              <button type="button" className="admin-btn admin-btn-line" onClick={() => setCreateForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="admin-btn admin-btn-gold" disabled={createSaving}>
                {createSaving ? "Criando..." : "Criar usuário"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Editar usuário */}
      <Modal open={!!editForm} onClose={() => setEditForm(null)} title="Editar usuário">
        {editForm && (
          <form onSubmit={handleEdit}>
            <div className="field-group">
              <label className="field-label">Nome</label>
              <input
                className="field-input"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Nível de acesso</label>
              <select
                className="field-select"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
            </div>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              />
              Conta ativa
            </label>
            <div className="modal-actions">
              <button type="button" className="admin-btn admin-btn-line" onClick={() => setEditForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="admin-btn admin-btn-gold" disabled={editSaving}>
                {editSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmar redefinição de senha */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Redefinir senha">
        {resetTarget && (
          <div>
            <p className="inquiry-note">
              Uma nova senha temporária será gerada para <strong>{resetTarget.name}</strong> ({resetTarget.email}).
              A senha atual dessa pessoa deixa de funcionar imediatamente.
            </p>
            <label className="toggle-row" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={forceChange} onChange={(e) => setForceChange(e.target.checked)} />
              Forçar troca de senha no próximo login
            </label>
            <div className="modal-actions">
              <button type="button" className="admin-btn admin-btn-line" onClick={() => setResetTarget(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-gold"
                disabled={resetSaving}
                onClick={handleResetPassword}
              >
                {resetSaving ? "Gerando..." : "Redefinir senha"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Resultado da redefinição — senha exibida uma única vez */}
      <Modal open={!!resetResult} onClose={() => setResetResult(null)} title="Senha redefinida">
        {resetResult && (
          <div>
            <p className="inquiry-note">
              Repasse esta senha temporária para <strong>{resetResult.user.name}</strong>. Ela só aparece uma vez —
              depois de fechar esta janela, não será possível vê-la de novo.
            </p>
            <div className="field-group">
              <label className="field-label">Senha temporária</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="field-input" readOnly value={resetResult.password} />
                <button
                  type="button"
                  className="admin-btn admin-btn-line admin-btn-sm"
                  onClick={() => copyPassword(resetResult.password)}
                >
                  Copiar
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="admin-btn admin-btn-gold" onClick={() => setResetResult(null)}>
                Concluído
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function UsuariosPage() {
  return (
    <ToastProvider>
      <UsuariosPageContent />
    </ToastProvider>
  );
}
