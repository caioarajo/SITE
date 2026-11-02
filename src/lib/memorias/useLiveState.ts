"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Estado ao vivo. Com `topic`, o Realtime avisa que algo mudou e o cliente busca de novo.
 * Sem `topic` (convidados), só consulta de tempos em tempos: um casamento pode ter centenas
 * de celulares abertos, e cada conexão de Realtime conta no limite do plano do Supabase.
 * A consulta periódica também cobre uma queda do canal em rede ruim. */
export function useLiveState<T>(stateUrl: string, initial: T, options: { topic?: string; pollMs: number }) {
  const { topic, pollMs } = options;
  const [state, setState] = useState<T>(initial);
  const [online, setOnline] = useState(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(stateUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setState((await res.json()) as T);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, [stateUrl]);

  useEffect(() => {
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, pollMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    void refresh();

    const supabase = topic ? createClient() : null;
    const channel = topic
      ? supabase!
          .channel(topic)
          .on("broadcast", { event: "changed" }, () => {
            if (debounce.current) clearTimeout(debounce.current);
            debounce.current = setTimeout(() => void refresh(), 150);
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") void refresh();
          })
      : null;

    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      if (debounce.current) clearTimeout(debounce.current);
      if (channel) void supabase!.removeChannel(channel);
    };
  }, [topic, pollMs, refresh]);

  return { state, online, refresh };
}
