import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, ShieldAlert, Target, X } from "lucide-react";
import { LockScreen } from "@/components/winpro/LockScreen";
import { Particles } from "@/components/winpro/Particles";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { PlanBadge } from "@/components/winpro/PredictorRow";
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
        <h1 className="font-display text-3xl gradient-text">Predictor not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">← Home</Link>
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
          <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground">Retry</button>
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
  const accent = cat.accent;
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
    <div className="relative min-h-screen pb-12">
      <Particles count={14} />

      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 50%, black), color-mix(in oklab, ${cfg.accent} 35%, black))` }}
        />
        <div className="absolute inset-0 -z-10 grid-pattern opacity-15" />

        <div className="mx-auto max-w-3xl px-4 pt-3 pb-5 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/game/$gameId"
              params={{ gameId }}
              search={{ cat: cat.id }}
              className="grid size-9 place-items-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="text-center text-white">
              <div className="font-display text-sm font-extrabold uppercase tracking-[0.22em]">
                {cfg.shortLabel} · {cat.shortLabel}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-80">Trader #{predictor.index + 1}</div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm hover:bg-white/25"
              >
                <LogOut className="size-3" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div
              className="grid size-20 place-items-center overflow-hidden rounded-2xl p-[3px] shrink-0"
              style={{
                background: `conic-gradient(from 180deg, ${predictor.brand}, color-mix(in oklab, ${predictor.brand} 25%, transparent), ${predictor.brand})`,
                boxShadow: `0 0 24px -4px color-mix(in oklab, ${predictor.brand} 65%, transparent)`,
              }}
            >
              <div className="grid size-full place-items-center rounded-2xl bg-background/85">
                <img
                  src={predictor.logo}
                  alt={predictor.name}
                  width={64}
                  height={64}
                  className="size-16 object-contain"
                  loading="eager"
                  style={{ filter: `drop-shadow(0 0 8px color-mix(in oklab, ${predictor.brand} 60%, transparent))` }}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-2xl font-black text-white truncate">{predictor.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 truncate">{predictor.tagline}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                  <span className="size-1.5 rounded-full bg-emerald-300" />
                  Hit Rate: {hitRate}%
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                  {state.wins}W · {state.losses}L
                </span>
                {state.isRestricted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/30 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-red-100 ring-1 ring-red-300/40 backdrop-blur-sm">
                    <ShieldAlert className="size-3" /> Restricted
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 pt-5 sm:px-6">
        {state.isRestricted && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-red-200">
            <ShieldAlert className="size-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <div className="font-display text-sm font-bold uppercase tracking-wider">Trader on cooldown</div>
              <div className="opacity-80">Recent streak too cold ({state.consecutiveLosses}× consecutive loss). Use signals with caution.</div>
            </div>
          </div>
        )}

        <section
          className="relative overflow-hidden rounded-2xl border bg-card/40 p-4 backdrop-blur"
          style={{ borderColor: `color-mix(in oklab, ${accent} 30%, transparent)` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid size-8 place-items-center rounded-full"
              style={{ background: `color-mix(in oklab, ${accent} 18%, transparent)`, color: accent }}
            >
              <Target className="size-4" />
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Trend (last 10)</span>
            <div className="ml-auto flex items-center gap-1">
              {trend.map((hit: boolean, i: number) => (
                <div key={i}>
                  {hit ? (
                    <Target
                      className="size-4"
                      style={{ color: accent, filter: `drop-shadow(0 0 6px color-mix(in oklab, ${accent} 70%, transparent))` }}
                    />
                  ) : (
                    <X className="size-4 text-muted-foreground/40" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <NextPeriodCard
          category={cat.id as CategoryId}
          accent={accent}
          nextPeriod={state.pending?.period || nextPeriod}
          periodSec={cfg.periodSec}
          plan={state.pending?.plan}
          confidence={state.pending?.confidence}
        />

        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-[0.25em] text-foreground">
            Past Performance
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Last {state.history.length}
          </span>
        </div>

        <section className="space-y-3">
          {state.history.length === 0 && (
            <div className="rounded-2xl border border-border/40 bg-card/30 p-6 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Not enough history yet…
            </div>
          )}
          {state.history.map((row, i) => (
            <motion.div
              key={row.period}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <HistoryRow row={row} category={cat.id as CategoryId} accent={accent} />
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}

function NextPeriodCard({
  category,
  accent,
  nextPeriod,
  periodSec,
  plan,
  confidence,
}: {
  category: CategoryId;
  accent: string;
  nextPeriod: string;
  periodSec: number;
  plan: import("@/lib/predictors").PredictorPlan | undefined;
  confidence: number | undefined;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-[1.5px]"
      style={{
        background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 20%, transparent) 50%, ${accent})`,
        boxShadow: `0 12px 36px -12px color-mix(in oklab, ${accent} 60%, transparent)`,
      }}
    >
      <div className="rounded-[14px] bg-card/85 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Period (Pending)</div>
            <div className="font-mono text-sm font-bold text-foreground truncate">{nextPeriod || "————"}</div>
          </div>
          <CountdownInline periodSec={periodSec} accent={accent} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Plan</span>
          {plan ? (
            <PlanBadge category={category} plan={plan} accent={accent} size="md" />
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Loading…</span>
          )}
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-background/20 px-3 py-2.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Confidence</span>
          <span className="font-display text-sm font-black tabular-nums" style={{ color: accent }}>
            {confidence != null ? `${confidence}%` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function CountdownInline({ periodSec, accent }: { periodSec: number; accent: string }) {
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
    <div
      className="grid place-items-center rounded-xl px-4 py-2 shrink-0"
      style={{
        background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 50%, black))`,
        boxShadow: `0 6px 20px -6px color-mix(in oklab, ${accent} 70%, transparent)`,
      }}
    >
      <span className="font-display text-2xl font-black text-white tabular-nums">{text}</span>
    </div>
  );
}

function HistoryRow({
  row,
  category,
  accent,
}: {
  row: TraderHistoryRow;
  category: CategoryId;
  accent: string;
}) {
  const win = row.result === "WIN";
  const statusColor = win ? "var(--neon-green)" : "var(--neon-red)";
  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-card/40 p-3.5 backdrop-blur"
      style={{ borderColor: win ? `color-mix(in oklab, var(--neon-green) 30%, transparent)` : `color-mix(in oklab, var(--neon-red) 22%, transparent)` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Period</div>
          <div className="font-mono text-[12px] font-bold text-foreground truncate">{row.period}</div>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-[0.22em] text-white"
          style={{
            background: `linear-gradient(135deg, ${statusColor}, color-mix(in oklab, ${statusColor} 50%, black))`,
            boxShadow: `0 4px 14px -4px color-mix(in oklab, ${statusColor} 60%, transparent)`,
          }}
        >
          {win ? <Target className="size-3" /> : <X className="size-3" />}
          {row.result}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border/40 bg-background/30 px-2.5 py-2">
          <div className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Plan</div>
          <div className="mt-1 flex items-center gap-1.5">
            <PlanBadge
              category={category}
              plan={
                category === "bs"
                  ? { display: row.prediction, bs: row.prediction as "Big" | "Small" }
                  : category === "color"
                  ? { display: row.prediction, color: row.prediction as "red" | "green" }
                  : { display: row.prediction, numbers: row.prediction.split(",").map((n) => parseInt(n, 10)) }
              }
              accent={accent}
            />
            {row.predictedNumber != null && (
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                ← #{row.predictedNumber}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/30 bg-background/20 px-2.5 py-2">
          <div className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Draw</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="grid size-7 place-items-center rounded-full font-display text-[12px] font-black text-white"
              style={{
                background: `linear-gradient(135deg, ${
                  row.actualColor ? COLOR_TOKENS[row.actualColor] : "var(--neon-cyan)"
                }, color-mix(in oklab, ${row.actualColor ? COLOR_TOKENS[row.actualColor] : "var(--neon-cyan)"} 50%, black))`,
              }}
            >
              {row.actualNumber}
            </span>
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: row.actualSide === "Big" ? "var(--neon-magenta)" : "var(--neon-cyan)" }}
            >
              {row.actualSide}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-background/20 px-2.5 py-1.5">
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Confidence</span>
        <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color: accent }}>
          {row.confidence}%
        </span>
      </div>
    </div>
  );
}
