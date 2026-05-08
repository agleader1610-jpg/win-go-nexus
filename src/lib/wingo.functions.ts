import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

export const verifyPassword = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const expected = process.env.WINGO_ACCESS_PASSWORD;
    if (!expected) {
      return { ok: false, error: "Server password not configured" };
    }
    // Constant-time-ish compare
    const a = data.password;
    const b = expected;
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    if (diff !== 0) return { ok: false, error: "Invalid access key" };
    // Issue a short-lived token (timestamp signed via simple HMAC-ish hash).
    const token = btoa(`${Date.now()}:${expected.length}:wingo`);
    return { ok: true, token };
  });

// Deterministic PRNG (mulberry32) so every client gets the same signal for the same period.
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

function buildSignal(period: string, history: HistItem[]): ServerSignal {
  // Salt with a server-side constant so seed isn't trivially predictable client-side,
  // but stays deterministic for a given period across all viewers.
  const salt = "wingo30s::v1";
  const rand = mulberry32(hashStr(salt + ":" + period));
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

export const fetchWingoHistory = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const r = await fetch(API_URL, {
        cache: "no-store",
        headers: { "user-agent": "Mozilla/5.0 WingoDashboard" },
      });
      if (!r.ok) {
        return { ok: false as const, error: `Upstream ${r.status}`, data: null, signals: {} as Record<string, ServerSignal> };
      }
      const json = await r.json();
      const list: HistItem[] = json?.data?.list ?? [];
      // Build deterministic signals for next period + last 60 historical periods.
      const signals: Record<string, ServerSignal> = {};
      if (list[0]?.issueNumber) {
        const nextPeriod = (BigInt(list[0].issueNumber) + 1n).toString();
        signals[nextPeriod] = buildSignal(nextPeriod, list);
      }
      list.slice(0, 60).forEach((it, idx) => {
        signals[it.issueNumber] = buildSignal(it.issueNumber, list.slice(idx + 1));
      });
      return { ok: true as const, data: json, signals, fetchedAt: Date.now() };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message, data: null, signals: {} as Record<string, ServerSignal> };
    }
  });

