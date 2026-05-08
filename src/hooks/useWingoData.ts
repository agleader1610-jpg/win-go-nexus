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
  const [lastSync, setLastSync] = useState<number>(0);
  const lastSeenRef = useRef<string | null>(null);
  const fetchHistory = useServerFn(fetchWingoHistory);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchHistory();
      if (!res.ok) {
        setError(res.error ?? "fetch failed");
        return;
      }
      const json = res.data as WingoApiResponse;
      const list = json?.data?.list ?? [];
      setIssues(list);
      setError(null);
      setLastSync(res.fetchedAt ?? Date.now());
      // Use server-generated deterministic signals so every viewer sees identical predictions.
      const serverSignals = (res.signals ?? {}) as Record<string, Signal>;
      setSignals((prev) => {
        // Server signals override; keep any extra local ones for resilience.
        const merged: Record<string, Signal> = { ...prev };
        for (const k of Object.keys(serverSignals)) {
          merged[k] = serverSignals[k];
        }
        return merged;
      });
      const newest = list[0]?.issueNumber;
      if (newest && newest !== lastSeenRef.current) {
        lastSeenRef.current = newest;
      }
      // Silence unused-var (confRange now lives server-side).
      void confRange;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [confRange, fetchHistory]);

  // Adaptive realtime polling: faster near period boundary, pauses when tab hidden.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document === "undefined" || !document.hidden) {
        await fetchData();
      }
      if (cancelled) return;
      const elapsed = Math.floor((Date.now() / 1000) % 30);
      const remaining = 30 - elapsed;
      // Burst polling in last 6 seconds (period flip), otherwise honor refreshMs (min 1500).
      const delay = remaining <= 6 ? 1000 : Math.max(refreshMs, 1500);
      timer = setTimeout(tick, delay);
    };

    tick();
    const onVis = () => { if (!document.hidden) fetchData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchData, refreshMs]);

  const clearHistory = useCallback(() => {
    setIssues([]);
    setSignals({});
  }, []);

  return { issues, loading, error, signals, lastSync, refetch: fetchData, clearHistory };
}

