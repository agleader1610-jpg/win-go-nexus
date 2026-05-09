import {
  createFileRoute,
  Link,
  Outlet,
  notFound,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo } from "react";
import { ArrowLeft, Activity, Loader2, Radio } from "lucide-react";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { Particles } from "@/components/winpro/Particles";
import { PredictorRow } from "@/components/winpro/PredictorRow";
import { useGameData } from "@/hooks/useGameData";
import { getGame, GAME_ICONS } from "@/lib/games.config";
import { fetchGameData } from "@/lib/games.functions";
import {
  CATEGORIES,
  PREDICTORS,
  buildTraderState,
  getCategory,
  type CategoryId,
} from "@/lib/predictors";

const searchSchema = z.object({
  cat: fallback(z.enum(["bs", "color", "num5", "num7"]), "bs").default("bs"),
});

function GameErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="grid min-h-screen place-items-center text-center px-4">
      <div>
        <h1 className="text-2xl font-bold text-red-600">Failed to load</h1>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/game/$gameId")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ params }) => {
    try {
      const res = await fetchGameData({ data: { gameId: params.gameId } });
      if (res.ok) return { initial: res };
    } catch {
      /* ignore */
    }
    return { initial: null };
  },
  head: ({ params }) => {
    const cfg = getGame(params.gameId);
    return {
      meta: [
        { title: cfg ? `${cfg.label} — SignalWin` : "Game — SignalWin" },
        {
          name: "description",
          content: cfg
            ? `Live AI signals from 10 expert predictors for ${cfg.label}.`
            : "Live AI lottery signals.",
        },
      ],
    };
  },
  component: GamePage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <h1 className="text-3xl font-bold">Unknown game</h1>
        <Link to="/" className="mt-4 inline-block text-blue-600 underline">
          ← Back home
        </Link>
      </div>
    </div>
  ),
  errorComponent: GameErrorComponent,
});

function GamePage() {
  const { gameId } = Route.useParams();
  const location = useLocation();
  const cfg = getGame(gameId);
  if (!cfg) throw notFound();
  const isPredictorDetail = location.pathname.split("/").filter(Boolean).length >= 4;
  if (isPredictorDetail) return <Outlet />;
  return <Dashboard />;
}

function Dashboard() {
  const { gameId } = Route.useParams();
  const { cat } = Route.useSearch();
  const { initial } = Route.useLoaderData();
  const cfg = getGame(gameId)!;
  const category = getCategory(cat) ?? CATEGORIES[0];
  const { items, loading, error } = useGameData(gameId, 4000, initial ?? undefined);

  const latest = items[0];
  const nextPeriod = useMemo(
    () => (latest ? (BigInt(latest.issueNumber) + 1n).toString() : ""),
    [latest],
  );

  const states = useMemo(
    () =>
      PREDICTORS.map((p) =>
        buildTraderState(
          items,
          category.id as CategoryId,
          p.index,
          nextPeriod,
          gameId,
          cfg.kind,
          p.id,
        ),
      ),
    [items, category.id, nextPeriod, gameId, cfg.kind],
  );

  // Pair predictors with state, hide restricted / 7+ consecutive losses, sort by wins desc
  const ranked = useMemo(() => {
    return PREDICTORS.map((p, i) => ({ predictor: p, state: states[i] }))
      .filter(({ state }) => !state.isRestricted && state.consecutiveLosses < 7)
      .sort((a, b) => {
        if (b.state.wins !== a.state.wins) return b.state.wins - a.state.wins;
        return a.state.losses - b.state.losses;
      });
  }, [states]);

  const hiddenCount = PREDICTORS.length - ranked.length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-8 text-foreground">
      <Particles count={36} seed={2026} />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30 [mask-image:linear-gradient(to_bottom,#000_0%,transparent_72%)]" />

      <header className="relative mx-auto max-w-2xl px-4 pt-4">
        <div className="overflow-hidden rounded-b-[1.75rem] border border-border bg-card/75 p-4 shadow-[var(--shadow-glass)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              aria-label="Back"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="min-w-0 text-center">
              <h1 className="truncate font-display text-[16px] font-black text-foreground">
                {cfg.shortLabel}
              </h1>
              <div className="text-[10px] font-bold uppercase text-muted-foreground">
                Signal Market
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 shadow-[var(--shadow-neon-cyan)]">
              <img src={GAME_ICONS[cfg.kind]} alt="" className="size-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-[18px] font-black text-foreground">{cfg.label}</div>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] text-muted-foreground">
                <span
                  className={`inline-block size-1.5 shrink-0 rounded-full ${error ? "bg-destructive" : "bg-primary animate-pulse"}`}
                />
                <span className="shrink-0">
                  {error ? "Reconnecting" : loading ? "Syncing" : "Live"}
                </span>
                <span className="shrink-0">· Period</span>
                <span className="truncate font-mono text-foreground/85">
                  #{nextPeriod ? nextPeriod.slice(-10) : "————"}
                </span>
              </div>
            </div>
            <div className="hidden shrink-0 sm:grid size-12 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
              {loading ? <Loader2 className="size-5 animate-spin" /> : <Radio className="size-5" />}
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 pt-4 space-y-4">
        <div className="rounded-2xl border border-border bg-card/75 p-1.5 shadow-[var(--shadow-glass)] backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map((c) => {
              const isActive = c.id === category.id;
              return (
                <Link
                  key={c.id}
                  to="/game/$gameId"
                  params={{ gameId }}
                  search={{ cat: c.id }}
                  replace
                  className={`grid min-h-11 place-items-center rounded-xl px-1 text-center transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-neon-cyan)]"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }`}
                >
                  <span className="text-[11px] font-black leading-none">{c.shortLabel}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {(loading || error) && (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/65 px-3 py-2.5 text-[12px] font-semibold text-muted-foreground backdrop-blur-xl">
            <Loader2
              className={`size-4 ${loading ? "animate-spin text-primary" : "text-destructive"}`}
            />
            {loading
              ? "Loading live signals…"
              : "Live feed is reconnecting. Cached signals stay visible."}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase text-primary">{category.label}</div>
            <h2 className="mt-1 text-[18px] font-black leading-none text-foreground">
              Expert Predictors
            </h2>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 t-eyebrow text-primary">
            <Activity className="size-3" /> {ranked.length} LIVE
          </span>
        </div>

        <section className="space-y-2.5">
          {ranked.map(({ predictor, state }, i) => (
            <PredictorRow
              key={predictor.id}
              gameId={gameId}
              category={category.id as CategoryId}
              predictor={predictor}
              state={state}
              idx={i}
              accent={category.accent}
            />
          ))}
        </section>

        {hiddenCount > 0 && (
          <div className="rounded-2xl border border-border/60 bg-card/50 px-3 py-2.5 text-center t-meta">
            {hiddenCount} predictor{hiddenCount > 1 ? "s" : ""} auto-hidden · low accuracy or
            restricted
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="rounded-2xl border border-border bg-card/70 p-4 text-center t-body text-muted-foreground">
            Live data is syncing. Signals will appear automatically.
          </div>
        )}

        <footer className="pb-2 pt-3 text-center text-[11px] text-muted-foreground">
          SignalWin · 10 Expert AI Engine
        </footer>
      </main>
    </div>
  );
}
