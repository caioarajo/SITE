"use client";

import { useState } from "react";

export default function SupplierConfirmButton({ token, alreadyConfirmed }: { token: string; alreadyConfirmed: boolean }) {
  const [confirmed, setConfirmed] = useState(alreadyConfirmed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/convite-fornecedor/${token}/confirmar`, { method: "POST" });
      if (!res.ok) throw new Error("Não foi possível confirmar agora.");
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <div className="status-badge status-confirmado" style={{ fontSize: 14, padding: "10px 18px" }}>
        Presença confirmada
      </div>
    );
  }

  return (
    <div>
      <button className="admin-btn admin-btn-gold" onClick={confirm} disabled={loading}>
        {loading ? "Confirmando..." : "Confirmar Presença"}
      </button>
      {error && <p style={{ color: "#b3311c", fontSize: 13, marginTop: 10 }}>{error}</p>}
    </div>
  );
}
