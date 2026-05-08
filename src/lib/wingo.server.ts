// Server-only helpers for WinGo. Never import this from client modules.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const UPSTREAM_URL =
  "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

export interface ServerSignal {
  period: string;
  type: "BIG" | "SMALL";
  confidence: number;
  trendPower: number;
  volatility: number;
  marketHeat: number;
  generatedAt: number;
}

interface HistItem { issueNumber: string; number: string }

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

function buildSignal(period: string, history: HistItem[]): ServerSignal {
  const rand = mulberry32(hashStr("wingo30s::v1:" + period));
  const recent = history.slice(0, 10);
  let big = 0;
  recent.forEach((h) => { if (parseInt(h.number, 10) >= 5) big++; });
  const bias = recent.length ? big / recent.length : 0.5;
  const score = rand() + (0.5 - bias) * 0.4;
  const type: "BIG" | "SMALL" = score > 0.5 ? "BIG" : "SMALL";
  const r = (min: number, max: number) => Math.round(min + rand() * (max - min));
  return {
    period,
    type,
    confidence: r(52, 94),
    trendPower: r(40, 98),
    volatility: r(20, 95),
    marketHeat: r(30, 99),
    generatedAt: Date.now(),
  };
}

export function buildSignals(rows: Array<{ issue_number: string; number: number }>) {
  const signals: Record<string, ServerSignal> = {};
  const hist: HistItem[] = rows.map((r) => ({ issueNumber: r.issue_number, number: String(r.number) }));
  if (hist[0]?.issueNumber) {
    const nextPeriod = (BigInt(hist[0].issueNumber) + 1n).toString();
    signals[nextPeriod] = buildSignal(nextPeriod, hist);
  }
  hist.slice(0, 60).forEach((it, idx) => {
    signals[it.issueNumber] = buildSignal(it.issueNumber, hist.slice(idx + 1));
  });
  return signals;
}

export function toApiShape(rows: Array<{ issue_number: string; number: number; color: string | null; premium: string | null; sum: number | null }>) {
  return {
    data: {
      list: rows.map((r) => ({
        issueNumber: r.issue_number,
        number: String(r.number),
        color: r.color ?? "",
        premium: r.premium ?? "",
        sum: r.sum ?? 0,
      })),
      pageNo: 1,
      totalPage: 1,
      totalCount: rows.length,
    },
    code: 0,
    msg: "ok",
    serviceTime: Date.now(),
  };
}

export async function ingestUpstreamToDb(): Promise<{ inserted: number }> {
  const r = await fetch(UPSTREAM_URL, {
    cache: "no-store",
    headers: { "user-agent": "Mozilla/5.0 WingoApp" },
  });
  if (!r.ok) throw new Error(`Upstream ${r.status}`);
  const json = (await r.json()) as { data?: { list?: Array<{ issueNumber: string; number: string; color?: string; premium?: string; sum?: number }> } };
  const list = json?.data?.list ?? [];
  if (!list.length) return { inserted: 0 };
  const rows = list.map((it) => ({
    issue_number: it.issueNumber,
    number: parseInt(it.number, 10),
    color: it.color ?? null,
    premium: it.premium ?? null,
    sum: typeof it.sum === "number" ? it.sum : null,
  }));
  const { error } = await supabaseAdmin
    .from("wingo_history")
    .upsert(rows, { onConflict: "issue_number", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  await supabaseAdmin.rpc("trim_wingo_history");
  return { inserted: rows.length };
}

export async function readRecentRows(limit = 60) {
  const { data, error } = await supabaseAdmin
    .from("wingo_history")
    .select("issue_number, number, color, premium, sum")
    .order("issue_number", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
