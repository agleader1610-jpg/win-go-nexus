import { createFileRoute, Link, Outlet, notFound, useLocation, useRouter } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LogOut, Activity } from "lucide-react";
import { LockScreen } from "@/components/winpro/LockScreen";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { PredictorRow } from "@/components/winpro/PredictorRow";
import { useGameData } from "@/hooks/useGameData";
import { getGame, GAME_ICONS } from "@/lib/games.config";
import { fetchGameData } from "@/lib/games.functions";
import { CATEGORIES, PREDICTORS, buildTraderState, getCategory, type CategoryId } from "@/lib/predictors";

const searchSchema = z.object({
  cat: fallback(z.enum(["bs", "color", "num5", "num7"]), "bs").default("bs"),
});

export const Route = createFileRoute("/game/$gameId")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ params }) => {
    try {
      const res = await fetchGameData({ data: { gameId: params.gameId } });
      if (res.ok) return { initial: res };
    } catch { /* ignore */ }
    return { initial: null };
  },
  head: ({ params }) => {
    const cfg = getGame(params.gameId);
    return {
      meta: [
        { title: cfg ? `${cfg.label} — SignalWin` : "Game — SignalWin" },
        { name: "description", content: cfg ? `Live AI signals from 10 expert predictors for ${cfg.label}.` : "Live AI lottery signals." },
      ],
    };
  },
  component: GamePage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <h1 className="text-3xl font-bold">Unknown game</h1>
        <Link to="/" className="mt-4 inline-block text-blue-600 underline">← Back home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="grid min-h-screen place-items-center text-center px-4">
        <div>
          <h1 className="text-2xl font-bold text-red-600">Failed to load</h1>
          <p className="mt-2 text-sm text-slate-600">{error.message}</p>
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >Retry</button>
        </div>
      </div>
    );
  },
});

function GamePage() {
  const { gameId } = Route.useParams();
  const location = useLocation();
  const cfg = getGame(gameId);
  if (!cfg) throw notFound();
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(!!sessionStorage.getItem("winpro_auth")); }, []);
  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />;
  const isPredictorDetail = location.pathname.split("/").filter(Boolean).length >= 4;
  if (isPredictorDetail) return <Outlet />;
  return <Dashboard onLogout={() => { sessionStorage.removeItem("winpro_auth"); setAuthed(false); }} />;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { gameId } = Route.useParams();
  const { cat } = Route.useSearch();
  const { initial } = Route.useLoaderData();
  const cfg = getGame(gameId)!;
  const category = getCategory(cat) ?? CATEGORIES[0];
  const { items, error } = useGameData(gameId, 4000, initial ?? undefined);

  const latest = items[0];
  const nextPeriod = useMemo(
    () => latest ? (BigInt(latest.issueNumber) + 1n).toString() : "",
    [latest],
  );

  const states = useMemo(
    () => PREDICTORS.map((p) =>
      buildTraderState(items, category.id as CategoryId, p.index, nextPeriod, gameId, cfg.kind, p.id),
    ),
    [items, category.id, nextPeriod, gameId, cfg.kind],
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Header — solid blue, matching detail page */}
      <header className="bg-blue-600 dark:bg-blue-700 text-white">
        <div className="mx-auto max-w-2xl px-4 pt-4 pb-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              aria-label="Back"
              className="grid size-9 place-items-center rounded-full hover:bg-white/15"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="text-lg font-semibold">{cfg.shortLabel}</h1>
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

          <div className="mt-5 flex items-center gap-3">
            <div className="size-14 rounded-2xl bg-white/15 grid place-items-center shrink-0">
              <img src={GAME_ICONS[cfg.kind]} alt="" className="size-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold">{cfg.label}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs opacity-90">
                <span className={`inline-block size-1.5 rounded-full ${error ? "bg-red-300" : "bg-emerald-300 animate-pulse"}`} />
                {error ? "Offline" : "Live"} · Period <span className="font-mono">#{nextPeriod ? nextPeriod.slice(-10) : "————"}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 -mt-3 space-y-3">
        {/* Category Tabs */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm p-1.5">
          <div className="grid grid-cols-4 gap-1">
            {CATEGORIES.map((c) => {
              const isActive = c.id === category.id;
              return (
                <Link
                  key={c.id}
                  to="/game/$gameId"
                  params={{ gameId }}
                  search={{ cat: c.id }}
                  replace
                  className={`grid place-items-center rounded-xl py-2.5 text-center transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="text-xs font-semibold">{c.shortLabel}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between pt-2 px-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Expert Predictors</h2>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <Activity className="size-3" /> 10 LIVE
          </span>
        </div>

        {/* Predictor list */}
        <section className="space-y-2.5">
          {PREDICTORS.map((p, i) => (
            <PredictorRow
              key={p.id}
              gameId={gameId}
              category={category.id as CategoryId}
              predictor={p}
              state={states[i]}
              idx={i}
              accent={category.accent}
            />
          ))}
        </section>

        <footer className="pt-6 text-center">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            SignalWin · 10 Expert AI Engine
          </div>
        </footer>
      </main>
    </div>
  );
}
