import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Activity, Flame, Skull, TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";
import { AuthGate } from "@/components/winpro/AuthGate";
import { BrandLogo } from "@/components/winpro/BrandLogo";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { GAMES, GAME_ICONS, getGame } from "@/lib/games.config";
import { CATEGORIES, PREDICTORS, type CategoryId } from "@/lib/predictors";
import { computeFullStats, computePerPeriodResults } from "@/lib/ownerStats";
import { fetchAllHistory } from "@/lib/owner.functions";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner Analytics — SignalWin" },
      { name: "description", content: "Full backtest of every signal across the last 1000 records." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OwnerPage,
});

function OwnerPage() {
  return (
    <AuthGate>
      <OwnerDashboard />
    </AuthGate>
  );
}

function OwnerDashboard() {
  const fetchAll = useServerFn(fetchAllHistory);
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["owner", "all-history"],
    queryFn: () => fetchAll({}),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const [gameId, setGameId] = useState<string>(GAMES[0].id);
  const [cat, setCat] = useState<CategoryId>("bs");
  const [openTrader, setOpenTrader] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "W" | "L">("all");

  const cfg = getGame(gameId)!;
  const history = data?.history?.[gameId] ?? [];

  const rows = useMemo(() => {
    return PREDICTORS.map((p) => ({
      predictor: p,
      stats: computeFullStats(history, cat, p.index, gameId, cfg.kind, p.id),
    })).sort((a, b) => b.stats.winRate - a.stats.winRate);
  }, [history, cat, gameId, cfg.kind]);

  const totalRows = history.length;
  const aggWin = rows.reduce((s, r) => s + r.stats.wins, 0);
  const aggLoss = rows.reduce((s, r) => s + r.stats.losses, 0);
  const aggRate = aggWin + aggLoss > 0 ? Math.round((aggWin / (aggWin + aggLoss)) * 1000) / 10 : 0;

  return (
    <div className="relative min-h-screen bg-background pb-10 text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_15%,transparent),transparent_70%)]" />

      <header className="relative mx-auto max-w-3xl px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            aria-label="Back"
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground sm:size-10"
          >
            <ArrowLeft className="size-4 sm:size-5" />
          </Link>
          <BrandLogo size="sm" />
          <ThemeToggle />
        </div>

        <div className="mt-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/70 to-card/40 p-3.5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-primary">Owner Console</div>
              <h1 className="mt-1 text-[18px] font-black leading-none">Signal Backtest · Full History</h1>
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                {totalRows.toLocaleString()} rows loaded · {cfg.label}
              </div>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-primary disabled:opacity-50"
            >
              {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pt-4 space-y-3.5 sm:px-6">
        {/* Game selector */}
        <div className="rounded-2xl border border-border bg-card/75 p-1.5 shadow-[var(--shadow-glass)] backdrop-blur-xl">
          <div className="flex gap-1.5 overflow-x-auto">
            {GAMES.map((g) => {
              const active = g.id === gameId;
              return (
                <button
                  key={g.id}
                  onClick={() => setGameId(g.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-black uppercase tracking-wider transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-neon-cyan)]"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }`}
                >
                  <img src={GAME_ICONS[g.kind]} alt="" className="size-4" />
                  {g.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category selector */}
        <div className="rounded-2xl border border-border bg-card/75 p-1.5 backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map((c) => {
              const active = c.id === cat;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id as CategoryId)}
                  className={`grid min-h-11 place-items-center rounded-xl px-1 text-center transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-neon-cyan)]"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }`}
                >
                  <span className="text-[11px] font-black leading-none">{c.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Aggregate banner */}
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Total Win Rate" value={`${aggRate}%`} accent="var(--neon-green)" icon={<Activity className="size-3.5" />} />
          <Stat label="Wins" value={aggWin.toLocaleString()} accent="var(--neon-green)" icon={<TrendingUp className="size-3.5" />} />
          <Stat label="Losses" value={aggLoss.toLocaleString()} accent="var(--neon-red)" icon={<TrendingDown className="size-3.5" />} />
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-[12px] font-semibold text-destructive">
            Failed to load history. Try refresh.
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-border bg-card/65 px-3 py-6 text-center text-[12px] text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" /> Loading 1000-record backtest…
          </div>
        )}

        {/* Predictors table */}
        {!isLoading && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card/75 shadow-[var(--shadow-glass)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
              <div className="text-[11px] font-black uppercase tracking-wider text-foreground">
                {cfg.label} · {CATEGORIES.find((c) => c.id === cat)?.label}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{rows.length} traders</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/40">
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-3 py-2 font-mono">#</th>
                    <th className="px-2 py-2 font-mono">Trader</th>
                    <th className="px-2 py-2 text-right font-mono">Total</th>
                    <th className="px-2 py-2 text-right font-mono">W</th>
                    <th className="px-2 py-2 text-right font-mono">L</th>
                    <th className="px-2 py-2 text-right font-mono">WR%</th>
                    <th className="px-2 py-2 text-right font-mono"><Flame className="ml-auto size-3" /></th>
                    <th className="px-2 py-2 text-right font-mono"><Skull className="ml-auto size-3" /></th>
                    <th className="px-2 py-2 text-right font-mono">Now</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ predictor, stats }, i) => {
                    const wrColor = stats.winRate >= 60
                      ? "var(--neon-green)"
                      : stats.winRate >= 50
                        ? "var(--neon-amber)"
                        : "var(--neon-red)";
                    const streakColor = stats.currentStreak.kind === "W"
                      ? "var(--neon-green)"
                      : stats.currentStreak.kind === "L"
                        ? "var(--neon-red)"
                        : "var(--muted-foreground)";
                    return (
                      <tr
                        key={predictor.id}
                        onClick={() => setOpenTrader(openTrader === predictor.id ? null : predictor.id)}
                        className={`cursor-pointer border-t border-border hover:bg-primary/5 ${openTrader === predictor.id ? "bg-primary/10" : ""}`}
                      >
                        <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <img src={predictor.logo} alt="" className="size-6 rounded-md" />
                            <div className="min-w-0">
                              <div className="truncate text-[12px] font-bold text-foreground">{predictor.name}</div>
                              <div className="truncate text-[9.5px] text-muted-foreground">T{predictor.index + 1}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-[11px] text-foreground">{stats.total}</td>
                        <td className="px-2 py-2 text-right font-mono text-[11px]" style={{ color: "var(--neon-green)" }}>{stats.wins}</td>
                        <td className="px-2 py-2 text-right font-mono text-[11px]" style={{ color: "var(--neon-red)" }}>{stats.losses}</td>
                        <td className="px-2 py-2 text-right font-mono text-[12px] font-bold" style={{ color: wrColor }}>{stats.winRate}</td>
                        <td className="px-2 py-2 text-right font-mono text-[11px]" style={{ color: "var(--neon-green)" }}>{stats.maxWinStreak}</td>
                        <td className="px-2 py-2 text-right font-mono text-[11px]" style={{ color: "var(--neon-red)" }}>{stats.maxLossStreak}</td>
                        <td className="px-2 py-2 text-right font-mono text-[11px]" style={{ color: streakColor }}>
                          {stats.currentStreak.kind === "—" ? "—" : `${stats.currentStreak.kind}${stats.currentStreak.length}`}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-xs text-muted-foreground">No data.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border bg-secondary/30 px-3.5 py-2 text-[10px] text-muted-foreground">
              <span className="font-mono"><Flame className="mr-1 inline size-3" />= max win streak · <Skull className="mr-1 inline size-3" />= max loss streak · Now = current streak</span>
            </div>
          </div>
        )}

        <footer className="pb-2 pt-3 text-center text-[11px] text-muted-foreground">
          Owner Console · Internal use only
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/75 p-2.5 backdrop-blur-xl">
      <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-muted-foreground">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 font-mono text-[16px] font-black" style={{ color: accent }}>{value}</div>
    </div>
  );
}
