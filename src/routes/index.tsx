import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, ChevronRight, Activity, Sparkles, TrendingUp, Zap, Shield } from "lucide-react";
import { LockScreen } from "@/components/winpro/LockScreen";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { Particles } from "@/components/winpro/Particles";
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
      {/* Premium Header */}
      <header className="relative overflow-hidden text-white">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-700 dark:from-indigo-900 dark:via-blue-800 dark:to-violet-900" />
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-16 size-72 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 size-80 rounded-full bg-fuchsia-500/25 blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 75%)",
          }}
        />

        <div className="relative mx-auto max-w-2xl px-4 pt-4 pb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative grid size-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
                <Sparkles className="size-5" />
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-300 ring-2 ring-blue-600 animate-pulse" />
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

          <div className="mt-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
              <span className="inline-block size-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Live · Real-time signals
            </div>
            <h1 className="mt-2.5 text-[26px] font-bold leading-tight tracking-tight">
              Win smarter with{" "}
              <span className="bg-gradient-to-r from-cyan-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                AI signals
              </span>
            </h1>
            <p className="mt-1 text-xs opacity-80">
              Pro-grade predictions across 9 live games · updated every round
            </p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <HeaderStat icon={<TrendingUp className="size-3.5" />} value="85%" label="Accuracy" />
            <HeaderStat icon={<Zap className="size-3.5" />} value="9" label="Live Games" />
            <HeaderStat icon={<Shield className="size-3.5" />} value="24/7" label="Uptime" />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 -mt-6 space-y-3">
        {/* Section title */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Choose a Game</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Tap to view live predictor signals</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
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
                className="group relative block rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_10px_28px_-12px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 hover:ring-blue-200 dark:hover:ring-blue-900 transition-all overflow-hidden"
              >
                {/* Accent stripe */}
                <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-blue-500 to-violet-500 opacity-80" />
                <div className="pl-4 pr-3 py-3 flex items-center gap-3">
                  <div className="relative size-12 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/50 dark:to-violet-950/40 grid place-items-center shrink-0 ring-1 ring-blue-100 dark:ring-blue-900/50">
                    <img src={GAME_ICONS[g.kind]} alt="" className="size-9" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 truncate">
                        {g.shortLabel}
                      </h3>
                      <span className="text-[9px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-100 dark:ring-blue-900/60 rounded-md px-1.5 py-0.5">
                        {periodLabel}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Period <span className="font-mono text-slate-700 dark:text-slate-300">#{draw}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <div className="text-[9px] uppercase tracking-wider text-slate-400">Last</div>
                      <div className="grid place-items-center size-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white font-bold text-base shadow-md shadow-blue-600/30">
                        {lastVal ?? "—"}
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
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

function HeaderStat({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-lg font-bold leading-none">
        {icon}
        {value}
      </div>
      <div className="mt-1 text-[10px] opacity-80">{label}</div>
    </div>
  );
}
