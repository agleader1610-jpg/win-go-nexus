// Server-only: ingest upstream history into game_history and build signals.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { GAMES, getGame, type GameConfig, type GameKind } from "./games.config";

export interface GameRow {
  game_type: string;
  issue_number: string;
  number: number | null;
  color: string | null;
  premium: string | null;
  sum: number | null;
  block_hash: string | null;
}

export interface ServerSignal {
  period: string;
  type: "BIG" | "SMALL";
  prediction: string;        // "BIG", "SMALL", or numeric for K3
  confidence: number;
  trendPower: number;
  volatility: number;
  marketHeat: number;
  generatedAt: number;
  // K3 only
  diceGuess?: [number, number, number];
}

// ---------- deterministic PRNG ----------
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSignalForPeriod(
  gameId: string,
  kind: GameKind,
  period: string,
  history: GameRow[],
): ServerSignal {
  const rand = mulberry32(hashStr(`${gameId}::v1:${period}`));
  const r = (min: number, max: number) => Math.round(min + rand() * (max - min));
  const recent = history.slice(0, 10);

  if (kind === "k3") {
    // K3: predict BIG (>=11) / SMALL (<=10) using last 10 sums
    let big = 0;
    recent.forEach((h) => { if ((h.sum ?? 0) >= 11) big++; });
    const bias = recent.length ? big / recent.length : 0.5;
    const score = rand() + (0.5 - bias) * 0.4;
    const type: "BIG" | "SMALL" = score > 0.5 ? "BIG" : "SMALL";
    const dice: [number, number, number] = [r(1, 6), r(1, 6), r(1, 6)];
    return {
      period,
      type,
      prediction: type,
      confidence: r(55, 92),
      trendPower: r(40, 96),
      volatility: r(20, 90),
      marketHeat: r(35, 98),
      generatedAt: Date.now(),
      diceGuess: dice,
    };
  }

  // wingo / trx_wingo
  let big = 0;
  recent.forEach((h) => { if ((h.number ?? 0) >= 5) big++; });
  const bias = recent.length ? big / recent.length : 0.5;
  const score = rand() + (0.5 - bias) * 0.4;
  const type: "BIG" | "SMALL" = score > 0.5 ? "BIG" : "SMALL";
  return {
    period,
    type,
    prediction: type,
    confidence: r(52, 94),
    trendPower: r(40, 98),
    volatility: r(20, 95),
    marketHeat: r(30, 99),
    generatedAt: Date.now(),
  };
}

export function buildSignals(gameId: string, rows: GameRow[]) {
  const cfg = getGame(gameId);
  if (!cfg) return {};
  const out: Record<string, ServerSignal> = {};
  if (rows[0]?.issue_number) {
    const next = (BigInt(rows[0].issue_number) + 1n).toString();
    out[next] = buildSignalForPeriod(gameId, cfg.kind, next, rows);
  }
  rows.slice(0, 60).forEach((row, idx) => {
    out[row.issue_number] = buildSignalForPeriod(gameId, cfg.kind, row.issue_number, rows.slice(idx + 1));
  });
  return out;
}

// ---------- ingest ----------
interface UpstreamItem {
  issueNumber: string;
  number?: string;
  color?: string;
  premium?: string;
  sum?: number;
  blockId?: string;
}

export async function ingestGame(cfg: GameConfig): Promise<{ inserted: number }> {
  const url = `${cfg.upstream}?ts=${Date.now()}`;
  const r = await fetch(url, {
    cache: "no-store",
    headers: { "user-agent": "Mozilla/5.0 WinProBot" },
  });
  if (!r.ok) throw new Error(`Upstream ${cfg.id} ${r.status}`);
  const json = (await r.json()) as { data?: { list?: UpstreamItem[] } };
  const list = json?.data?.list ?? [];
  if (!list.length) return { inserted: 0 };

  const rows: GameRow[] = list.map((it) => {
    const numParsed = it.number !== undefined && it.number !== "" ? parseInt(it.number, 10) : NaN;
    return {
      game_type: cfg.id,
      issue_number: it.issueNumber,
      number: Number.isFinite(numParsed) ? numParsed : null,
      color: it.color ?? null,
      premium: it.premium ?? null,
      sum: typeof it.sum === "number" ? it.sum : null,
      block_hash: it.blockId ?? null,
    };
  });

  const { error } = await supabaseAdmin
    .from("game_history")
    .upsert(rows, { onConflict: "game_type,issue_number", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  return { inserted: rows.length };
}

export async function ingestAllGames(): Promise<Record<string, number | string>> {
  const result: Record<string, number | string> = {};
  await Promise.all(
    GAMES.map(async (g) => {
      try {
        const { inserted } = await ingestGame(g);
        result[g.id] = inserted;
      } catch (e) {
        result[g.id] = `error: ${(e as Error).message}`;
      }
    }),
  );
  // trim once after all ingests
  try { await supabaseAdmin.rpc("trim_game_history"); } catch { /* ignore */ }
  return result;
}

export async function readRecent(gameId: string, limit = 60): Promise<GameRow[]> {
  const { data, error } = await supabaseAdmin
    .from("game_history")
    .select("game_type, issue_number, number, color, premium, sum, block_hash")
    .eq("game_type", gameId)
    .order("issue_number", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as GameRow[];
}

export async function readPaged(gameId: string, page: number, limit: number) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await supabaseAdmin
    .from("game_history")
    .select("game_type, issue_number, number, color, premium, sum, block_hash, recorded_at", { count: "exact" })
    .eq("game_type", gameId)
    .order("issue_number", { ascending: false })
    .range(from, to);
  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0 };
}

export function toApiShape(gameId: string, rows: GameRow[]) {
  const cfg = getGame(gameId);
  return {
    game: cfg ? { id: cfg.id, label: cfg.label, kind: cfg.kind, periodSec: cfg.periodSec } : { id: gameId },
    list: rows.map((r) => ({
      issueNumber: r.issue_number,
      number: r.number !== null ? String(r.number) : "",
      color: r.color ?? "",
      premium: r.premium ?? "",
      sum: r.sum ?? 0,
      blockHash: r.block_hash ?? "",
    })),
    count: rows.length,
    serviceTime: Date.now(),
  };
}
