"use client";

import { motion } from "framer-motion";
import type { EventTableRow, EventSeatRow, GuestRow } from "@/lib/types";

const TABLE_SIZE: Record<string, { w: number; h: number }> = {
  round: { w: 100, h: 100 },
  rectangle: { w: 150, h: 70 },
};

const SEAT_SIZE = 30;

/** Posição de uma cadeira relativa ao canto superior-esquerdo da mesa. */
function getSeatPosition(shape: string, seatIndex: number, seatCount: number) {
  const { w, h } = TABLE_SIZE[shape] ?? TABLE_SIZE.round;

  if (shape === "rectangle") {
    const half = Math.ceil(seatCount / 2);
    const isTop = seatIndex < half;
    const rowCount = isTop ? half : seatCount - half;
    const indexInRow = isTop ? seatIndex : seatIndex - half;
    const spacing = w / (rowCount + 1);
    const x = spacing * (indexInRow + 1) - SEAT_SIZE / 2;
    const y = isTop ? -SEAT_SIZE / 2 - 6 : h - SEAT_SIZE / 2 + 6;
    return { x, y };
  }

  // round: distribui em círculo ao redor da mesa, começando no topo
  const radius = w / 2 + SEAT_SIZE / 2 + 8;
  const angle = (2 * Math.PI * seatIndex) / seatCount - Math.PI / 2;
  const cx = w / 2 + radius * Math.cos(angle) - SEAT_SIZE / 2;
  const cy = h / 2 + radius * Math.sin(angle) - SEAT_SIZE / 2;
  return { x: cx, y: cy };
}

export default function TableMap({
  tables,
  seats,
  guestsById,
  onDragTableEnd,
  onSeatClick,
}: {
  tables: EventTableRow[];
  seats: EventSeatRow[];
  guestsById: Map<string, GuestRow>;
  onDragTableEnd: (tableId: string, x: number, y: number) => void;
  onSeatClick: (seat: EventSeatRow) => void;
}) {
  return (
    <div className="table-map-canvas">
      <div className="table-map-inner">
        {tables.map((table) => {
          const size = TABLE_SIZE[table.shape] ?? TABLE_SIZE.round;
          const tableSeats = seats
            .filter((s) => s.event_table_id === table.id)
            .sort((a, b) => a.seat_number - b.seat_number);

          return (
            <motion.div
              key={`${table.id}-${table.pos_x}-${table.pos_y}`}
              className={`event-table shape-${table.shape}`}
              drag
              dragMomentum={false}
              style={{ left: table.pos_x, top: table.pos_y, width: size.w, height: size.h }}
              onDragEnd={(_, info) => {
                onDragTableEnd(table.id, table.pos_x + info.offset.x, table.pos_y + info.offset.y);
              }}
            >
              <div className="table-shape" style={{ width: size.w, height: size.h }}>
                Mesa {table.label}
              </div>
              {tableSeats.map((seat, i) => {
                const pos = getSeatPosition(table.shape, i, tableSeats.length);
                const guest = seat.guest_id ? guestsById.get(seat.guest_id) : null;
                return (
                  <div
                    key={seat.id}
                    className={`event-seat ${guest ? "occupied" : ""}`}
                    style={{ left: pos.x, top: pos.y }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeatClick(seat);
                    }}
                    title={guest ? guest.name : `Cadeira ${seat.seat_code} — vazia`}
                  >
                    <span className="seat-code">{seat.seat_code}</span>
                    {guest ? guest.name.split(" ")[0].slice(0, 8) : "—"}
                  </div>
                );
              })}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
