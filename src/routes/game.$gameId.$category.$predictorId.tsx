import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Target, X } from "lucide-react";
import { LockScreen } from "@/components/winpro/LockScreen";
import { Particles } from "@/components/winpro/Particles";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { PlanBadge } from "@/components/winpro/PredictorRow";
import { useGameData } from "@/hooks/useGameData";
import { getGame } from "@/lib/games.config";
import { fetchGameData } from "@/lib/games.functions";
import {
  avatarUrl,
  buildPredictorPlan,
  buildTrend,
  getCategory,
  getHitRate,
  getPredictor,
  COLOR_TOKENS,
  type CategoryId,
} from "@/lib/predictors";

export const Route = createFileRoute("/game/$gameId/$category/$predictorId")({
  loader: async ({ params }) => {
    try {
      const res = await fetchGameData({ data: { gameId: params.gameId } });
      if (res.ok) return { initial: res };
    } catch {
      // ignore
    }
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

function actualForPeriod(
  category: CategoryId,
  kind: ReturnType<typeof getGame> extends infer T ? T extends { kind: infer K } ? K : never : never,
  item: { number: string; sum: number; color: string } | undefined,
): { display: string; bs?: "Big" | "Small"; color?: "red" | "green" | "violet"; numbers?: number[] } | null {
  if (!item) return null;
  const num = parseInt(item.number || "0", 10);
  const sum = item.sum ?? 0;
  if (category === "bs") {
    const isBig = kind === "k3" ? sum >= 11 : num >= 5;
    const v = isBig ? "Big" as const : "Small" as const;
    return { display: v, bs: v };
  }
  if (category === "color") {
    const raw = (item.color || "").toLowerCase();
    let c: "red" | "green" | "violet" = "green";
    if (raw.includes("red")) c = "red";
    else if (raw.includes("violet") || raw.includes("purple")) c = "violet";
    else if (raw.includes("green")) c = "green";
    return { display: c, color: c };
  }
  return { display: String(num), numbers: [num] };
}

function planMatchesActual(
  plan: ReturnType<typeof buildPredictorPlan>,
  actual: ReturnType<typeof actualForPeriod>,
  category: CategoryId,
): boolean {
  if (!actual) return false;
  if (category === "bs") return plan.bs === actual.bs;
  if (category === "color") return plan.color === actual.color;
  if (plan.numbers && actual.numbers) return plan.numbers.includes(actual.numbers[0]);
  return false;
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
  const hitRate = getHitRate(gameId, cat.id, predictor.id);
  const trend = buildTrend(gameId, cat.id, predictor.id, latest?.issueNumber ?? predictor.id, 10);

  const nextPlan = buildPredictorPlan(gameId, cat.id, predictor.id, nextPeriod || predictor.id);

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
              className="grid size-20 place-items-center overflow-hidden rounded-full p-[3px] shrink-0"
              style={{
                background: `conic-gradient(from 180deg, ${accent}, color-mix(in oklab, ${accent} 25%, transparent), ${accent})`,
                boxShadow: `0 0 24px -4px color-mix(in oklab, ${accent} 65%, transparent)`,
              }}
            >
              <img
                src={avatarUrl(predictor.avatarSeed)}
                alt={predictor.name}
                className="size-full rounded-full bg-background object-cover"
                loading="eager"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-2xl font-black text-white truncate">{predictor.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 truncate">{predictor.tagline}</div>
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-emerald-300" />
                Hit Rate: {hitRate}%
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 pt-5 sm:px-6">
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
              {trend.map((hit, i) => (
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
          nextPeriod={nextPeriod}
          periodSec={cfg.periodSec}
          plan={nextPlan}
        />

        <section className="space-y-3">
          {items.slice(0, 20).map((item, i) => {
            const plan = buildPredictorPlan(gameId, cat.id as CategoryId, predictor.id, item.issueNumber);
            const actual = actualForPeriod(cat.id as CategoryId, cfg.kind, item);
            const hit = planMatchesActual(plan, actual, cat.id as CategoryId);
            return (
              <motion.div
                key={item.issueNumber}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <PastPeriodCard
                  category={cat.id as CategoryId}
                  accent={accent}
                  period={item.issueNumber}
                  plan={plan}
                  actual={actual}
                  hit={hit}
                />
              </motion.div>
            );
          })}
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
}: {
  category: CategoryId;
  accent: string;
  nextPeriod: string;
  periodSec: number;
  plan: ReturnType<typeof buildPredictorPlan>;
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
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Period</div>
            <div className="font-mono text-sm font-bold text-foreground truncate">{nextPeriod || "————"}</div>
          </div>
          <CountdownInline periodSec={periodSec} accent={accent} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Plan</span>
          <PlanBadge category={category} plan={plan} accent={accent} size="md" />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-background/20 px-3 py-2.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Draw</span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">Pending…</span>
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

function PastPeriodCard({
  category,
  accent,
  period,
  plan,
  actual,
  hit,
}: {
  category: CategoryId;
  accent: string;
  period: string;
  plan: ReturnType<typeof buildPredictorPlan>;
  actual: ReturnType<typeof actualForPeriod>;
  hit: boolean;
}) {
  const statusColor = hit ? accent : "var(--muted-foreground)";
  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-card/40 p-4 backdrop-blur"
      style={{ borderColor: hit ? `color-mix(in oklab, ${accent} 35%, transparent)` : "color-mix(in oklab, var(--foreground) 10%, transparent)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Period</div>
          <div className="font-mono text-sm font-bold text-foreground truncate">{period}</div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Plan</span>
            <PlanBadge category={category} plan={plan} accent={accent} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-background/20 px-3 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Draw</span>
            <DrawDisplay category={category} actual={actual} />
          </div>
        </div>

        <div
          className="grid size-16 shrink-0 place-items-center rounded-2xl"
          style={{
            background: hit
              ? `radial-gradient(circle at 40% 30%, color-mix(in oklab, ${accent} 30%, transparent), color-mix(in oklab, ${accent} 5%, transparent))`
              : "color-mix(in oklab, var(--foreground) 6%, transparent)",
            border: hit ? `1px solid color-mix(in oklab, ${accent} 50%, transparent)` : "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
            boxShadow: hit ? `0 0 18px -4px color-mix(in oklab, ${accent} 60%, transparent)` : "none",
          }}
        >
          {hit ? (
            <Target className="size-8" style={{ color: statusColor, filter: `drop-shadow(0 0 6px color-mix(in oklab, ${accent} 70%, transparent))` }} />
          ) : (
            <X className="size-8 text-muted-foreground/40" />
          )}
        </div>
      </div>
    </div>
  );
}

function DrawDisplay({
  category,
  actual,
}: {
  category: CategoryId;
  actual: ReturnType<typeof actualForPeriod>;
}) {
  if (!actual) {
    return <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">—</span>;
  }
  if (category === "bs" && actual.bs) {
    const c = actual.bs === "Big" ? "var(--neon-magenta)" : "var(--neon-cyan)";
    return (
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-[0.18em] text-white"
        style={{ background: `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 50%, black))` }}
      >
        {actual.bs}
      </span>
    );
  }
  if (category === "color" && actual.color) {
    const c = COLOR_TOKENS[actual.color];
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-[0.18em] text-white"
        style={{ background: `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 50%, black))` }}
      >
        <span className="size-2 rounded-full bg-white/90" />
        {actual.color}
      </span>
    );
  }
  if (actual.numbers) {
    return (
      <span
        className="grid size-7 place-items-center rounded-full font-display text-[12px] font-black text-white"
        style={{ background: "linear-gradient(135deg, var(--neon-cyan), color-mix(in oklab, var(--neon-cyan) 50%, black))" }}
      >
        {actual.numbers[0]}
      </span>
    );
  }
  return <span className="font-mono text-[10px] uppercase text-muted-foreground">—</span>;
}
