import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, TrendingUp, Zap, Shield, Loader2, BadgeCheck } from "lucide-react";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { BrandLogo } from "@/components/winpro/BrandLogo";
import { GAMES, GAME_ICONS } from "@/lib/games.config";
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
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return <Home />;
}

function Home() {
  const { latest } = Route.useLoaderData();
  const latestMap = new Map<string, LatestSummary>(latest.map((l: LatestSummary) => [l.id, l]));

  return (
    <div className="relative min-h-screen bg-background pb-10 text-foreground">
      {/* Subtle ambient gradient — no particles, no busy grid */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_70%)]" />

      {/* ===== Top bar ===== */}
      <header className="relative mx-auto max-w-2xl px-5 pt-5">
        <div className="flex items-center justify-between">
          <BrandLogo size="md" />
          <ThemeToggle />
        </div>
      </header>

      {/* ===== Hero / status card ===== */}
      <section className="relative mx-auto mt-6 max-w-2xl px-5">
        <div className="slide-up relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-xl">
          {/* corner accent */}
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[var(--gradient-cyber)] opacity-20 blur-2xl" />

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 t-eyebrow text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Live Engine
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-secondary/60 px-2 py-1 t-eyebrow text-muted-foreground">
              <BadgeCheck className="size-3" /> Verified
            </span>
          </div>

          <h1 className="mt-4 t-h1 text-foreground">
            Premium AI <span className="gradient-text">Signal Desk</span>
          </h1>
          <p className="mt-2 max-w-md t-body text-muted-foreground">
            Round-by-round predictions across 9 live game markets, powered by an ensemble of expert
            engines.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <Stat icon={<TrendingUp className="size-3.5" />} value="85%" label="Accuracy" />
            <Stat icon={<Zap className="size-3.5" />} value="9" label="Markets" />
            <Stat icon={<Shield className="size-3.5" />} value="24/7" label="Live" />
          </div>
        </div>
      </section>

      {/* ===== Game list ===== */}
      <main className="relative mx-auto mt-7 max-w-2xl px-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <div className="t-eyebrow text-muted-foreground">Game Market</div>
            <h2 className="mt-1.5 t-h2 text-foreground">Choose a game</h2>
          </div>
          <span className="t-meta">Tap to open signal desk</span>
        </div>

        <section className="space-y-2">
          {GAMES.map((g) => {
            const l = latestMap.get(g.id);
            const draw = l?.nextIssue ? l.nextIssue.slice(-8) : "Syncing";
            const lastVal = l?.lastSum ?? l?.lastNumber;
            const periodLabel = g.periodSec >= 60 ? `${g.periodSec / 60}M` : `${g.periodSec}S`;
            return (
              <Link
                key={g.id}
                to="/game/$gameId"
                params={{ gameId: g.id }}
                search={{ cat: "bs" }}
                preload="intent"
                className="group relative block overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xl transition-all hover:border-primary/50 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 p-3.5">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-secondary/60">
                    <img src={GAME_ICONS[g.kind]} alt="" className="size-9" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate t-h3 text-foreground">{g.shortLabel}</h3>
                      <span className="shrink-0 rounded-md border border-border bg-secondary/60 px-1.5 py-0.5 t-eyebrow text-muted-foreground">
                        {periodLabel}
                      </span>
                    </div>
                    <div className="mt-1 flex min-w-0 items-center gap-1.5 t-meta">
                      <span className="size-1.5 shrink-0 rounded-full bg-primary animate-pulse" />
                      <span className="shrink-0">Next</span>
                      <span className="truncate t-num text-foreground/80">#{draw}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <div className="grid size-10 place-items-center rounded-xl border border-primary/25 bg-primary/10 t-num text-[15px] text-primary">
                      {lastVal ?? <Loader2 className="size-4 animate-spin" />}
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <footer className="pt-8 text-center">
          <div className="t-eyebrow text-muted-foreground">SignalWin</div>
          <div className="mt-1.5 t-meta">Official AI Signal Engine · v2.0</div>
        </footer>
      </main>
    </div>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/40 px-2 py-2.5 text-center">
      <div className="flex items-center justify-center gap-1 t-num text-[18px] leading-none text-foreground">
        <span className="text-primary">{icon}</span>
        {value}
      </div>
      <div className="mt-1.5 t-eyebrow text-muted-foreground">{label}</div>
    </div>
  );
}
