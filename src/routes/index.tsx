import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, ChevronRight, Activity, Sparkles } from "lucide-react";
import { LockScreen } from "@/components/winpro/LockScreen";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { GAMES, GAME_ICONS } from "@/lib/games.config";
import { fetchAllLatest } from "@/lib/games.functions";
import type { LatestSummary } from "@/components/winpro/PredictionRow";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const res = await fetchAllLatest();
      if (res.ok) return { latest: res.latest as LatestSummary[] };
    } catch { /* ignore */ }
    return { latest: [] as LatestSummary[] };
  },
  head: () => ({
    meta: [
      { title: "SignalWin — AI Lottery Signal Engine" },
      { name: "description", content: "Live AI prediction signals for WinGo, K3 Dice, and TrxWinGo." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(!!sessionStorage.getItem("winpro_auth")); }, []);
  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />;
  return <Home onLogout={() => { sessionStorage.removeItem("winpro_auth"); setAuthed(false); }} />;
}

function Home({ onLogout }: { onLogout: () => void }) {
  const { latest } = Route.useLoaderData();
  const latestMap = new Map<string, LatestSummary>(latest.map((l: LatestSummary) => [l.id, l]));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Header */}
      <header className="bg-blue-600 dark:bg-blue-700 text-white">
        <div className="mx-auto max-w-2xl px-4 pt-4 pb-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-white/15">
                <Sparkles className="size-5" />
              </div>
              <div className="leading-tight">
                <div className="text-base font-bold tracking-tight">SignalWin</div>
                <div className="text-[10px] opacity-80">AI Predictor Engine</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={onLogout}
                className="grid size-9 place-items-center rounded-full hover:bg-white/15"
                aria-label="Lock"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-5">
            <h1 className="text-xl font-semibold leading-tight">Live Prediction Signals</h1>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs opacity-90">
              <span className="inline-block size-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Real-time · 24/7 · 9 Games Live
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <HeaderStat value="85%" label="Accuracy" />
            <HeaderStat value="9" label="Games" />
            <HeaderStat value="24/7" label="Uptime" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 -mt-4 space-y-3">
        {/* Section title */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Choose a Game</h2>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <Activity className="size-3" /> LIVE
          </span>
        </div>

        {/* Game list */}
        <div className="space-y-2.5">
          {GAMES.map((g) => {
            const l = latestMap.get(g.id);
            const draw = l?.nextIssue ? l.nextIssue.slice(-10) : "————";
            const lastVal = l?.lastSum ?? l?.lastNumber;
            const periodLabel = g.periodSec >= 60 ? `${g.periodSec / 60} Minute` : `${g.periodSec} Second`;
            return (
              <Link
                key={g.id}
                to="/game/$gameId"
                params={{ gameId: g.id }}
                className="block rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="px-3 py-3 flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 grid place-items-center shrink-0">
                    <img src={GAME_ICONS[g.kind]} alt="" className="size-9" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 truncate">
                        {g.shortLabel}
                      </h3>
                      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 rounded px-1.5 py-0.5">
                        {periodLabel}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                      Period <span className="font-mono text-slate-700 dark:text-slate-300">#{draw}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <div className="text-[9px] uppercase tracking-wider text-slate-400">Last</div>
                      <div className="grid place-items-center size-9 rounded-xl bg-blue-600 text-white font-bold text-base">
                        {lastVal ?? "—"}
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-slate-300 dark:text-slate-600" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <footer className="pt-6 text-center">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            SignalWin · AI Powered · Updated Live
          </div>
        </footer>
      </main>
    </div>
  );
}

function HeaderStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="mt-0.5 text-[10px] opacity-80">{label}</div>
    </div>
  );
}
