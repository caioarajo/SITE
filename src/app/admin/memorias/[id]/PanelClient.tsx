"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AdminPost, AdminState, PostStatus, WallLayout, WallSettings } from "@/lib/memorias/types";
import { useLiveState } from "@/lib/memorias/useLiveState";
import { buildZip, type ZipSource } from "@/lib/memorias/zip";

type Filter = PostStatus | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Pendentes" },
  { key: "approved", label: "No telão" },
  { key: "hidden", label: "Ocultas" },
  { key: "all", label: "Todas" },
];

const LAYOUTS: { key: WallLayout; label: string; text: string }[] = [
  { key: "cinema", label: "Cinema", text: "Uma foto por vez, em destaque" },
  { key: "mosaico", label: "Mosaico", text: "12 fotos que vão sendo trocadas" },
  { key: "polaroid", label: "Polaroid", text: "Fotos caindo em um mural" },
];

const formatTime = (ms: number) => new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const RENDER_STEP = 120;
const formatMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

export default function PanelClient({
  initial,
  scope,
  clients = [],
}: {
  initial: AdminState;
  /** "client": quem contratou, sem prazo, vínculo nem exclusão do evento. */
  scope: "staff" | "client";
  clients?: { id: string; name: string }[];
}) {
  const eventId = initial.eventId;
  const api = `/api/admin/memorias/${eventId}`;
  const router = useRouter();
  const { state, online, refresh } = useLiveState<AdminState>(api, initial, { topic: `memorias-${eventId}`, pollMs: 10_000 });
  const { settings, posts, stats, blockedDevices, guestUrl, wallUrl, eventDate, retentionUntil, clientId } = state;

  const [filter, setFilter] = useState<Filter>("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [zipProgress, setZipProgress] = useState("");
  const [limit, setLimit] = useState(RENDER_STEP);
  const [copied, setCopied] = useState("");

  const call = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = (await res.json()) as { error?: string; deleted?: boolean };
      if (!res.ok) throw new Error(data.error ?? "Falha na ação.");
      if (data.deleted) {
        router.push("/admin/memorias");
        return;
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na ação.");
    } finally {
      setBusy(false);
    }
  };

  const save = (patch: Partial<WallSettings>) => void call("settings", { settings: patch });

  const downloadZip = async () => {
    setError("");
    setZipProgress("Preparando…");
    try {
      const res = await fetch(`${api}/export`);
      const { files, error: failure } = (await res.json()) as { files?: ZipSource[]; error?: string };
      if (!res.ok) throw new Error(failure ?? "Não foi possível preparar o download.");
      if (!files?.length) throw new Error("Ainda não há fotos aprovadas para baixar.");
      const zip = await buildZip(files, (done, total) => setZipProgress(`Baixando ${done} de ${total}…`));
      const url = URL.createObjectURL(zip);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${settings.title || "evento"}.zip`.replace(/[\\/:*?"<>|]+/g, "-");
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar o ZIP.");
    } finally {
      setZipProgress("");
    }
  };

  const visible = useMemo(() => (filter === "all" ? posts : posts.filter((p) => p.status === filter)), [posts, filter]);
  const selectedIds = visible.filter((p) => selected.has(p.id)).map((p) => p.id);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const batch = async (action: string) => {
    await call(action, { ids: selectedIds });
    setSelected(new Set());
  };

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fora de HTTPS o navegador não libera a área de transferência.
      window.prompt("Copie o link:", text);
    }
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <main className="tl-panel">
      <header className="tl-panel-head">
        <div>
          <Link href={scope === "staff" ? "/admin/memorias" : "/lp-memorias/conta"} className="tl-back">{scope === "staff" ? "← Todos os eventos" : "← Meus eventos"}</Link>
          <p className="tl-eyebrow">LP Memórias {online ? "· ao vivo" : "· reconectando"}</p>
          <h1 className="tl-serif">{settings.title}</h1>
        </div>
        <div className="tl-panel-actions">
          <a className="tl-btn" href={wallUrl} target="_blank" rel="noreferrer">Abrir telão</a>
          <button
            type="button"
            className={`tl-btn ${settings.wallPaused ? "tl-btn-primary" : ""}`}
            aria-pressed={settings.wallPaused}
            onClick={() => save({ wallPaused: !settings.wallPaused })}
          >
            {settings.wallPaused ? "Retomar telão" : "Pausar telão"}
          </button>
          <button
            type="button"
            className="tl-btn"
            aria-pressed={!settings.uploadsOpen}
            onClick={() => save({ uploadsOpen: !settings.uploadsOpen })}
          >
            {settings.uploadsOpen ? "Encerrar envios" : "Reabrir envios"}
          </button>
        </div>
      </header>

      {error && <p className="tl-error tl-panel-error" role="alert">{error}</p>}

      <dl className="tl-stats">
        <div><dt>Pendentes</dt><dd>{stats.pending}</dd></div>
        <div><dt>No telão</dt><dd>{stats.approved}</dd></div>
        <div><dt>Ocultas</dt><dd>{stats.hidden}</dd></div>
        <div><dt>Convidados</dt><dd>{stats.guests}</dd></div>
        <div><dt>Curtidas</dt><dd>{stats.hearts}</dd></div>
        <div><dt>Volume</dt><dd>{formatMb(stats.bytes)}</dd></div>
      </dl>

      <div className="tl-panel-grid">
        <section className="tl-card tl-queue-card" aria-label="Moderação">
          <div className="tl-row-between tl-wrap-row">
            <div className="tl-tabs tl-tabs-inline">
              {FILTERS.map((f) => (
                <button key={f.key} type="button" className={filter === f.key ? "is-on" : ""} onClick={() => setFilter(f.key)}>
                  {f.label}
                  {f.key !== "all" && ` (${f.key === "pending" ? stats.pending : f.key === "approved" ? stats.approved : stats.hidden})`}
                </button>
              ))}
            </div>
            {stats.pending > 0 && (
              <button type="button" className="tl-btn tl-btn-primary" disabled={busy} onClick={() => void call("approveAllPending")}>
                Aprovar todas ({stats.pending})
              </button>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="tl-batch">
              <span>{selectedIds.length} selecionada(s)</span>
              <button type="button" className="tl-btn" onClick={() => void batch("approve")}>Aprovar</button>
              <button type="button" className="tl-btn" onClick={() => void batch("hide")}>Ocultar</button>
              <button type="button" className="tl-btn tl-btn-danger" onClick={() => { if (window.confirm(`Excluir ${selectedIds.length} publicação(ões)?`)) void batch("delete"); }}>Excluir</button>
            </div>
          )}

          {visible.length === 0 ? (
            <p className="tl-empty">{filter === "pending" ? "Nada na fila. As novas fotos chegam aqui sozinhas." : "Nada por aqui."}</p>
          ) : (
            <ul className="tl-mod-grid" data-testid="mod-grid">
              {visible.slice(0, limit).map((post) => (
                <ModCard
                  key={post.id}
                  post={post}
                  selected={selected.has(post.id)}
                  deviceBlocked={blockedDevices.includes(post.deviceId)}
                  onToggle={() => toggle(post.id)}
                  call={call}
                />
              ))}
            </ul>
          )}
          {visible.length > limit && (
            <button type="button" className="tl-btn tl-show-more" onClick={() => setLimit((l) => l + RENDER_STEP)}>
              Mostrar mais ({visible.length - limit})
            </button>
          )}
        </section>

        <aside className="tl-panel-side">
          <section className="tl-card">
            <h2 className="tl-serif">QR code dos convidados</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="tl-panel-qr" src={`${api}/qr?v=${encodeURIComponent(guestUrl)}`} alt="QR code do link dos convidados" />
            <p className="tl-url">{guestUrl}</p>
            <div className="tl-row-wrap">
              <button type="button" className="tl-btn" onClick={() => void copy("guest", guestUrl)}>{copied === "guest" ? "Copiado" : "Copiar link"}</button>
              <a className="tl-btn" href={`${api}/qr?format=png&download=1`}>PNG</a>
              <a className="tl-btn" href={`${api}/qr?format=svg&download=1`}>SVG</a>
              <button
                type="button"
                className="tl-btn"
                onClick={() => { if (window.confirm("Trocar o link? O QR code impresso deixa de funcionar.")) void call("rotateGuestToken"); }}
              >
                Trocar link
              </button>
            </div>
          </section>

          <section className="tl-card">
            <h2 className="tl-serif">Telão</h2>
            <div className="tl-layouts" role="radiogroup" aria-label="Layout">
              {LAYOUTS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  role="radio"
                  aria-checked={settings.layout === l.key}
                  className={settings.layout === l.key ? "is-on" : ""}
                  onClick={() => save({ layout: l.key })}
                >
                  <strong>{l.label}</strong>
                  <small>{l.text}</small>
                </button>
              ))}
            </div>
            <label className="tl-field">
              <span>Tempo por foto: {settings.intervalSec}s</span>
              <input type="range" min={3} max={30} defaultValue={settings.intervalSec} onChange={(e) => save({ intervalSec: Number(e.target.value) })} />
            </label>
            <Toggle label="Mostrar nome de quem enviou" checked={settings.showNames} onChange={(showNames) => save({ showNames })} />
            <Toggle label="Mostrar legendas" checked={settings.showCaptions} onChange={(showCaptions) => save({ showCaptions })} />
            <Toggle label="Mostrar QR code no telão" checked={settings.showQr} onChange={(showQr) => save({ showQr })} />
            <label className="tl-field">
              <span>Mensagem durante a pausa</span>
              <TextSetting value={settings.pauseMessage} onSave={(pauseMessage) => save({ pauseMessage })} />
            </label>
          </section>

          <section className="tl-card">
            <h2 className="tl-serif">Evento e moderação</h2>
            <label className="tl-field">
              <span>Nome do evento</span>
              <TextSetting value={settings.title} onSave={(title) => save({ title })} />
            </label>
            <label className="tl-field">
              <span>Frase de boas-vindas</span>
              <TextSetting value={settings.subtitle} onSave={(subtitle) => save({ subtitle })} />
            </label>
            <Toggle
              label="Aprovar cada foto antes de ir ao telão"
              checked={settings.moderation === "manual"}
              onChange={(manual) => save({ moderation: manual ? "manual" : "auto" })}
            />
            <Toggle label="Convidados veem a galeria" checked={settings.guestsSeeGallery} onChange={(guestsSeeGallery) => save({ guestsSeeGallery })} />
            <label className="tl-field">
              <span>Palavras que seguram para revisão (separe por vírgula)</span>
              <TextSetting
                value={settings.blockedWords.join(", ")}
                onSave={(text) => save({ blockedWords: text.split(",").map((w) => w.trim()).filter(Boolean) })}
              />
            </label>
            {blockedDevices.length > 0 && (
              <div className="tl-blocked">
                <p className="tl-hint">{blockedDevices.length} aparelho(s) bloqueado(s)</p>
                {blockedDevices.map((d) => (
                  <button key={d} type="button" className="tl-btn" onClick={() => void call("unblockDevice", { deviceId: d })}>
                    Desbloquear {d.slice(0, 8)}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="tl-card">
            <h2 className="tl-serif">Depois do evento</h2>
            {stats.top.length > 0 && (
              <>
                <p className="tl-hint">Quem mais enviou</p>
                <ol className="tl-top">
                  {stats.top.map((t) => <li key={t.name}><span>{t.name}</span><span>{t.count}</span></li>)}
                </ol>
              </>
            )}
            <div className="tl-row-wrap">
              <button type="button" className="tl-btn" disabled={!!zipProgress} onClick={() => void downloadZip()}>
                {zipProgress || "Baixar aprovadas (ZIP)"}
              </button>
              {scope === "staff" && (
              <button
                type="button"
                className="tl-btn tl-btn-danger"
                onClick={() => {
                  if (window.prompt(`Isto apaga o evento e todas as fotos, sem volta. Digite EXCLUIR para confirmar.`) === "EXCLUIR") void call("deleteEvent");
                }}
              >
                Excluir evento
              </button>
              )}
            </div>
            {scope === "staff" ? (
              <>
                <label className="tl-field">
                  <span>Cliente</span>
                  <select value={clientId ?? ""} onChange={(e) => void call("assignClient", { clientId: e.target.value })}>
                    <option value="">Sem cliente vinculado</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="tl-field">
              <span>Data do evento</span>
              <input type="date" value={eventDate ?? ""} onChange={(e) => void call("dates", { eventDate: e.target.value, retentionUntil })} />
            </label>
            <label className="tl-field">
              <span>Guardar as fotos até</span>
              <input type="date" value={retentionUntil ?? ""} onChange={(e) => void call("dates", { eventDate, retentionUntil: e.target.value })} />
            </label>
              </>
            ) : (
              retentionUntil && <p className="tl-hint tl-form-hint">Fotos guardadas até {retentionUntil.split("-").reverse().join("/")}.</p>
            )}
            {scope === "staff" && retentionUntil && retentionUntil < new Date().toISOString().slice(0, 10) && (
              <p className="tl-error">O prazo de guarda venceu. Baixe as fotos e exclua o evento.</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

function ModCard({
  post,
  selected,
  deviceBlocked,
  onToggle,
  call,
}: {
  post: AdminPost;
  selected: boolean;
  deviceBlocked: boolean;
  onToggle: () => void;
  call: (action: string, extra?: Record<string, unknown>) => Promise<void>;
}) {
  const src = `/api/admin/memorias/media/${post.id}/thumb`;
  return (
    <li className={`tl-mod ${selected ? "is-selected" : ""}`} data-status={post.status}>
      <label className="tl-mod-check">
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label="Selecionar" />
      </label>
      {post.kind === "message" ? (
        <div className="tl-mediabox tl-mediabox-text">{post.caption}</div>
      ) : post.kind === "video" ? (
        <video className="tl-mediabox" src={src} preload="metadata" muted playsInline controls />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="tl-mediabox" src={src} alt={post.caption || "Foto enviada"} loading="lazy" />
      )}
      <div className="tl-mod-info">
        <p className="tl-mod-name">
          {post.guestName || "Sem nome"} <small>{formatTime(post.createdAt)}</small>
        </p>
        {post.kind !== "message" && post.caption && <p className="tl-mod-caption">{post.caption}</p>}
        <p className="tl-mod-tags">
          {post.flagged && <span className="tl-tag tl-tag-warn">Palavra sinalizada</span>}
          {post.pinned && <span className="tl-tag">Fixada</span>}
          {post.hearts > 0 && <span className="tl-tag">♥ {post.hearts}</span>}
          {deviceBlocked && <span className="tl-tag tl-tag-warn">Aparelho bloqueado</span>}
        </p>
      </div>
      <div className="tl-mod-actions">
        {post.status !== "approved" && (
          <button type="button" className="tl-btn tl-btn-primary" onClick={() => void call("approve", { id: post.id })}>Aprovar</button>
        )}
        {post.status !== "hidden" && (
          <button type="button" className="tl-btn" onClick={() => void call("hide", { id: post.id })}>Ocultar</button>
        )}
        <button type="button" className="tl-btn" onClick={() => void call("showNow", { id: post.id })}>Mostrar agora</button>
        <button type="button" className="tl-btn" aria-pressed={post.pinned} onClick={() => void call("pin", { id: post.id })}>
          {post.pinned ? "Desafixar" : "Fixar"}
        </button>
        <button
          type="button"
          className="tl-btn"
          disabled={deviceBlocked}
          onClick={() => { if (window.confirm("Bloquear este aparelho? Tudo o que ele enviou sai do telão e os próximos envios ficam ocultos, sem aviso ao convidado.")) void call("blockDevice", { deviceId: post.deviceId }); }}
        >
          Bloquear
        </button>
        <button type="button" className="tl-btn tl-btn-danger" onClick={() => { if (window.confirm("Excluir esta publicação?")) void call("delete", { id: post.id }); }}>Excluir</button>
      </div>
    </li>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="tl-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/** Campo de texto que só grava ao sair dele, para não mexer no telão a cada tecla. */
function TextSetting({ value, placeholder, onSave }: { value: string; placeholder?: string; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={focused ? draft : value}
      placeholder={placeholder}
      onFocus={() => {
        setDraft(value);
        setFocused(true);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setFocused(false);
        if (draft !== value) onSave(draft);
      }}
    />
  );
}
