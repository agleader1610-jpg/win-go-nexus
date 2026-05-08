import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchGameData } from "@/lib/games.functions";
import type { ServerSignal } from "@/lib/games.server";
import { getGame } from "@/lib/games.config";

export interface GameItem {
  issueNumber: string;
  number: string;
  color: string;
  premium: string;
  sum: number;
  blockHash: string;
}

interface InitialPayload {
  data?: { list?: GameItem[] } | null;
  signals?: Record<string, ServerSignal>;
  fetchedAt?: number;
}

export function useGameData(gameId: string, refreshMs = 4000, initial?: InitialPayload) {
  const initialItems = (initial?.data?.list ?? []) as GameItem[];
  const initialSignals = (initial?.signals ?? {}) as Record<string, ServerSignal>;
  const [items, setItems] = useState<GameItem[]>(initialItems);
  const [signals, setSignals] = useState<Record<string, ServerSignal>>(initialSignals);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState(initial?.fetchedAt ?? 0);
  const fetchFn = useServerFn(fetchGameData);
  const lastIssueRef = useRef<string | null>(initialItems[0]?.issueNumber ?? null);
  const cfg = getGame(gameId);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchFn({ data: { gameId } });
      if (!res.ok) {
        setError(res.error ?? "fetch failed");
        return;
      }
      setItems((res.data?.list ?? []) as GameItem[]);
      setSignals((res.signals ?? {}) as Record<string, ServerSignal>);
      setLastSync(res.fetchedAt ?? Date.now());
      setError(null);
      const newest = res.data?.list?.[0]?.issueNumber;
      if (newest && newest !== lastIssueRef.current) lastIssueRef.current = newest;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, gameId]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const periodSec = cfg?.periodSec ?? 30;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document === "undefined" || !document.hidden) {
        await fetchData();
      }
      if (cancelled) return;
      const elapsed = Math.floor((Date.now() / 1000) % periodSec);
      const remaining = periodSec - elapsed;
      const burst = Math.min(6, Math.max(3, Math.floor(periodSec / 10)));
      const delay = remaining <= burst ? 1000 : Math.max(refreshMs, 2000);
      timer = setTimeout(tick, delay);
    };

    tick();
    const onVis = () => { if (!document.hidden) fetchData(); };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchData, refreshMs, cfg?.periodSec]);

  return { items, signals, loading, error, lastSync, refetch: fetchData };
}
