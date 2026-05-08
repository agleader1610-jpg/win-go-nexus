import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { WingoApiResponse, WingoIssue, Signal } from "@/types/wingo";
import { fetchWingoHistory } from "@/lib/wingo.functions";

function rng(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function generateSignal(period: string, history: WingoIssue[], confRange: [number, number]): Signal {
  // analyze history "trend" — count big vs small
  const recent = history.slice(0, 10);
  let big = 0;
  recent.forEach((h) => {
    const n = parseInt(h.number, 10);
    if (n >= 5) big++;
  });
  const bias = big / Math.max(recent.length, 1);
  // contrarian-ish bias with random jitter
  const type: "BIG" | "SMALL" = (Math.random() + (0.5 - bias) * 0.4) > 0.5 ? "BIG" : "SMALL";
  return {
    period,
    type,
    confidence: Math.round(rng(confRange[0], confRange[1])),
    trendPower: Math.round(rng(40, 98)),
    volatility: Math.round(rng(20, 95)),
    marketHeat: Math.round(rng(30, 99)),
    generatedAt: Date.now(),
  };
}

export function getPeriodInfo(serverTimeMs: number, latestIssue?: string) {
  // 30s periods. Use server time.
  const now = Date.now();
  const elapsed = Math.floor((now / 1000) % 30);
  const remaining = 30 - elapsed;
  let nextPeriod = latestIssue ?? "";
  if (latestIssue) {
    const num = BigInt(latestIssue) + 1n;
    nextPeriod = num.toString();
  }
  void serverTimeMs;
  return { remaining, nextPeriod, elapsed };
}

export interface AdminSettings {
  refreshMs: number;
  effects: boolean;
  sounds: boolean;
  confRange: [number, number];
}

const DEFAULT_SETTINGS: AdminSettings = {
  refreshMs: 5000,
  effects: true,
  sounds: false,
  confRange: [52, 94],
};

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const raw = sessionStorage.getItem("wingo_admin");
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  useEffect(() => {
    try { sessionStorage.setItem("wingo_admin", JSON.stringify(settings)); } catch {}
  }, [settings]);
  return [settings, setSettings] as const;
}

export function useWingoData(refreshMs: number, confRange: [number, number]) {
  const [issues, setIssues] = useState<WingoIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signals, setSignals] = useState<Record<string, Signal>>({});
  const lastSeenRef = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(API_URL, { cache: "no-store" });
      const json: WingoApiResponse = await r.json();
      const list = json?.data?.list ?? [];
      setIssues(list);
      setError(null);
      // Generate a forward signal for next period if newest changed
      const newest = list[0]?.issueNumber;
      if (newest && newest !== lastSeenRef.current) {
        lastSeenRef.current = newest;
        const nextPeriod = (BigInt(newest) + 1n).toString();
        setSignals((prev) => {
          if (prev[nextPeriod]) return prev;
          return { ...prev, [nextPeriod]: generateSignal(nextPeriod, list, confRange) };
        });
        // Backfill signals for some recent periods (deterministic-ish)
        setSignals((prev) => {
          const next = { ...prev };
          list.slice(0, 30).forEach((it, idx) => {
            if (!next[it.issueNumber]) {
              next[it.issueNumber] = generateSignal(it.issueNumber, list.slice(idx), confRange);
            }
          });
          return next;
        });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [confRange]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refreshMs);
    return () => clearInterval(id);
  }, [fetchData, refreshMs]);

  const clearHistory = useCallback(() => {
    setIssues([]);
    setSignals({});
  }, []);

  return { issues, loading, error, signals, refetch: fetchData, clearHistory };
}
