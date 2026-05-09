import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Activity,
  Sparkles,
  TrendingUp,
  Zap,
  Shield,
  Radio,
  Loader2,
} from "lucide-react";
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
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    setAuthed(!!sessionStorage.getItem("winpro_auth"));
  }, []);
  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />;
  return (
    <Home
      onLogout={() => {
        sessionStorage.removeItem("winpro_auth");
        setAuthed(false);
      }}
    />
  );
}

function Home({ onLogout }: { onLogout: () => void }) {
  const { latest } = Route.useLoaderData();
  const latestMap = new Map<string, LatestSummary>(latest.map((l: LatestSummary) => [l.id, l]));

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-8 text-foreground">
      <Particles count={44} />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-35 [mask-image:linear-gradient(to_bottom,#000_0%,transparent_78%)]" />

      <header className="relative mx-auto max-w-2xl px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="cyber-logo grid size-11 shrink-0 place-items-center rounded-2xl">
              <Sparkles className="cyber-icon size-5 text-primary" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="cyber-text font-display text-[17px] font-black text-foreground">
                SignalWin
              </div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                Official AI Signal Desk
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="grid size-10 place-items-center rounded-xl border border-border bg-card/70 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Lock"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        <section className="slide-up mt-5 overflow-hidden rounded-[1.65rem] border border-border bg-card/70 p-4 shadow-[var(--shadow-glass)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" /> Live Engine
                Active
              </div>
              <h1 className="mt-3 max-w-[16rem] font-display text-[28px] font-black leading-[1.05] text-foreground">
                Premium AI Signals
              </h1>
              <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
                9 live games, expert predictors, and round-by-round signal updates.
              </p>
            </div>
            <div className="grid size-[72px] shrink-0 place-items-center rounded-2xl border border-accent/30 bg-accent/10 shadow-[var(--shadow-neon-magenta)]">
              <Radio className="size-8 text-accent" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <HeaderStat icon={<TrendingUp className="size-3.5" />} value="85%" label="Accuracy" />
            <HeaderStat icon={<Zap className="size-3.5" />} value="9" label="Games" />
            <HeaderStat icon={<Shield className="size-3.5" />} value="24/7" label="Live" />
          </div>
        </section>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 pt-5">
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase text-primary">Game Market</div>
            <h2 className="mt-1 text-[18px] font-black leading-none text-foreground">
              Choose a Game
            </h2>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              Tap a market to open live predictor signals.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">
            <Activity className="size-3" /> LIVE
          </span>
        </div>

        <section className="space-y-2.5">
          {GAMES.map((g, index) => {
            const l = latestMap.get(g.id);
            const draw = l?.nextIssue ? l.nextIssue.slice(-10) : "Syncing";
            const lastVal = l?.lastSum ?? l?.lastNumber;
            const periodLabel = g.periodSec >= 60 ? `${g.periodSec / 60}M` : `${g.periodSec}S`;
            return (
              <Link
                key={g.id}
                to="/game/$gameId"
                params={{ gameId: g.id }}
                search={{ cat: "bs" }}
                preload="intent"
                className="group block overflow-hidden rounded-2xl border border-border bg-card/75 shadow-[var(--shadow-glass)] backdrop-blur-xl transition-all active:scale-[0.985] hover:border-primary/45"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="relative grid size-[54px] shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10">
                    <img src={GAME_ICONS[g.kind]} alt="" className="size-10" />
                    <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border border-background bg-primary text-[9px] font-black text-primary-foreground">
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate text-[15px] font-black text-foreground">
                        {g.shortLabel}
                      </h3>
                      <span className="shrink-0 rounded-md border border-accent/25 bg-accent/10 px-1.5 py-0.5 text-[9px] font-black text-accent">
                        {periodLabel}
                      </span>
                    </div>
                    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="size-1.5 shrink-0 rounded-full bg-primary animate-pulse" />
                      <span className="shrink-0">Next</span>
                      <span className="truncate font-mono text-foreground/85">#{draw}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-base font-black text-primary">
                      {lastVal ?? <Loader2 className="size-4 animate-spin" />}
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <footer className="pb-2 pt-6 text-center text-[11px] text-muted-foreground">
          SignalWin · Official AI Signal Engine
        </footer>
      </main>
    </div>
  );
}

function HeaderStat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/60 px-2 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[17px] font-black leading-none text-foreground">
        {icon}
        {value}
      </div>
      <div className="mt-1 text-[10px] font-semibold text-muted-foreground">{label}</div>
    </div>
  );
}
