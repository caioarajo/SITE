"use client";

import { useRef, useState, type ReactNode } from "react";

const ICONS: Record<string, ReactNode> = {
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4V4h11v1" /></>,
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-4 3-6 6.500-6s6 2 6.500 6M16 4.800a3.500 3.500 0 0 1 0 6.400M18 14.500c2 .8 3.200 2.700 3.500 5.500" /></>,
  mail: <><path d="M3 9l9-6 9 6v11H3V9Z" /><path d="m3 9 9 6 9-6" /></>,
  heart: <path d="M12 20.500S3 15 3 8.800A4.800 4.800 0 0 1 12 6.500a4.800 4.800 0 0 1 9 2.300C21 15 12 20.500 12 20.500Z" />,
  card: <><rect x="2.500" y="5" width="19" height="14" rx="2" /><path d="M2.500 10h19" /></>,
  help: <><circle cx="12" cy="12" r="9.500" /><path d="M9.500 9.300a2.600 2.600 0 1 1 3.700 2.400c-.8.400-1.200 1-1.200 1.800M12 17h.01" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M5.300 18.700l2.100-2.100M16.600 7.400l2.100-2.100" /></>,
  down: <path d="m6 9 6 6 6-6" />,
  up: <path d="m6 15 6-6 6 6" />,
  left: <path d="m15 6-6 6 6 6" />,
  right: <path d="m9 6 6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM21 14v.01M21 21h-4v-1M14 21v-.01" /></>,
  gift: <><rect x="3" y="8" width="18" height="4" /><path d="M5 12v9h14v-9M12 8v13M12 8S10 3 7.500 3a2.500 2.500 0 0 0 0 5H12Zm0 0s2-5 4.500-5a2.500 2.500 0 0 1 0 5H12Z" /></>,
  wallet: <><path d="M3 7a2 2 0 0 1 2-2h13v4" /><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="16.500" cy="13.500" r="1" /></>,
  pin: <><path d="M12 21s7-6.200 7-11.500A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21Z" /><circle cx="12" cy="9.500" r="2.500" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />,
  music: <><path d="M9 18V5l11-2v13" /><circle cx="6.500" cy="18" r="2.500" /><circle cx="17.500" cy="16" r="2.500" /></>,
  check: <path d="m5 13 4 4L19 7" />,
  phone: <><rect x="7" y="2.500" width="10" height="19" rx="2" /><path d="M11 18.500h2" /></>,
  list: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  logout: <path d="M10 4H4v16h6M9 12h11M16 8l4 4-4 4" />,
  hanger: <path d="M12 7a2 2 0 1 1 2-2M12 7v2l9 6.500V18H3v-2.500L12 9" />,
  bed: <path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5M7 11.500h.01" />,
};

export function Icon({ name, size = 20 }: { name: keyof typeof ICONS | string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.700" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a className={`lc-logo${light ? " is-light" : ""}`} href="/lp-casar" aria-label="LP Casar">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={light ? "/logo-lp-casar-cream.svg" : "/logo-lp-casar-navy.svg"} alt="" />
    </a>
  );
}

export async function api<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Algo deu errado. Tente de novo.");
  return json;
}

/** Reduz no navegador para caber no limite de corpo da Vercel antes de enviar. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", await shrink(file), "foto.jpg");
      const res = await fetch("/api/casar/upload", { method: "POST", body: form });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!json.url) throw new Error(json.error ?? "Não foi possível enviar a foto.");
      onChange(json.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="lc-field">
      <span>{label}</span>
      <div className="lc-image-field">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" /> : <div className="lc-image-empty"><Icon name="plus" /></div>}
        <div className="lc-row">
          <button type="button" className="lc-btn lc-btn-ghost lc-btn-sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? "Enviando…" : value ? "Trocar foto" : "Enviar foto"}
          </button>
          {value && <button type="button" className="lc-link-danger" onClick={() => onChange("")}>Remover</button>}
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void upload(e.target.files?.[0])} />
      </div>
      {error && <p className="lc-error" role="alert">{error}</p>}
    </div>
  );
}

export function Field({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="lc-field">
      <span>{label}</span>
      <input {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function TextArea({ label, hint, ...props }: { label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="lc-field">
      <span>{label}</span>
      <textarea rows={4} {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="lc-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}
