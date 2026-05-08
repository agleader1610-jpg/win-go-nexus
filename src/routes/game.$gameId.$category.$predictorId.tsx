import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LogOut, ShieldAlert, Target, X } from "lucide-react";
import { LockScreen } from "@/components/winpro/LockScreen";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
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

export const Route = createFileRoute("/game/$gameId/$category/$predictorId")({
  loader: async ({ params }) => {
    try {
      const res = await fetchGameData({ data: { gameId: params.gameId } });
      if (res.ok) return { initial: res };
    } catch { /* ignore */ }
    return { initial: null };
  },
  head: ({ params }) => {
    const cfg = getGame(params.gameId);
    const cat = getCategory(params.category);
    const p = getPredictor(params.predictorId);
    return {
      meta: [
        { title: `${p?.name ?? "Predictor"} · ${cat?.shortLabel ?? ""} · ${cfg?.shortLabel ?? "SignalWin"}` },
        { name: "description", content: `${p?.name ?? "Expert"} live signals for ${cfg?.label ?? "lottery"} (${cat?.label ?? ""}).` },
      ],
    };
  },
  component: PredictorPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center px-4">
      <div>
        <h1 className="text-3xl font-bold">Predictor not found</h1>
        <Link to="/" className="mt-4 inline-block text-blue-600 underline">← Home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="grid min-h-screen place-items-center text-center px-4">
        <div>
          <h1 className="text-2xl font-bold text-red-600">Failed to load</h1>
          <p className="mt-2 text-sm text-gray-600">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white">Retry</button>
        </div>
      </div>
    );
  },
});

function PredictorPage() {
  const { gameId, category, predictorId } = Route.useParams();
  const cfg = getGame(gameId);
  const cat = getCategory(category);
  const predictor = getPredictor(predictorId);
  if (!cfg || !cat || !predictor) throw notFound();

  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(!!sessionStorage.getItem("winpro_auth")); }, []);
  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />;
  return <Detail onLogout={() => { sessionStorage.removeItem("winpro_auth"); setAuthed(false); }} />;
}

function Detail({ onLogout }: { onLogout: () => void }) {
  const { gameId, category, predictorId } = Route.useParams();
  const { initial } = Route.useLoaderData();
  const cfg = getGame(gameId)!;
  const cat = getCategory(category)!;
  const predictor = getPredictor(predictorId)!;
  const { items } = useGameData(gameId, 4000, initial ?? undefined);

  const latest = items[0];
  const nextPeriod = useMemo(
    () => latest ? (BigInt(latest.issueNumber) + 1n).toString() : "",
    [latest],
  );

  const state = useMemo(
    () => buildTraderState(items, cat.id as CategoryId, predictor.index, nextPeriod, gameId, cfg.kind, predictor.id),
    [items, cat.id, predictor.index, nextPeriod, gameId, cfg.kind, predictor.id],
  );

  const hitRate = hitRateFromState(state, predictor.index);
  const trend = trendFromState(state, 10);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Solid blue header */}
      <header className="bg-blue-600 dark:bg-blue-700 text-white">
        <div className="mx-auto max-w-2xl px-4 pt-4 pb-6">
          <div className="flex items-center justify-between">
            <Link
              to="/game/$gameId"
              params={{ gameId }}
              search={{ cat: cat.id }}
              className="grid size-9 place-items-center rounded-full hover:bg-white/15"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="text-lg font-semibold">{cfg.shortLabel} {cat.shortLabel}</h1>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={onLogout}
                className="grid size-9 place-items-center rounded-full hover:bg-white/15"
                aria-label="Logout"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="size-16 rounded-full overflow-hidden ring-2 ring-white/40 bg-white shrink-0">
              <img src={predictor.logo} alt={predictor.name} className="size-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-semibold truncate">{predictor.name}</div>
              {state.isRestricted && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-100">
                  <ShieldAlert className="size-3" /> Restricted
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-medium">Hit Rate: <span className="font-bold">{hitRate}%</span></div>
              <div className="text-xs opacity-80 mt-0.5">{state.wins}W · {state.losses}L</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 -mt-3 space-y-3">
        {/* Trend bar */}
        <section className="rounded-2xl bg-rose-50 dark:bg-slate-900 px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="grid size-10 place-items-center rounded-full bg-rose-100 dark:bg-slate-800 shrink-0">
            <Target className="size-5 text-red-600" />
          </div>
          <span className="text-base font-medium text-slate-900 dark:text-slate-100">Trend</span>
          <div className="flex-1 flex items-center justify-end gap-1 flex-wrap">
            {trend.map((hit, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-400 text-xs">{"<"}</span>}
                {hit ? (
                  <Target className="size-5 text-blue-600" strokeWidth={2.5} />
                ) : (
                  <span className="relative inline-grid place-items-center size-5">
                    <Target className="size-5 text-slate-300 dark:text-slate-700" strokeWidth={2} />
                    <span className="absolute h-[2px] w-6 bg-slate-400 rotate-45 rounded" />
                  </span>
                )}
              </span>
            ))}
          </div>
        </section>

        {/* Pending period card */}
        <PendingCard
          category={cat.id as CategoryId}
          period={state.pending?.period || nextPeriod}
          periodSec={cfg.periodSec}
          plan={state.pending?.plan}
        />

        {/* History */}
        <div className="space-y-3 pt-2">
          {state.history.length === 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-500">
              Not enough history yet…
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
    <section className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="text-base font-bold text-slate-900 dark:text-slate-50">
          Period: <span className="font-mono">{period || "————"}</span>
        </div>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 flex items-stretch gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-slate-700 dark:text-slate-300 w-14">Plan</span>
            {plan ? <PlainPlan category={category} plan={plan} /> : <span className="text-slate-400 text-sm">Loading…</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-700 dark:text-slate-300 w-14">Draw</span>
            <span className="text-slate-500">Pending</span>
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
    <div className="grid place-items-center rounded-2xl bg-blue-600 text-white px-5 min-w-[100px]">
      <span className="text-3xl font-bold tabular-nums">{text}</span>
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
      : { display: row.prediction, numbers: row.prediction.split(",").map((n) => parseInt(n, 10)).filter((n) => !isNaN(n)) };

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="text-base font-bold text-slate-900 dark:text-slate-50">
          Period: <span className="font-mono">{row.period}</span>
        </div>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 flex items-stretch gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-slate-700 dark:text-slate-300 w-14">Plan</span>
            <PlainPlan category={category} plan={plan} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-700 dark:text-slate-300 w-14">Draw</span>
            <DrawPill category={category} row={row} />
          </div>
        </div>
        <div className="grid place-items-center rounded-2xl px-5 min-w-[100px]"
          style={{ background: win ? "#dcfce7" : "#fee2e2" }}>
          {win ? (
            <Target className="size-10" style={{ color: "#16a34a" }} strokeWidth={2.5} />
          ) : (
            <X className="size-10" style={{ color: "#dc2626" }} strokeWidth={2.5} />
          )}
        </div>
      </div>
    </section>
  );
}

function PlainPlan({ category, plan }: { category: CategoryId; plan: PredictorPlan }) {
  if (category === "bs" && plan.bs) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-600 text-white px-4 py-1 font-semibold">
        {plan.bs}
      </span>
    );
  }
  if (category === "color" && plan.color) {
    return <span className="inline-block size-5 rounded-full" style={{ background: COLOR_TOKENS[plan.color] }} />;
  }
  if (plan.numbers) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {plan.numbers.map((n) => (
          <span key={n} className="grid place-items-center size-7 rounded-full bg-blue-600 text-white text-sm font-bold">
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
      <span className="grid place-items-center size-7 rounded-full text-white text-sm font-bold" style={{ background: c }}>
        {row.actualNumber}
      </span>
    );
  }
  if (category === "bs") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="grid place-items-center size-7 rounded-full bg-blue-600 text-white text-sm font-bold">{row.actualNumber}</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">{row.actualSide}</span>
      </span>
    );
  }
  return (
    <span className="grid place-items-center size-7 rounded-full bg-blue-600 text-white text-sm font-bold">{row.actualNumber}</span>
  );
}
