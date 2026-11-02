// Tipos do protótipo do telão, usados no servidor e no navegador.

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
  baseUrl: string;
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
  simulated: boolean;
}

/** Post como o painel enxerga: inclui o aparelho, para permitir bloquear. */
export interface AdminPost extends Post {
  deviceId: string;
}

export interface WallState {
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
  settings: WallSettings;
  posts: AdminPost[];
  blockedDevices: string[];
  guestUrl: string;
  wallUrl: string;
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
