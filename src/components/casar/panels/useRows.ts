"use client";

import { useCallback, useEffect, useState } from "react";
import type { RecordKind, Row } from "@/lib/casar/types";
import { api } from "../ui";

/** Carrega uma lista do site (convidados, confirmações, recados ou presentes). */
export function useRows<K extends RecordKind>(kind: K) {
  const [rows, setRows] = useState<Row<K>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const result = await api<{ rows: Row<K>[] }>(`/api/casar/records?kind=${kind}`, "GET");
      setRows(result.rows);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rows, setRows, loading, error, setError, reload };
}

/** Baixa um CSV que abre certo no Excel em português. */
export function downloadCsv(name: string, rows: (string | number)[][]) {
  // Respostas vêm do site público: "=" ou "+" no começo virariam fórmula na planilha.
  const cell = (value: string | number) => {
    const text = String(value);
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const csv = `﻿${rows.map((row) => row.map(cell).join(";")).join("\r\n")}`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
