// Client-safe API layer. Talks to the cPanel PHP backend (SQLite).
// Base URL always resolves beside the deployed SPA, whether it is served from
// a domain root or a cPanel subfolder. No main-site backend is involved.
import type { ServerSignal } from "./signals.types";

const DEPLOY_BASE = import.meta.env.BASE_URL || "/";

function apiBase(): string {
  const configured = import.meta.env.VITE_API_BASE as string | undefined;
  if (configured) return configured.replace(/\/+$/, "");
  const path = `${DEPLOY_BASE.replace(/\/+$/, "")}/api`;
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString().replace(/\/+$/, "");
}

async function get<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6_000);
  try {
    const res = await fetch(`${apiBase()}/${path}`, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API ${path} failed (${res.status})`);
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("API request timed out");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
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
