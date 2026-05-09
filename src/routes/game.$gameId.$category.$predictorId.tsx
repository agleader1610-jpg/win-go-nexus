import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShieldAlert, Target, X, Loader2, Clock3 } from "lucide-react";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { Particles } from "@/components/winpro/Particles";
import { useGameData } from "@/hooks/useGameData";
import { getGame } from "@/lib/games.config";
import { fetchGameData } from "@/lib/games.functions";
import {
  buildTraderState,
  getCategory,
  getPredictor,
  hitRateFromState,
  trendFromState,
  COLOR_TOKENS,
  type CategoryId,
  type PredictorPlan,
  type TraderHistoryRow,
} from "@/lib/predictors";

function PredictorErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="grid min-h-screen place-items-center text-center px-4">
      <div>
        <h1 className="text-2xl font-bold text-red-600">Failed to load</h1>
        <p className="mt-2 text-sm text-gray-600">{error.message}</p>
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

export const Route = createFileRoute("/game/$gameId/$category/$predictorId")({
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
    const cat = getCategory(params.category);
    const p = getPredictor(params.predictorId);
    return {
      meta: [
        {
          title: `${p?.name ?? "Predictor"} · ${cat?.shortLabel ?? ""} · ${cfg?.shortLabel ?? "SignalWin"}`,
        },
        {
          name: "description",
          content: `${p?.name ?? "Expert"} live signals for ${cfg?.label ?? "lottery"} (${cat?.label ?? ""}).`,
        },
      ],
    };
  },
  component: PredictorPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center px-4">
      <div>
        <h1 className="text-3xl font-bold">Predictor not found</h1>
        <Link to="/" className="mt-4 inline-block text-blue-600 underline">
          ← Home
        </Link>
      </div>
    </div>
  ),
  errorComponent: PredictorErrorComponent,
});

function PredictorPage() {
  const { gameId, category, predictorId } = Route.useParams();
  const cfg = getGame(gameId);
  const cat = getCategory(category);
  const predictor = getPredictor(predictorId);
  if (!cfg || !cat || !predictor) throw notFound();

  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    setAuthed(!!sessionStorage.getItem("winpro_auth"));
  }, []);
  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />;
  return (
    <Detail
      onLogout={() => {
        sessionStorage.removeItem("winpro_auth");
        setAuthed(false);
      }}
    />
  );
}

function Detail({ onLogout }: { onLogout: () => void }) {
  const { gameId, category, predictorId } = Route.useParams();
  const { initial } = Route.useLoaderData();
  const cfg = getGame(gameId)!;
  const cat = getCategory(category)!;
  const predictor = getPredictor(predictorId)!;
  const { items, loading, error } = useGameData(gameId, 4000, initial ?? undefined);

  const latest = items[0];
  const nextPeriod = useMemo(
    () => (latest ? (BigInt(latest.issueNumber) + 1n).toString() : ""),
    [latest],
  );

  const state = useMemo(
    () =>
      buildTraderState(
        items,
        cat.id as CategoryId,
        predictor.index,
        nextPeriod,
        gameId,
        cfg.kind,
        predictor.id,
      ),
    [items, cat.id, predictor.index, nextPeriod, gameId, cfg.kind, predictor.id],
  );

  const hitRate = hitRateFromState(state, predictor.index);
  const trend = trendFromState(state, 10);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-8 text-foreground">
      <Particles count={34} seed={4040} />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30 [mask-image:linear-gradient(to_bottom,#000_0%,transparent_74%)]" />

      <header className="relative mx-auto max-w-2xl px-4 pt-4">
        <div className="overflow-hidden rounded-b-[1.75rem] border border-border bg-card/75 p-4 shadow-[var(--shadow-glass)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/game/$gameId"
              params={{ gameId }}
              search={{ cat: cat.id }}
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="min-w-0 text-center">
              <h1 className="truncate font-display text-[15px] font-black text-foreground">
                {cfg.shortLabel} · {cat.shortLabel}
              </h1>
              <div className="text-[10px] font-bold uppercase text-muted-foreground">
                Predictor Detail
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle />
              <button
                onClick={onLogout}
                className="grid size-10 place-items-center rounded-xl border border-border bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Logout"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-primary/30 bg-secondary/60 shadow-[var(--shadow-neon-cyan)]">
              <img src={predictor.logo} alt={predictor.name} className="size-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-xl font-black text-foreground">{predictor.name}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className={`size-1.5 rounded-full ${error ? "bg-destructive" : "bg-primary animate-pulse"}`}
                />
                {error ? "Reconnecting" : loading ? "Syncing live feed" : predictor.tagline}
              </div>
              {state.isRestricted && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-destructive/25 bg-destructive/10 px-2 py-0.5 text-[10px] font-black uppercase text-destructive">
                  <ShieldAlert className="size-3" /> Restricted
                </span>
              )}
            </div>
            <div className="shrink-0 rounded-2xl border border-primary/25 bg-primary/10 px-3 py-2 text-right">
              <div className="text-[9px] font-black uppercase text-muted-foreground">Hit Rate</div>
              <div className="text-2xl font-black leading-none text-primary">{hitRate}%</div>
              <div className="mt-1 text-[10px] font-bold text-muted-foreground">
                {state.wins}W · {state.losses}L
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 pt-4 space-y-3">
        {(loading || error) && (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/65 px-3 py-2.5 text-[12px] font-semibold text-muted-foreground backdrop-blur-xl">
            <Loader2
              className={`size-4 ${loading ? "animate-spin text-primary" : "text-destructive"}`}
            />
            {loading ? "Loading signal detail…" : "Live feed is reconnecting."}
          </div>
        )}

        <section className="flex items-center gap-2 rounded-2xl border border-border bg-card/75 px-3 py-3 shadow-[var(--shadow-glass)] backdrop-blur-xl">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10">
            <Target className="size-4 text-primary" />
          </div>
          <span className="shrink-0 text-sm font-black text-foreground">Trend</span>
          <div className="flex-1 flex items-center justify-end gap-px flex-nowrap min-w-0">
            {trend.map((hit, i) => (
              <span key={i} className="flex items-center gap-px shrink-0">
                {i > 0 && <span className="px-px text-[9px] text-muted-foreground/55">{"<"}</span>}
                {hit ? (
                  <Target className="size-[14px] text-primary" strokeWidth={2.5} />
                ) : (
                  <span className="relative inline-grid place-items-center size-[14px]">
                    <Target className="size-[14px] text-muted-foreground/45" strokeWidth={2} />
                    <span className="absolute h-[1.5px] w-[18px] rounded bg-muted-foreground/55 rotate-45" />
                  </span>
                )}
              </span>
            ))}
          </div>
        </section>

        <PendingCard
          category={cat.id as CategoryId}
          period={state.pending?.period || nextPeriod}
          periodSec={cfg.periodSec}
          plan={state.pending?.plan}
        />

        <div className="space-y-3 pt-2">
          {state.history.length === 0 && (
            <div className="rounded-2xl border border-border bg-card/70 p-6 text-center text-sm font-semibold text-muted-foreground">
              Signal history is syncing…
            </div>
          )}
          {state.history.map((row) => (
            <HistoryCard key={row.period} row={row} category={cat.id as CategoryId} />
          ))}
        </div>
      </main>
    </div>
  );
}

function PendingCard({
  category,
  period,
  periodSec,
  plan,
}: {
  category: CategoryId;
  period: string;
  periodSec: number;
  plan: PredictorPlan | undefined;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card/75 shadow-[var(--shadow-glass)] backdrop-blur-xl">
      <div className="px-4 pt-4 pb-3">
        <div className="text-base font-black text-foreground">
          Period{" "}
          <span className="font-mono text-primary">#{period ? period.slice(-12) : "————"}</span>
        </div>
      </div>
      <div className="flex items-stretch gap-3 border-t border-border px-4 py-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-14 text-[12px] font-black uppercase text-muted-foreground">
              Plan
            </span>
            {plan ? (
              <PlainPlan category={category} plan={plan} />
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" /> Loading
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="w-14 text-[12px] font-black uppercase text-muted-foreground">
              Draw
            </span>
            <span className="text-sm font-semibold text-muted-foreground">Pending</span>
          </div>
        </div>
        <Countdown periodSec={periodSec} />
      </div>
    </section>
  );
}

function Countdown({ periodSec }: { periodSec: number }) {
  const [remaining, setRemaining] = useState(periodSec);
  useEffect(() => {
    const tick = () => {
      const sec = Math.floor(Date.now() / 1000);
      setRemaining(periodSec - (sec % periodSec));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [periodSec]);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const text = m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `00:${String(s).padStart(2, "0")}`;
  return (
    <div className="grid min-w-[96px] place-items-center rounded-2xl border border-primary/25 bg-primary/10 px-4 text-primary">
      <Clock3 className="mb-1 size-4" />
      <span className="text-2xl font-black tabular-nums">{text}</span>
    </div>
  );
}

function HistoryCard({ row, category }: { row: TraderHistoryRow; category: CategoryId }) {
  const win = row.result === "WIN";
  const plan: PredictorPlan =
    category === "bs"
      ? { display: row.prediction, bs: row.prediction as "Big" | "Small" }
      : category === "color"
        ? { display: row.prediction, color: row.prediction as "red" | "green" }
        : {
            display: row.prediction,
            numbers: row.prediction
              .split(",")
              .map((n) => parseInt(n, 10))
              .filter((n) => !isNaN(n)),
          };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card/75 shadow-[var(--shadow-glass)] backdrop-blur-xl">
      <div className="px-4 pt-4 pb-3">
        <div className="text-base font-black text-foreground">
          Period <span className="font-mono text-foreground/85">#{row.period.slice(-12)}</span>
        </div>
      </div>
      <div className="flex items-stretch gap-3 border-t border-border px-4 py-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-14 text-[12px] font-black uppercase text-muted-foreground">
              Plan
            </span>
            <PlainPlan category={category} plan={plan} />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-14 text-[12px] font-black uppercase text-muted-foreground">
              Draw
            </span>
            <DrawPill category={category} row={row} />
          </div>
        </div>
        <div
          className={`grid min-w-[96px] place-items-center rounded-2xl border px-4 ${win ? "border-primary/25 bg-primary/10 text-primary" : "border-destructive/25 bg-destructive/10 text-destructive"}`}
        >
          {win ? (
            <Target className="size-9" strokeWidth={2.5} />
          ) : (
            <X className="size-9" strokeWidth={2.5} />
          )}
        </div>
      </div>
    </section>
  );
}

function PlainPlan({ category, plan }: { category: CategoryId; plan: PredictorPlan }) {
  if (category === "bs" && plan.bs) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 font-black text-primary-foreground">
        {plan.bs}
      </span>
    );
  }
  if (category === "color" && plan.color) {
    return (
      <span
        className="inline-block size-5 rounded-full"
        style={{ background: COLOR_TOKENS[plan.color] }}
      />
    );
  }
  if (plan.numbers) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {plan.numbers.map((n) => (
          <span
            key={n}
            className="grid size-7 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground"
          >
            {n}
          </span>
        ))}
      </div>
    );
  }
  return null;
}

function DrawPill({ category, row }: { category: CategoryId; row: TraderHistoryRow }) {
  if (category === "color") {
    const c = row.actualColor ? COLOR_TOKENS[row.actualColor] : "#9ca3af";
    return (
      <span
        className="grid place-items-center size-7 rounded-full text-white text-sm font-bold"
        style={{ background: c }}
      >
        {row.actualNumber}
      </span>
    );
  }
  if (category === "bs") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
          {row.actualNumber}
        </span>
        <span className="font-bold text-foreground">{row.actualSide}</span>
      </span>
    );
  }
  return (
    <span className="grid size-7 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
      {row.actualNumber}
    </span>
  );
}
