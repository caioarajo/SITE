"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { EventRow, EventTableRow, EventSeatRow, GuestRow, TableShape } from "@/lib/types";
import Modal from "@/components/admin/Modal";
import TableMap from "@/components/admin/TableMap";
import { ToastProvider, useToast } from "@/components/admin/Toast";

const emptyTableForm = { label: "", seat_count: 8, shape: "round" as TableShape };

function MapaMesasPageContent() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const supabase = createClient();
  const toast = useToast();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [tables, setTables] = useState<EventTableRow[]>([]);
  const [seats, setSeats] = useState<EventSeatRow[]>([]);
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [tableForm, setTableForm] = useState<typeof emptyTableForm | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [savingTable, setSavingTable] = useState(false);

  const [seatModal, setSeatModal] = useState<EventSeatRow | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [seatGuestChoice, setSeatGuestChoice] = useState("");

  async function load() {
    setLoading(true);
    const [eventRes, tablesRes, seatsRes, linksRes] = await Promise.all([
      supabase.from("events").select("*").eq("id", eventId).single(),
      supabase.from("event_tables").select("*").eq("event_id", eventId),
      supabase.from("event_seats").select("*").eq("event_id", eventId),
      supabase.from("event_guest_lists").select("guest_list_id").eq("event_id", eventId),
    ]);
    setEvent((eventRes.data as EventRow) ?? null);
    setTables((tablesRes.data as EventTableRow[]) ?? []);
    setSeats((seatsRes.data as EventSeatRow[]) ?? []);

    const listIds = (linksRes.data ?? []).map((r) => r.guest_list_id as string);
    if (listIds.length > 0) {
      const { data: guestsData } = await supabase.from("guests").select("*").in("guest_list_id", listIds);
      setGuests((guestsData as GuestRow[]) ?? []);
    } else {
      setGuests([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (eventId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const guestsById = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);
  const seatedGuestIds = useMemo(() => new Set(seats.filter((s) => s.guest_id).map((s) => s.guest_id!)), [seats]);
  const standingGuests = useMemo(() => guests.filter((g) => !seatedGuestIds.has(g.id)), [guests, seatedGuestIds]);
  const unassignedGuests = useMemo(
    () => guests.filter((g) => !seatedGuestIds.has(g.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [guests, seatedGuestIds]
  );
  const totalSeats = seats.length;
  const occupiedSeats = seatedGuestIds.size;
  const freeSeats = totalSeats - occupiedSeats;

  function openCreateTable() {
    setEditingTableId(null);
    setTableForm(emptyTableForm);
  }

  function openEditTable(table: EventTableRow) {
    setEditingTableId(table.id);
    setTableForm({ label: table.label, seat_count: table.seat_count, shape: table.shape });
  }

  async function saveTable(e: FormEvent) {
    e.preventDefault();
    if (!tableForm) return;
    setSavingTable(true);

    if (editingTableId) {
      const { error } = await supabase
        .from("event_tables")
        .update({ label: tableForm.label, seat_count: tableForm.seat_count, shape: tableForm.shape })
        .eq("id", editingTableId);
      if (error) {
        setSavingTable(false);
        toast.error(error.message);
        return;
      }

      // Sincroniza as cadeiras com o novo seat_count.
      const { data: currentSeats } = await supabase
        .from("event_seats")
        .select("*")
        .eq("event_table_id", editingTableId)
        .order("seat_number", { ascending: true });
      const current = (currentSeats as EventSeatRow[]) ?? [];

      if (tableForm.seat_count > current.length) {
        const toAdd = Array.from({ length: tableForm.seat_count - current.length }).map((_, i) => {
          const seatNumber = current.length + i + 1;
          return {
            event_id: eventId,
            event_table_id: editingTableId,
            seat_number: seatNumber,
            seat_code: `${seatNumber}${tableForm.label}`,
          };
        });
        await supabase.from("event_seats").insert(toAdd);
      } else if (tableForm.seat_count < current.length) {
        const toRemove = current.slice(tableForm.seat_count);
        await supabase
          .from("event_seats")
          .delete()
          .in("id", toRemove.map((s) => s.id));
      }
      // Garante que o seat_code reflete o label atual (caso tenha sido renomeada).
      const { data: refreshed } = await supabase
        .from("event_seats")
        .select("*")
        .eq("event_table_id", editingTableId)
        .order("seat_number", { ascending: true });
      for (const s of (refreshed as EventSeatRow[]) ?? []) {
        const expectedCode = `${s.seat_number}${tableForm.label}`;
        if (s.seat_code !== expectedCode) {
          await supabase.from("event_seats").update({ seat_code: expectedCode }).eq("id", s.id);
        }
      }
    } else {
      const { data: newTable, error } = await supabase
        .from("event_tables")
        .insert({
          event_id: eventId,
          label: tableForm.label,
          seat_count: tableForm.seat_count,
          shape: tableForm.shape,
          pos_x: 40 + tables.length * 40,
          pos_y: 40 + tables.length * 30,
        })
        .select("id")
        .single();
      if (error || !newTable) {
        setSavingTable(false);
        toast.error(error?.message ?? "Não foi possível criar a mesa.");
        return;
      }
      const seatsToCreate = Array.from({ length: tableForm.seat_count }).map((_, i) => ({
        event_id: eventId,
        event_table_id: newTable.id,
        seat_number: i + 1,
        seat_code: `${i + 1}${tableForm.label}`,
      }));
      await supabase.from("event_seats").insert(seatsToCreate);
    }

    setSavingTable(false);
    toast.success(editingTableId ? "Mesa atualizada." : "Mesa criada.");
    setTableForm(null);
    setEditingTableId(null);
    load();
  }

  async function removeTable(tableId: string) {
    if (!confirm("Apagar esta mesa e todas as suas cadeiras?")) return;
    const { error } = await supabase.from("event_tables").delete().eq("id", tableId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mesa removida.");
    load();
  }

  async function handleDragTableEnd(tableId: string, x: number, y: number) {
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, pos_x: x, pos_y: y } : t)));
    await supabase.from("event_tables").update({ pos_x: x, pos_y: y }).eq("id", tableId);
  }

  function openSeatModal(seat: EventSeatRow) {
    setSeatModal(seat);
    setSeatGuestChoice("");
  }

  async function assignGuestToSeat() {
    if (!seatModal || !seatGuestChoice) return;
    const { error } = await supabase.from("event_seats").update({ guest_id: seatGuestChoice }).eq("id", seatModal.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Convidado alocado.");
    setSeatModal(null);
    load();
  }

  async function clearSeat() {
    if (!seatModal) return;
    const { error } = await supabase.from("event_seats").update({ guest_id: null }).eq("id", seatModal.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cadeira liberada.");
    setSeatModal(null);
    load();
  }

  const seatModalGuest = seatModal?.guest_id ? guestsById.get(seatModal.guest_id) : null;

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Mapa de Mesas — {event?.title ?? "Carregando..."}</h1>
          <p>Monte as mesas, gere as cadeiras e posicione os convidados</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin/eventos" className="admin-btn admin-btn-line">
            Voltar aos eventos
          </Link>
          <button
            className="admin-btn admin-btn-line"
            onClick={() => setOverviewOpen(true)}
            disabled={tables.length === 0}
          >
            Ver Mapa Completo
          </button>
          <button className="admin-btn admin-btn-gold" onClick={openCreateTable}>
            + Nova mesa
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="label">Convidados do evento</div>
          <div className="value">{guests.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Sentados</div>
          <div className="value">{occupiedSeats}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Cadeiras livres</div>
          <div className="value">{freeSeats}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Em pé</div>
          <div className="value">{standingGuests.length}</div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="table-map-toolbar">
          <h2 style={{ margin: 0 }}>Mesas cadastradas</h2>
          <div className="table-map-legend">
            <span>
              <span className="dot" style={{ background: "var(--gold)" }} />
              Ocupada
            </span>
            <span>
              <span className="dot" style={{ background: "var(--cream)", border: "2px solid var(--taupe)" }} />
              Vazia
            </span>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Formato</th>
                <th>Cadeiras</th>
                <th>Ocupação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => {
                const tableSeats = seats.filter((s) => s.event_table_id === t.id);
                const occupied = tableSeats.filter((s) => s.guest_id).length;
                return (
                  <tr key={t.id}>
                    <td>Mesa {t.label}</td>
                    <td>{t.shape === "round" ? "Redonda" : "Retangular"}</td>
                    <td>{t.seat_count}</td>
                    <td>
                      {occupied}/{tableSeats.length}
                    </td>
                    <td className="row-actions">
                      <button className="admin-btn admin-btn-line admin-btn-sm" onClick={() => openEditTable(t)}>
                        Editar
                      </button>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => removeTable(t.id)}>
                        Apagar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && tables.length === 0 && (
            <div className="empty-state">Nenhuma mesa cadastrada ainda — crie a primeira acima.</div>
          )}
        </div>
      </div>

      {!loading && tables.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Mapa visual</h2>
          <p style={{ fontSize: 12.5, color: "var(--taupe-deep)", marginTop: -8, marginBottom: 14 }}>
            Arraste as mesas para organizar o salão. Clique em uma cadeira para alocar ou remover um convidado.
          </p>
          <TableMap
            tables={tables}
            seats={seats}
            guestsById={guestsById}
            onDragTableEnd={handleDragTableEnd}
            onSeatClick={openSeatModal}
          />
        </div>
      )}

      <div className="admin-card">
        <h2 style={{ marginBottom: 16 }}>Convidados em pé ({standingGuests.length})</h2>
        <p style={{ fontSize: 12.5, color: "var(--taupe-deep)", marginTop: -8, marginBottom: 14 }}>
          Convidados do evento que ainda não têm cadeira — ficam em pé (eventos mistos aceitam os dois formatos).
        </p>
        <div className="standing-panel">
          {standingGuests.map((g) => (
            <span className="standing-chip" key={g.id}>
              {g.name}
            </span>
          ))}
          {standingGuests.length === 0 && (
            <div className="empty-state" style={{ padding: "12px 8px" }}>
              {guests.length === 0 ? "Vincule uma lista de convidados a este evento primeiro." : "Todos os convidados já têm cadeira."}
            </div>
          )}
        </div>
      </div>

      {/* Modal de criar/editar mesa */}
      <Modal
        open={!!tableForm}
        onClose={() => setTableForm(null)}
        title={editingTableId ? "Editar mesa" : "Nova mesa"}
      >
        {tableForm && (
          <form onSubmit={saveTable}>
            <div className="field-group">
              <label className="field-label">Identificação da mesa</label>
              <input
                className="field-input"
                required
                placeholder="Ex.: A, B, VIP-1..."
                value={tableForm.label}
                onChange={(e) => setTableForm({ ...tableForm, label: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Quantidade de cadeiras</label>
                <input
                  className="field-input"
                  type="number"
                  min={1}
                  max={40}
                  required
                  value={tableForm.seat_count}
                  onChange={(e) => setTableForm({ ...tableForm, seat_count: Number(e.target.value) })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Formato</label>
                <select
                  className="field-select"
                  value={tableForm.shape}
                  onChange={(e) => setTableForm({ ...tableForm, shape: e.target.value as TableShape })}
                >
                  <option value="round">Redonda</option>
                  <option value="rectangle">Retangular</option>
                </select>
              </div>
            </div>
            {tableForm.label && (
              <p style={{ fontSize: 12, color: "var(--taupe-deep)" }}>
                Cadeiras geradas: 1{tableForm.label}, 2{tableForm.label} ... {tableForm.seat_count}
                {tableForm.label}
              </p>
            )}

            <div className="modal-actions">
              <button type="button" className="admin-btn admin-btn-line" onClick={() => setTableForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="admin-btn admin-btn-gold" disabled={savingTable}>
                {savingTable ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de alocar/remover convidado da cadeira */}
      <Modal
        open={!!seatModal}
        onClose={() => setSeatModal(null)}
        title={seatModal ? `Cadeira ${seatModal.seat_code}` : ""}
      >
        {seatModal && (
          <div>
            {seatModalGuest ? (
              <>
                <p style={{ marginBottom: 20 }}>
                  Ocupada por <strong>{seatModalGuest.name}</strong>.
                </p>
                <div className="modal-actions">
                  <button className="admin-btn admin-btn-line" onClick={() => setSeatModal(null)}>
                    Fechar
                  </button>
                  <button className="admin-btn admin-btn-danger" onClick={clearSeat}>
                    Remover desta cadeira
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="field-group">
                  <label className="field-label">Convidado</label>
                  <select
                    className="field-select"
                    value={seatGuestChoice}
                    onChange={(e) => setSeatGuestChoice(e.target.value)}
                  >
                    <option value="">Selecione um convidado sem cadeira</option>
                    {unassignedGuests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  {unassignedGuests.length === 0 && (
                    <p style={{ fontSize: 12, color: "var(--taupe-deep)", marginTop: 8 }}>
                      Todos os convidados já têm cadeira.
                    </p>
                  )}
                </div>
                <div className="modal-actions">
                  <button type="button" className="admin-btn admin-btn-line" onClick={() => setSeatModal(null)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-gold"
                    disabled={!seatGuestChoice}
                    onClick={assignGuestToSeat}
                  >
                    Alocar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Mapa completo — visão geral somente leitura, vermelho = ocupada/lotada, verde = disponível */}
      <Modal
        open={overviewOpen}
        onClose={() => setOverviewOpen(false)}
        title="Mapa Completo do Salão"
        className="modal-lg"
      >
        <div className="table-map-toolbar">
          <div className="table-map-legend">
            <span>
              <span className="dot" style={{ background: "#c0392b" }} />
              Ocupada / lotada ({occupiedSeats})
            </span>
            <span>
              <span className="dot" style={{ background: "#2e8b57" }} />
              Disponível ({freeSeats})
            </span>
          </div>
        </div>
        <TableMap tables={tables} seats={seats} guestsById={guestsById} variant="overview" />
        <div className="modal-actions">
          <button type="button" className="admin-btn admin-btn-line" onClick={() => setOverviewOpen(false)}>
            Fechar
          </button>
        </div>
      </Modal>
    </>
  );
}

export default function MapaMesasPage() {
  return (
    <ToastProvider>
      <MapaMesasPageContent />
    </ToastProvider>
  );
}
