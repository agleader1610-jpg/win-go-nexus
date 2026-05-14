import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Sparkles, Activity, Crown, Loader2, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { BrandLogo } from "@/components/winpro/BrandLogo";
import { GAMES, GAME_ICONS, type GameKind } from "@/lib/games.config";
import { fetchAllLatest } from "@/lib/games.functions";
import type { LatestSummary } from "@/components/winpro/PredictionRow";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const res = await fetchAllLatest();
      if (res.ok) return { latest: res.latest as LatestSummary[] };
    } catch {
      /* ignore */
    }
    return { latest: [] as LatestSummary[] };
  },
  head: () => ({
    meta: [
      { title: "SignalWin — AI Lottery Signal Engine" },
      {
        name: "description",
        content: "Live AI prediction signals for WinGo, K3 Dice, and TrxWinGo.",
      },
      { property: "og:title", content: "SignalWin — AI Lottery Signal Engine" },
      {
        property: "og:description",
        content: "Live AI prediction signals for WinGo, K3 Dice, and TrxWinGo.",
      },
      { property: "og:url", content: "https://bdwin.eip.lat/" },
    ],
    links: [{ rel: "canonical", href: "https://bdwin.eip.lat/" }],
  }),
  component: HomePage,
});

function HomePage() {
  return <Home />;
}

const KIND_LABEL: Record<GameKind, string> = {
  wingo: "Color prediction",
  k3: "Dice prediction",
  trx_wingo: "Blockchain prediction",
};

function Home() {
  const { latest } = Route.useLoaderData();
  const latestMap = new Map<string, LatestSummary>(latest.map((l: LatestSummary) => [l.id, l]));
  const anyLive = latest.length > 0;

  return (
    <div className="relative min-h-screen bg-background pb-10 text-foreground">
      {/* very subtle ambient — keeps the bg almost-pure */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_70%)]" />

      {/* ===== Top bar ===== */}
      <header className="relative mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="flex items-center justify-between gap-2">
          <BrandLogo size="sm" />

          <div className="flex items-center gap-1.5">
            <span className="hidden xs:inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-primary">
              <Sparkles className="size-3" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                AI Powered
              </span>
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* status strip */}
        <div className="mt-4 flex items-center justify-between gap-3 border-y border-border/50 py-2">
          <div className="flex items-center gap-2">
            <Activity className="size-3.5 text-muted-foreground" />
            <span
              className={`font-mono text-[11px] font-bold uppercase tracking-[0.2em] ${
                anyLive ? "text-[var(--neon-green)]" : "text-destructive"
              }`}
            >
              <span
                className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${
                  anyLive ? "bg-[var(--neon-green)]" : "bg-destructive"
                } animate-pulse`}
              />
              {anyLive ? "Live" : "Offline"}
            </span>
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
            {anyLive ? `${latest.length} markets · sync` : "No data"}
          </span>
        </div>
      </header>

      {/* ===== Section: Prediction Games ===== */}
      <main className="relative mx-auto max-w-2xl px-4 pt-5 sm:px-6 sm:pt-6">
        <SectionHeader icon={<Sparkles className="size-3.5" />} label="Prediction Markets" />

        <section className="mt-3 space-y-2">
          {GAMES.map((g) => {
            const l = latestMap.get(g.id);
            const draw = l?.nextIssue ? l.nextIssue.slice(-8) : null;
            const lastVal = l?.lastSum ?? l?.lastNumber;
            const periodLabel = g.periodSec >= 60 ? `${g.periodSec / 60}M` : `${g.periodSec}S`;
            const isLive = !!l;

            return (
              <Link
                key={g.id}
                to="/game/$gameId"
                params={{ gameId: g.id }}
                search={{ cat: "bs" }}
                preload="intent"
                style={{ "--accent-color": g.accent } as React.CSSProperties}
                className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl transition-all hover:border-[color-mix(in_oklab,var(--accent-color)_55%,transparent)] active:scale-[0.99]"
              >
                {/* corner glow tinted by game accent */}
                <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-45"
                  style={{ background: "var(--accent-color)" }}
                />

                <div className="relative flex items-center gap-3 p-3 sm:gap-3.5 sm:p-3.5">
                  {/* icon block tinted by accent */}
                  <div
                    className="relative grid size-12 shrink-0 place-items-center rounded-xl border sm:size-14"
                    style={{
                      borderColor: "color-mix(in oklab, var(--accent-color) 35%, transparent)",
                      background: "color-mix(in oklab, var(--accent-color) 12%, transparent)",
                      boxShadow:
                        "0 0 24px -4px color-mix(in oklab, var(--accent-color) 35%, transparent)",
                    }}
                  >
                    <img src={GAME_ICONS[g.kind]} alt="" className="size-9 sm:size-10" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <h3 className="truncate text-[14px] font-extrabold leading-tight text-foreground sm:text-[16px]">
                        {g.shortLabel}
                      </h3>
                      <StatusPill
                        live={isLive}
                        accent={g.accent}
                        label={isLive ? "Active" : "Sync"}
                      />
                    </div>
                    <div className="mt-1 truncate font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                      {KIND_LABEL[g.kind]} · {periodLabel}
                    </div>
                    <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px]">
                      <span
                        className="size-1.5 shrink-0 rounded-full animate-pulse"
                        style={{ background: g.accent }}
                      />
                      <span
                        className="font-mono font-bold uppercase tracking-wider"
                        style={{ color: g.accent }}
                      >
                        {isLive ? "Live Now" : "Connecting"}
                      </span>
                      {draw && (
                        <span className="truncate font-mono text-foreground/60">· #{draw}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <div
                      className="grid size-9 place-items-center rounded-xl border font-mono text-[14px] font-bold sm:size-10 sm:text-[15px]"
                      style={{
                        borderColor:
                          "color-mix(in oklab, var(--accent-color) 35%, transparent)",
                        background:
                          "color-mix(in oklab, var(--accent-color) 12%, transparent)",
                        color: g.accent,
                      }}
                    >
                      {lastVal ?? <Loader2 className="size-4 animate-spin" />}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground sm:size-5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {/* ===== Featured strip (VIP-style accent card) ===== */}
        <div className="mt-5">
          <div
            className="relative overflow-hidden rounded-2xl border border-[var(--neon-amber)]/35 bg-[color-mix(in_oklab,var(--neon-amber)_8%,transparent)] p-3.5 backdrop-blur-xl sm:p-4"
            style={{
              boxShadow: "0 0 40px -8px color-mix(in oklab, var(--neon-amber) 30%, transparent)",
            }}
          >
            <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-[var(--neon-amber)] opacity-15 blur-2xl" />

            <div className="relative flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-[var(--neon-amber)]/40 bg-[var(--neon-amber)]/15 text-[var(--neon-amber)] sm:size-14">
                <Crown className="size-6 sm:size-7" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-[14px] font-extrabold text-foreground sm:text-[16px]">
                    Pro Predictors
                  </h3>
                  <span className="rounded-md border border-[var(--neon-amber)]/40 bg-[var(--neon-amber)]/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--neon-amber)]">
                    VIP
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                  10 expert engines · auto-ranked by win rate
                </p>
              </div>

              <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--neon-amber)]/40 bg-[var(--neon-amber)]/15 text-[var(--neon-amber)] sm:size-10">
                <Zap className="size-4 sm:size-5" />
              </div>
            </div>
          </div>
        </div>

        <footer className="pt-7 text-center sm:pt-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            SignalWin · AI Signal Desk · v2.0
          </div>
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-primary">{icon}</span>
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/85">
        {label}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-border via-border/60 to-transparent" />
    </div>
  );
}

function StatusPill({
  live,
  accent,
  label,
}: {
  live: boolean;
  accent: string;
  label: string;
}) {
  return (
    <span
      className="shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
      style={{
        borderColor: live
          ? `color-mix(in oklab, ${accent} 45%, transparent)`
          : "var(--border)",
        background: live
          ? `color-mix(in oklab, ${accent} 14%, transparent)`
          : "color-mix(in oklab, var(--muted) 50%, transparent)",
        color: live ? accent : "var(--muted-foreground)",
      }}
    >
      {label}
    </span>
  );
}
