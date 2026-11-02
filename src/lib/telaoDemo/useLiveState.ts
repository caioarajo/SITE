"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Estado ao vivo: o stream avisa que algo mudou e o cliente busca de novo.
 * A consulta a cada 15s cobre o caso de o stream cair em rede ruim. */
export function useLiveState<T>(stateUrl: string, streamUrl: string, initial: T) {
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
    const source = new EventSource(streamUrl);
    source.onopen = () => {
      setOnline(true);
      void refresh();
    };
    source.onerror = () => setOnline(false);
    source.onmessage = () => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => void refresh(), 150);
    };
    const poll = setInterval(() => void refresh(), 15_000);
    return () => {
      source.close();
      clearInterval(poll);
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [streamUrl, refresh]);

  return { state, online, refresh };
}
