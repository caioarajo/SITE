"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Post, WallLayout, WallState } from "@/lib/memorias/types";
import { useLiveState } from "@/lib/memorias/useLiveState";

const CAPACITY: Record<WallLayout, number> = { cinema: 1, mosaico: 12, polaroid: 6 };
const VIDEO_MAX_MS = 30_000;

interface Slot {
  id: string;
  at: number;
}

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Colunas e linhas do mosaico conforme a quantidade, para não sobrar faixa vazia na tela. */
function mosaicGrid(count: number): [number, number] {
  if (count <= 3) return [Math.max(count, 1), 1];
  if (count === 4) return [2, 2];
  if (count <= 6) return [3, 2];
  if (count <= 8) return [4, 2];
  if (count === 9) return [3, 3];
  return [4, 3];
}

function Spark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 0c1 7 4 10 12 12-8 2-11 5-12 12-1-7-4-10-12-12 8-2 11-5 12-12z" />
    </svg>
  );
}

export default function WallClient({ token, initial }: { token: string; initial: WallState }) {
  const { state, online } = useLiveState<WallState>(`/api/memorias/state?t=${token}`, initial, {
    topic: `memorias-${initial.eventId}`,
    pollMs: 10_000,
  });
  const { settings, posts, showNow } = state;
  const layout = settings.layout;
  const capacity = CAPACITY[layout];
  const mediaUrl = useCallback((id: string) => `/api/memorias/media/${id}/display?t=${token}`, [token]);
  const qrUrl = `/api/memorias/qr?t=${token}`;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [hearts, setHearts] = useState<{ id: number; left: number }[]>([]);
  const [cursorIdle, setCursorIdle] = useState(false);

  const postsRef = useRef(posts);
  const slotsRef = useRef(slots);
  const shown = useRef(new Map<string, { count: number; last: number }>());
  const broken = useRef(new Set<string>());
  const picks = useRef(0);
  postsRef.current = posts;
  slotsRef.current = slots;

  /** Fotos novas primeiro, na ordem de chegada; depois a menos exibida. Fixadas voltam a cada 4 trocas. */
  const pickNext = useCallback((exclude: Set<string>): Post | null => {
    const pool = postsRef.current.filter((p) => !broken.current.has(p.id));
    const free = pool.filter((p) => !exclude.has(p.id));
    const candidates = free.length ? free : pool;
    if (!candidates.length) return null;
    const unseen = candidates.find((p) => !shown.current.has(p.id));
    if (unseen) return unseen;
    picks.current += 1;
    const pinned = candidates.filter((p) => p.pinned);
    const list = pinned.length && picks.current % 4 === 0 ? pinned : candidates;
    return [...list].sort((a, b) => {
      const sa = shown.current.get(a.id) ?? { count: 0, last: 0 };
      const sb = shown.current.get(b.id) ?? { count: 0, last: 0 };
      return sa.count - sb.count || sa.last - sb.last;
    })[0];
  }, []);

  const markShown = (id: string) => {
    const s = shown.current.get(id) ?? { count: 0, last: 0 };
    shown.current.set(id, { count: s.count + 1, last: Date.now() });
  };

  /** Só troca depois que a imagem estiver carregada, para não piscar tela vazia. */
  const preload = useCallback(
    async (post: Post) => {
      if (post.kind !== "photo") return;
      const img = new Image();
      img.src = mediaUrl(post.id);
      await Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 4000))]);
    },
    [mediaUrl],
  );

  const replaceOldest = useCallback(
    async (forced?: Post) => {
      const current = slotsRef.current;
      const next = forced ?? pickNext(new Set(current.map((s) => s.id)));
      if (!next) return;
      await preload(next);
      markShown(next.id);
      setSlots((prev) => {
        if (prev.some((s) => s.id === next.id)) return prev;
        if (prev.length < capacity) return [...prev, { id: next.id, at: Date.now() }];
        let oldest = 0;
        prev.forEach((s, i) => {
          if (s.at < prev[oldest].at) oldest = i;
        });
        return prev.map((s, i) => (i === oldest ? { id: next.id, at: Date.now() } : s));
      });
    },
    [capacity, pickNext, preload],
  );

  // Ao mudar o layout, recomeça a composição.
  useEffect(() => {
    slotsRef.current = [];
    setSlots([]);
  }, [layout]);

  // Foto ocultada no painel sai do telão na hora; vagas livres são preenchidas de uma vez.
  const postIds = posts.map((p) => p.id).join(",");
  useEffect(() => {
    const ids = new Set(postIds ? postIds.split(",") : []);
    const next = slotsRef.current.filter((s) => ids.has(s.id));
    if (!settings.wallPaused) {
      const taken = new Set(next.map((s) => s.id));
      while (next.length < Math.min(capacity, postsRef.current.length)) {
        const post = pickNext(taken);
        if (!post || taken.has(post.id)) break;
        taken.add(post.id);
        markShown(post.id);
        next.push({ id: post.id, at: Date.now() + next.length });
      }
    }
    const unchanged = next.length === slotsRef.current.length && next.every((s, i) => s.id === slotsRef.current[i].id);
    if (unchanged) return;
    slotsRef.current = next;
    setSlots(next);
  }, [postIds, capacity, layout, slots.length, settings.wallPaused, pickNext]);

  // Relógio da troca. No cinema, vídeo fica até terminar (com um teto).
  const currentPost = layout === "cinema" ? posts.find((p) => p.id === slots[0]?.id) : undefined;
  const cinemaId = layout === "cinema" ? slots[0]?.id : undefined;
  useEffect(() => {
    if (settings.wallPaused || layout !== "cinema" || !cinemaId || posts.length <= 1) return;
    const delay = currentPost?.kind === "video" ? VIDEO_MAX_MS : settings.intervalSec * 1000;
    const timer = setTimeout(() => void replaceOldest(), delay);
    return () => clearTimeout(timer);
  }, [cinemaId, settings.intervalSec, settings.wallPaused, posts.length, layout, currentPost?.kind, replaceOldest]);

  useEffect(() => {
    if (settings.wallPaused || layout === "cinema") return;
    const timer = setInterval(() => void replaceOldest(), settings.intervalSec * 1000);
    return () => clearInterval(timer);
  }, [layout, settings.intervalSec, settings.wallPaused, replaceOldest]);

  // "Mostrar agora" do painel.
  const lastShowNow = useRef(initial.showNow?.at ?? 0);
  useEffect(() => {
    if (!showNow || showNow.at <= lastShowNow.current) return;
    const post = postsRef.current.find((p) => p.id === showNow.id);
    if (!post) return;
    lastShowNow.current = showNow.at;
    if (slotsRef.current.some((s) => s.id === post.id)) return;
    void replaceOldest(post);
  }, [showNow, posts, replaceOldest]);

  // Corações sobem na tela conforme as curtidas aumentam.
  const totalHearts = posts.reduce((sum, p) => sum + p.hearts, 0);
  const lastHearts = useRef(totalHearts);
  const heartId = useRef(0);
  useEffect(() => {
    const diff = totalHearts - lastHearts.current;
    lastHearts.current = totalHearts;
    if (diff <= 0) return;
    const added = Array.from({ length: Math.min(diff, 12) }, () => ({ id: ++heartId.current, left: 8 + Math.random() * 84 }));
    setHearts((prev) => [...prev, ...added]);
    const ids = new Set(added.map((h) => h.id));
    const timer = setTimeout(() => setHearts((prev) => prev.filter((h) => !ids.has(h.id))), 3600);
    return () => clearTimeout(timer);
  }, [totalHearts]);

  // Tela cheia (tecla F), tela sempre ligada e cursor escondido.
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    let idle: ReturnType<typeof setTimeout>;
    const onMove = () => {
      setCursorIdle(false);
      clearTimeout(idle);
      idle = setTimeout(() => setCursorIdle(true), 2500);
    };
    let lock: { release: () => Promise<void> } | null = null;
    const requestLock = async () => {
      try {
        lock = await navigator.wakeLock?.request("screen");
      } catch {
        // Sem HTTPS ou sem suporte: a tela segue o padrão do aparelho.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void requestLock();
    };
    void requestLock();
    onMove();
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(idle);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => {});
    };
  }, [toggleFullscreen]);

  const onMediaFailed = (id: string) => {
    // Ex.: vídeo HEVC de iPhone no Chrome. Tira da rotação e segue o show.
    broken.current.add(id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const byId = new Map(posts.map((p) => [p.id, p]));
  const visible = slots.flatMap((s) => {
    const post = byId.get(s.id);
    return post ? [{ slot: s, post }] : [];
  });
  const idle = settings.wallPaused || posts.length === 0;

  return (
    <div ref={rootRef} className={`tl-wall ${cursorIdle ? "tl-wall-nocursor" : ""}`} data-testid="wall">
      {/* Título, legenda e QR code ficam na coluna lateral: nada pode cobrir as pessoas nas fotos. */}
      {!idle && (
      <div className="tl-stage">
      {layout === "cinema" && (
        <AnimatePresence initial={false}>
          {visible.map(({ post }) => (
            <motion.div
              key={post.id}
              className="tl-cinema"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1 }}
            >
              {post.kind === "message" ? (
                <MessageCard post={post} />
              ) : (
                <>
                  {post.kind === "photo" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="tl-cinema-bg" src={mediaUrl(post.id)} alt="" />
                  )}
                  {post.kind === "photo" ? (
                    <motion.img
                      className="tl-cinema-photo"
                      src={mediaUrl(post.id)}
                      alt={post.caption || "Foto de convidado"}
                      // Termina em 1: o zoom nunca pode passar disso, ou corta cabeça e pés.
                      initial={{ scale: 0.97 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: settings.intervalSec + 2, ease: "linear" }}
                    />
                  ) : (
                    <video
                      className="tl-cinema-photo"
                      src={mediaUrl(post.id)}
                      autoPlay
                      muted
                      playsInline
                      onEnded={() => void replaceOldest()}
                      onError={() => onMediaFailed(post.id)}
                    />
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {layout === "mosaico" && (
        <div
          className="tl-mosaic"
          style={{ gridTemplateColumns: `repeat(${mosaicGrid(visible.length)[0]}, 1fr)`, gridTemplateRows: `repeat(${mosaicGrid(visible.length)[1]}, 1fr)` }}
        >
          {visible.map(({ slot, post }, i) => (
            <div
              key={slot.id}
              className="tl-mosaic-cell"
              style={i === 0 ? { gridColumn: `span ${mosaicGrid(visible.length)[0] * mosaicGrid(visible.length)[1] - visible.length + 1}` } : undefined}
            >
              <motion.div
                className="tl-fill"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.9 }}
              >
                <div className="tl-tile-box">
                  <Tile post={post} src={mediaUrl(post.id)} onFailed={onMediaFailed} />
                </div>
                {post.kind !== "message" && <Credit post={post} compact />}
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {layout === "polaroid" && (
        <div className="tl-board">
          <AnimatePresence>
            {visible.map(({ slot, post }, i) => {
              const h = hash(post.id);
              return (
                <motion.figure
                  key={slot.id}
                  className="tl-polaroid"
                  style={{ left: `${2 + (i % 3) * 33}%`, top: `${6 + (i >= 3 ? 44 : 0)}%`, zIndex: Math.floor(slot.at / 1000) % 100000 }}
                  initial={{ opacity: 0, scale: 1.7, rotate: 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: (h % 13) - 6 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 90, damping: 15 }}
                >
                  <div className="tl-polaroid-media">
                    <Tile post={post} src={mediaUrl(post.id)} onFailed={onMediaFailed} />
                  </div>
                  <figcaption>{[post.guestName, post.kind === "message" ? "" : post.caption].filter(Boolean).join(" · ") || " "}</figcaption>
                </motion.figure>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      </div>
      )}

      {idle && (
        <div className="tl-idle">
          <Spark className="tl-idle-spark" />
          <h1 className="tl-serif">{settings.title}</h1>
          <p className="tl-idle-sub">
            {settings.wallPaused ? settings.pauseMessage : "Aponte a câmera para o QR code e seja o primeiro a aparecer aqui"}
          </p>
          {settings.showQr && settings.uploadsOpen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="tl-idle-qr" src={qrUrl} alt="QR code para enviar fotos" />
          )}
        </div>
      )}

      {!idle && (
        <aside className="tl-side">
          <div className="tl-wall-title">
            <Spark className="tl-wall-spark" />
            <span className="tl-serif">{settings.title}</span>
          </div>
          <div className="tl-side-credit">
            {currentPost && currentPost.kind !== "message" && <Credit post={currentPost} />}
          </div>
          {settings.showQr && settings.uploadsOpen && (
            <div className="tl-wall-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR code para enviar fotos" />
              <span>Envie sua foto</span>
            </div>
          )}
        </aside>
      )}

      {!idle && hearts.map((h) => (
        <svg key={h.id} className="tl-heart" style={{ left: `${h.left}%` }} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 21s-8-5.2-10-10C.6 7.6 2.8 4 6.4 4c2.2 0 4 1.2 5.6 3.2C13.600 5.200 15.400 4 17.600 4c3.600 0 5.800 3.600 4.400 7-2 4.800-10 10-10 10z" />
        </svg>
      ))}

      {!online && <div className="tl-wall-offline" title="Reconectando" data-testid="wall-offline" />}
      {!cursorIdle && (
        <button type="button" className="tl-wall-fs" onClick={toggleFullscreen}>
          Tela cheia (F)
        </button>
      )}
    </div>
  );
}

function Credit({ post, compact }: { post: Post; compact?: boolean }) {
  if (!post.guestName && !post.caption) return null;
  return (
    <div className={compact ? "tl-credit tl-credit-compact" : "tl-credit"}>
      {post.caption && <p className="tl-credit-caption">{post.caption}</p>}
      {post.guestName && <p className="tl-credit-name">{post.guestName}</p>}
    </div>
  );
}

function MessageCard({ post }: { post: Post }) {
  return (
    <div className="tl-message">
      <p className="tl-message-text">&ldquo;{post.caption}&rdquo;</p>
      {post.guestName && <p className="tl-message-name">{post.guestName}</p>}
    </div>
  );
}

function Tile({ post, src, onFailed }: { post: Post; src: string; onFailed: (id: string) => void }) {
  if (post.kind === "message") return <MessageCard post={post} />;
  if (post.kind === "video") {
    return <video className="tl-tile" src={src} autoPlay muted loop playsInline onError={() => onFailed(post.id)} />;
  }
  // A foto aparece inteira; a sobra do quadro é preenchida com ela mesma, desfocada.
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="tl-tile-bg" src={src} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="tl-tile" src={src} alt={post.caption || "Foto de convidado"} />
    </>
  );
}
