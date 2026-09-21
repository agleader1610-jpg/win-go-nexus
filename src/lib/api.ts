// Client-safe API layer. Talks to the cPanel PHP backend (SQLite).
// Base URL: relative "api" when the SPA is served from the cPanel folder,
// otherwise the absolute production endpoint.
import type { ServerSignal } from "./signals.types";

const RAW_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "https://eip.lat/bdwineiplat/api";

export const API_BASE = RAW_BASE.replace(/\/+$/, "");

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

export interface GameItem {
  issueNumber: string;
  number: string;
  color: string;
  premium: string;
  sum: number;
  blockHash: string;
}

export interface GameDataResponse {
  ok: boolean;
  error?: string;
  data?: { list?: GameItem[]; count?: number; serviceTime?: number } | null;
  signals?: Record<string, ServerSignal>;
  fetchedAt?: number;
}

export function apiGameData(gameId: string) {
  return get<GameDataResponse>(`game.php?game=${encodeURIComponent(gameId)}`);
}

export interface LatestRow {
  id: string;
  currentIssue: string;
  nextIssue: string;
  lastNumber: number | null;
  lastSum: number | null;
  lastColor: string | null;
}

export function apiAllLatest() {
  return get<{ ok: boolean; latest: LatestRow[]; fetchedAt: number }>("latest.php");
}

export interface RawDraw {
  issueNumber: string;
  number: string;
  color: string;
  sum: number;
}

export function apiAllHistory() {
  return get<{ ok: boolean; history: Record<string, RawDraw[]>; fetchedAt: number }>(
    "history-all.php",
  );
}
