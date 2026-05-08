import { createFileRoute, Link, Outlet, notFound, useLocation, useRouter } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LogOut, Sparkles } from "lucide-react";
import { LockScreen } from "@/components/winpro/LockScreen";
import { Particles } from "@/components/winpro/Particles";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { CategoryTabs } from "@/components/winpro/CategoryTabs";
import { PredictorRow } from "@/components/winpro/PredictorRow";
import { useGameData } from "@/hooks/useGameData";
import { getGame } from "@/lib/games.config";
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
        <h1 className="font-display text-4xl gradient-text">Unknown game</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">← Back home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="grid min-h-screen place-items-center text-center px-4">
        <div>
          <h1 className="font-display text-2xl text-destructive">Failed to load</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
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
    <div className="relative min-h-screen pb-12">
      <Particles count={14} />

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-border/40">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${cfg.accent} 35%, black), color-mix(in oklab, ${category.accent} 30%, black))` }}
        />
        <div className="absolute inset-0 -z-10 grid-pattern opacity-10" />
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to="/"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div
              className="grid size-9 shrink-0 place-items-center rounded-xl text-lg"
              style={{ background: `color-mix(in oklab, ${cfg.accent} 30%, transparent)`, border: `1px solid ${cfg.accent}` }}
            >
              {cfg.emoji}
            </div>
            <div className="min-w-0 leading-tight text-white">
              <div className="font-display text-sm font-extrabold uppercase tracking-[0.22em] truncate">{cfg.shortLabel}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-80 truncate">
                {category.label} · 10 Experts
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <LogOut className="size-3" /> Lock
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
        <CategoryTabs gameId={gameId} active={category.id} />

        {/* Status strip */}
        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl border border-border/40 bg-card/40 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="size-3.5 shrink-0" style={{ color: category.accent }} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground truncate">
              Next Period
            </span>
            <span className="font-mono text-[11px] font-bold text-foreground/90 truncate">
              #{nextPeriod ? nextPeriod.slice(-10) : "————"}
            </span>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest shrink-0"
            style={{
              border: `1px solid color-mix(in oklab, ${error ? "var(--neon-red)" : "var(--neon-green)"} 40%, transparent)`,
              color: error ? "var(--neon-red)" : "var(--neon-green)",
            }}
          >
            <span
              className="size-1.5 rounded-full animate-pulse"
              style={{ background: error ? "var(--neon-red)" : "var(--neon-green)" }}
            />
            {error ? "OFFLINE" : "LIVE"}
          </span>
        </div>

        {/* Predictor list */}
        <section className="mt-5 space-y-3">
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

        <footer className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground backdrop-blur">
            <Sparkles className="size-3" style={{ color: category.accent }} />
            <span>SignalWin · 10 Expert Engine</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
