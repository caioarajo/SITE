// Tipos da LP Memórias, usados no servidor e no navegador.

export type PostStatus = "pending" | "approved" | "hidden";
export type PostKind = "photo" | "video" | "message";
export type WallLayout = "cinema" | "mosaico" | "polaroid";

export interface WallSettings {
  title: string;
  subtitle: string;
  uploadsOpen: boolean;
  moderation: "manual" | "auto";
  wallPaused: boolean;
  pauseMessage: string;
  layout: WallLayout;
  intervalSec: number;
  showNames: boolean;
  showCaptions: boolean;
  showQr: boolean;
  guestsSeeGallery: boolean;
  blockedWords: string[];
}

export interface Post {
  id: string;
  kind: PostKind;
  status: PostStatus;
  pinned: boolean;
  flagged: boolean;
  guestName: string;
  caption: string;
  createdAt: number;
  width: number;
  height: number;
  hearts: number;
  size: number;
}

/** Post como o painel enxerga: inclui o aparelho, para permitir bloquear. */
export interface AdminPost extends Post {
  deviceId: string;
}

export interface WallState {
  eventId: string;
  settings: WallSettings;
  posts: Post[];
  showNow: { id: string; at: number } | null;
}

export interface GuestState {
  settings: Pick<WallSettings, "title" | "subtitle" | "uploadsOpen" | "guestsSeeGallery" | "moderation">;
  gallery: Post[];
  mine: Post[];
  heartedIds: string[];
}

export interface AdminState {
  eventId: string;
  settings: WallSettings;
  posts: AdminPost[];
  blockedDevices: string[];
  guestUrl: string;
  wallUrl: string;
  eventDate: string | null;
  retentionUntil: string | null;
  clientId: string | null;
  stats: {
    total: number;
    pending: number;
    approved: number;
    hidden: number;
    guests: number;
    hearts: number;
    bytes: number;
    top: { name: string; count: number }[];
  };
}

export interface EventSummary {
  id: string;
  title: string;
  eventDate: string | null;
  retentionUntil: string | null;
  uploadsOpen: boolean;
  total: number;
  pending: number;
  clientName: string | null;
}

export interface ClientSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  isActive: boolean;
  mustChangePassword: boolean;
  events: { id: string; title: string }[];
}

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_NAME = 60;
export const MAX_CAPTION = 140;
export const MAX_MESSAGE = 280;
