"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isHeicSignature } from "@/lib/heic";
import type { GuestState, Post } from "@/lib/telaoDemo/types";
import { useLiveState } from "@/lib/telaoDemo/useLiveState";

const MAX_EDGE = 2048;
const CONCURRENCY = 2;
const MAX_AUTO_RETRIES = 3;
const MAX_CAPTION = 140;
const MAX_MESSAGE = 280;

type ItemStatus = "waiting" | "uploading" | "error";

interface QueueItem {
  id: string;
  file: File;
  name: string;
  preview: string | null;
  caption: string;
  progress: number;
  status: ItemStatus;
  attempts: number;
  error: string;
}

/** crypto.randomUUID não existe fora de HTTPS, e o teste no celular é por IP em HTTP. */
function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Navegação privada: segue sem lembrar.
  }
}

function getDeviceId() {
  if (typeof window === "undefined") return "";
  const saved = readStorage("telao-device");
  if (saved) return saved;
  const id = randomId();
  writeStorage("telao-device", id);
  return id;
}

/** Reduz a foto para até 2048 px no aparelho, o que acelera muito o envio em rede de festa.
 * HEIC, vídeo ou qualquer falha: envia o arquivo original e o servidor resolve. */
async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (isHeicSignature(new Uint8Array(await file.slice(0, 12).arrayBuffer()))) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

function send(form: FormData, onProgress: (pct: number) => void) {
  return new Promise<{ status: number; error?: string }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/prototipo-telao/upload");
    xhr.timeout = 180_000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let error: string | undefined;
      try {
        error = (JSON.parse(xhr.responseText) as { error?: string }).error;
      } catch {
        // resposta sem JSON
      }
      resolve({ status: xhr.status, error });
    };
    xhr.onerror = () => resolve({ status: 0, error: "Sem conexão." });
    xhr.ontimeout = () => resolve({ status: 0, error: "A rede está lenta." });
    xhr.send(form);
  });
}

const STATUS_LABEL: Record<Post["status"], string> = {
  pending: "Aguardando aprovação",
  approved: "Publicada",
  hidden: "Não publicada",
};

export default function GuestClient({ token, initial }: { token: string; initial: GuestState }) {
  const [deviceId] = useState(getDeviceId);
  const { state, online, refresh } = useLiveState<GuestState>(
    `/api/prototipo-telao/state?t=${token}&d=${deviceId}`,
    `/api/prototipo-telao/stream?t=${token}`,
    initial,
  );
  const { settings, gallery, mine, heartedIds } = state;

  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState(false);
  const [entered, setEntered] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [caption, setCaption] = useState("");
  const [tab, setTab] = useState<"enviar" | "minhas" | "galeria">("enviar");
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const honeypot = useRef<HTMLInputElement>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGuestName(readStorage("telao-name") ?? "");
    setEntered(readStorage("telao-consent") === "true");
    setReady(true);
  }, []);

  const flash = (text: string) => {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 4500);
  };

  const enter = () => {
    writeStorage("telao-consent", "true");
    writeStorage("telao-name", guestName.trim());
    setEntered(true);
  };

  const baseForm = useCallback(() => {
    const form = new FormData();
    form.set("token", token);
    form.set("deviceId", deviceId);
    form.set("guestName", guestName.trim());
    form.set("consent", "true");
    form.set("website", honeypot.current?.value ?? "");
    return form;
  }, [token, deviceId, guestName]);

  const patch = (id: string, changes: Partial<QueueItem>) =>
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...changes } : q)));

  // Fila de envio: até 2 ao mesmo tempo, com novas tentativas automáticas.
  const running = useRef(new Set<string>());
  const upload = useCallback(
    async (item: QueueItem) => {
      running.current.add(item.id);
      patch(item.id, { status: "uploading", progress: 0, error: "" });
      const blob = await compress(item.file);
      const form = baseForm();
      form.set("caption", item.caption);
      form.set("file", blob, item.name);
      const { status, error } = await send(form, (progress) => patch(item.id, { progress }));
      running.current.delete(item.id);

      if (status >= 200 && status < 300) {
        setQueue((prev) => {
          const done = prev.find((q) => q.id === item.id);
          if (done?.preview) URL.revokeObjectURL(done.preview);
          return prev.filter((q) => q.id !== item.id);
        });
        void refresh();
        return;
      }
      // Erro definitivo (formato, tamanho, link) não adianta repetir.
      const transient = status === 0 || status === 429 || status >= 500;
      if (transient && item.attempts + 1 < MAX_AUTO_RETRIES) {
        const delay = status === 429 ? 20_000 : 2000 * 2 ** item.attempts;
        patch(item.id, { status: "error", attempts: item.attempts + 1, error: `${error ?? "Falhou."} Tentando de novo…` });
        setTimeout(() => patch(item.id, { status: "waiting" }), delay);
        return;
      }
      patch(item.id, { status: "error", attempts: MAX_AUTO_RETRIES, error: error ?? "Não foi possível enviar." });
    },
    [baseForm, refresh],
  );

  useEffect(() => {
    const free = CONCURRENCY - running.current.size;
    if (free <= 0) return;
    queue
      .filter((q) => q.status === "waiting" && !running.current.has(q.id))
      .slice(0, free)
      .forEach((q) => void upload(q));
  }, [queue, upload]);

  // A conexão voltou: reenvia o que falhou sem o convidado precisar tocar em nada.
  useEffect(() => {
    const onOnline = () =>
      setQueue((prev) => prev.map((q) => (q.status === "error" && q.attempts >= MAX_AUTO_RETRIES ? { ...q, status: "waiting", attempts: 0, error: "" } : q)));
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    writeStorage("telao-name", guestName.trim());
    const items: QueueItem[] = Array.from(files).map((file) => ({
      id: randomId(),
      file,
      name: file.name,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      caption: caption.trim(),
      progress: 0,
      status: "waiting",
      attempts: 0,
      error: "",
    }));
    setQueue((prev) => [...prev, ...items]);
    setCaption("");
  };

  const removeItem = (item: QueueItem) => {
    if (item.preview) URL.revokeObjectURL(item.preview);
    setQueue((prev) => prev.filter((q) => q.id !== item.id));
  };

  const sendMessage = async () => {
    const text = message.trim();
    if (!text) return;
    const form = baseForm();
    form.set("caption", text);
    const { status, error } = await send(form, () => {});
    if (status >= 200 && status < 300) {
      setMessage("");
      setMessageOpen(false);
      flash(settings.moderation === "manual" ? "Recado enviado! Ele aparece depois da aprovação." : "Recado enviado!");
      void refresh();
    } else {
      flash(error ?? "Não foi possível enviar o recado.");
    }
  };

  const act = async (action: "heart" | "delete", postId: string) => {
    await fetch("/api/prototipo-telao/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, deviceId, action, postId }),
    });
    void refresh();
  };

  const mediaUrl = (id: string, variant: "thumb" | "display") =>
    `/api/prototipo-telao/media/${id}/${variant}?t=${token}&d=${deviceId}`;

  if (!ready) return <main className="tl-guest" />;

  if (!entered) {
    return (
      <main className="tl-guest tl-guest-welcome">
        <p className="tl-eyebrow">Fotos do evento</p>
        <h1 className="tl-serif">{settings.title}</h1>
        <p className="tl-guest-sub">{settings.subtitle}</p>
        <label className="tl-field">
          <span>Seu nome (opcional)</span>
          <input
            value={guestName}
            maxLength={60}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Como quer aparecer no telão"
            autoComplete="name"
          />
        </label>
        <label className="tl-check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            Entendo que minhas fotos podem aparecer no telão do evento e na galeria dos noivos, e que só devo enviar imagens
            de pessoas que concordam com isso. Posso apagar o que enviei a qualquer momento, em &quot;Minhas&quot;.
          </span>
        </label>
        <button type="button" className="tl-btn tl-btn-primary tl-btn-wide" disabled={!consent} onClick={enter}>
          Entrar
        </button>
      </main>
    );
  }

  return (
    <main className="tl-guest">
      <header className="tl-guest-head">
        <h1 className="tl-serif">{settings.title}</h1>
        {!online && <p className="tl-guest-offline">Sem conexão. Seus envios continuam assim que a rede voltar.</p>}
      </header>

      <nav className="tl-tabs" aria-label="Seções">
        <button type="button" className={tab === "enviar" ? "is-on" : ""} onClick={() => setTab("enviar")}>Enviar</button>
        <button type="button" className={tab === "minhas" ? "is-on" : ""} onClick={() => setTab("minhas")}>Minhas ({mine.length})</button>
        {settings.guestsSeeGallery && (
          <button type="button" className={tab === "galeria" ? "is-on" : ""} onClick={() => setTab("galeria")}>Galeria ({gallery.length})</button>
        )}
      </nav>

      {notice && <p className="tl-notice" role="status">{notice}</p>}

      {tab === "enviar" && (
        <section className="tl-guest-section">
          {!settings.uploadsOpen ? (
            <p className="tl-empty">Os envios deste evento foram encerrados. Obrigado por participar!</p>
          ) : (
            <>
              <label className="tl-bigbtn tl-bigbtn-primary">
                Tirar foto agora
                <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
              <label className="tl-bigbtn">
                Escolher fotos ou vídeos
                <input type="file" accept="image/*,video/*" multiple hidden data-testid="guest-file" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
              <button type="button" className="tl-bigbtn" onClick={() => setMessageOpen((o) => !o)}>
                Deixar um recado
              </button>

              {messageOpen && (
                <div className="tl-field">
                  <textarea
                    value={message}
                    maxLength={MAX_MESSAGE}
                    rows={3}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escreva para os noivos"
                    aria-label="Recado"
                  />
                  <div className="tl-row-between">
                    <small>{message.length}/{MAX_MESSAGE}</small>
                    <button type="button" className="tl-btn tl-btn-primary" disabled={!message.trim()} onClick={() => void sendMessage()}>Enviar recado</button>
                  </div>
                </div>
              )}

              <label className="tl-field">
                <span>Legenda da próxima foto (opcional)</span>
                <input value={caption} maxLength={MAX_CAPTION} onChange={(e) => setCaption(e.target.value)} placeholder="Ex.: a pista está pegando fogo" />
              </label>
              <label className="tl-field">
                <span>Seu nome (opcional)</span>
                <input value={guestName} maxLength={60} onChange={(e) => setGuestName(e.target.value)} />
              </label>
              {/* Honeypot: invisível para pessoas. */}
              <input ref={honeypot} className="tl-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              {settings.moderation === "manual" && <p className="tl-hint">As fotos passam por aprovação antes de aparecer no telão.</p>}

              {queue.length > 0 && (
                <ul className="tl-queue" data-testid="guest-queue">
                  {queue.map((item) => (
                    <li key={item.id}>
                      {item.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.preview} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                      ) : (
                        <div className="tl-queue-ph" />
                      )}
                      <div className="tl-queue-body">
                        <p>{item.name}</p>
                        {item.error ? <small className="tl-error">{item.error}</small> : (
                          <div className="tl-progress"><span style={{ width: `${item.progress}%` }} /></div>
                        )}
                      </div>
                      {item.status === "error" && item.attempts >= MAX_AUTO_RETRIES && (
                        <div className="tl-queue-actions">
                          <button type="button" className="tl-btn" onClick={() => patch(item.id, { status: "waiting", attempts: 0, error: "" })}>Repetir</button>
                          <button type="button" className="tl-btn" onClick={() => removeItem(item)}>Remover</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}

      {tab === "minhas" && (
        <section className="tl-guest-section">
          {mine.length === 0 ? <p className="tl-empty">Você ainda não enviou nada.</p> : (
            <ul className="tl-mine">
              {mine.map((post) => (
                <li key={post.id}>
                  <GuestMedia post={post} src={mediaUrl(post.id, "thumb")} />
                  <div className="tl-mine-body">
                    <p className={`tl-pill tl-pill-${post.status}`}>{STATUS_LABEL[post.status]}</p>
                    {post.caption && <p>{post.caption}</p>}
                    <button type="button" className="tl-btn" onClick={() => void act("delete", post.id)}>Apagar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "galeria" && settings.guestsSeeGallery && (
        <section className="tl-guest-section">
          {gallery.length === 0 ? <p className="tl-empty">As primeiras fotos aparecem aqui.</p> : (
            <ul className="tl-gallery">
              {gallery.map((post) => {
                const hearted = heartedIds.includes(post.id);
                return (
                  <li key={post.id}>
                    <GuestMedia post={post} src={mediaUrl(post.id, "thumb")} />
                    <button
                      type="button"
                      className={`tl-like ${hearted ? "is-on" : ""}`}
                      aria-pressed={hearted}
                      aria-label="Curtir"
                      data-testid="guest-heart"
                      onClick={() => void act("heart", post.id)}
                    >
                      ♥ {post.hearts}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

function GuestMedia({ post, src }: { post: Post; src: string }) {
  if (post.kind === "message") return <div className="tl-mediabox tl-mediabox-text">{post.caption}</div>;
  if (post.kind === "video") {
    // Sem controles nativos, que ficariam por baixo do botão de curtir: toque para tocar ou pausar.
    return (
      <video
        className="tl-mediabox"
        src={src}
        preload="metadata"
        muted
        loop
        playsInline
        aria-label="Vídeo: toque para tocar ou pausar"
        onClick={(e) => (e.currentTarget.paused ? void e.currentTarget.play() : e.currentTarget.pause())}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="tl-mediabox" src={src} alt={post.caption || "Foto"} loading="lazy" />;
}
