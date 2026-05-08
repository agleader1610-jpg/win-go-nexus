import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Minus, ShieldAlert } from "lucide-react";
import {
  COLOR_TOKENS,
  hitRateFromState,
  trendFromState,
  type CategoryId,
  type Predictor,
  type PredictorPlan,
  type TraderState,
} from "@/lib/predictors";

export function PredictorRow({
  gameId,
  category,
  predictor,
  state,
  idx,
  accent,
}: {
  gameId: string;
  category: CategoryId;
  predictor: Predictor;
  state: TraderState;
  idx: number;
  accent: string;
}) {
  const hitRate = hitRateFromState(state, predictor.index);
  const trend = trendFromState(state, 10);
  const plan = state.pending?.plan;
  const restricted = state.isRestricted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.035, 0.28), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/game/$gameId/$category/$predictorId"
        params={{ gameId, category, predictorId: predictor.id }}
        className={`group block ${restricted ? "opacity-60" : ""}`}
      >
        <article
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-18px_rgba(0,0,0,0.5)] backdrop-blur transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-border group-hover:shadow-[0_12px_32px_-18px_rgba(0,0,0,0.6)]"
        >
          {/* subtle accent edge */}
          <span
            className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
            style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }}
          />

          {/* Header section */}
          <div className="flex items-center gap-3 px-4 pt-4">
            <div className="relative shrink-0">
              <div
                className="grid size-12 place-items-center overflow-hidden rounded-xl bg-background/60 ring-1"
                style={{ boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${predictor.brand} 35%, transparent)` }}
              >
                <img
                  src={predictor.logo}
                  alt={predictor.name}
                  width={44}
                  height={44}
                  loading="lazy"
                  decoding="async"
                  className="size-10 object-contain"
                />
              </div>
              <span
                className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full text-[9px] font-black ring-2 ring-card"
                style={{ background: predictor.brand, color: "#0b1020" }}
              >
                {predictor.index + 1}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground truncate">
                  {predictor.name}
                </h3>
                {restricted ? (
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-px font-mono text-[8px] font-bold uppercase tracking-[0.18em]"
                    style={{
                      background: `color-mix(in oklab, var(--neon-red) 16%, transparent)`,
                      color: "var(--neon-red)",
                    }}
                  >
                    <ShieldAlert className="size-2.5" /> Restricted
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-px font-mono text-[8px] font-bold uppercase tracking-[0.18em]"
                    style={{
                      background: `color-mix(in oklab, ${accent} 14%, transparent)`,
                      color: accent,
                    }}
                  >
                    Pro
                  </span>
                )}
              </div>
              <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground truncate">
                {predictor.tagline}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Hit Rate</div>
              <div
                className="font-display text-[22px] font-black leading-none tabular-nums"
                style={{ color: accent }}
              >
                {hitRate}%
              </div>
            </div>
          </div>

          {/* Trend strip — uniform pills */}
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2">
            <span className="font-mono text-[8.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground shrink-0">Trend</span>
            <div className="flex flex-1 items-center justify-end gap-1 flex-nowrap min-w-0">
              {trend.map((hit, i) => (
                <span
                  key={i}
                  className="grid size-4 place-items-center rounded-md shrink-0"
                  style={
                    hit
                      ? { background: `color-mix(in oklab, ${accent} 22%, transparent)`, color: accent }
                      : { background: `color-mix(in oklab, var(--neon-red) 14%, transparent)`, color: "color-mix(in oklab, var(--neon-red) 80%, white)" }
                  }
                  title={hit ? "WIN" : "LOSS"}
                >
                  {hit ? <Check className="size-3" strokeWidth={3} /> : <Minus className="size-3" strokeWidth={3} />}
                </span>
              ))}
            </div>
            <span className="font-mono text-[9px] font-bold tabular-nums text-muted-foreground shrink-0 pl-1">
              {state.wins}W·{state.losses}L
            </span>
          </div>

          {/* Plan row */}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/50 bg-background/30 px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Plan</span>
              {plan ? (
                <PlanBadge category={category} plan={plan} accent={accent} />
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Loading…</span>
              )}
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] transition-colors"
              style={{
                border: `1px solid color-mix(in oklab, ${accent} 38%, transparent)`,
                color: accent,
              }}
            >
              Open
              <ArrowUpRight className="size-3" />
            </span>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

export function PlanBadge({
  category,
  plan,
  accent,
  size = "sm",
}: {
  category: CategoryId;
  plan: PredictorPlan;
  accent: string;
  size?: "sm" | "md";
}) {
  const padX = size === "md" ? "px-3 py-1.5" : "px-2.5 py-1";
  const txt = size === "md" ? "text-[12px]" : "text-[10px]";
  const bubble = size === "md" ? "size-7 text-[12px]" : "size-6 text-[10px]";

  if (category === "bs" && plan.bs) {
    return (
      <span
        className={`inline-flex items-center rounded-full font-display font-extrabold uppercase tracking-[0.18em] text-white ${padX} ${txt}`}
        style={{
          background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 55%, transparent))`,
          boxShadow: `0 4px 16px -4px color-mix(in oklab, ${accent} 65%, transparent)`,
        }}
      >
        {plan.bs}
      </span>
    );
  }
  if (category === "color" && plan.color) {
    const c = COLOR_TOKENS[plan.color];
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-display font-extrabold uppercase tracking-[0.18em] text-white ${padX} ${txt}`}
        style={{
          background: `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 50%, black))`,
          boxShadow: `0 4px 16px -4px color-mix(in oklab, ${c} 65%, transparent)`,
        }}
      >
        <span className="size-2 rounded-full bg-white/90" />
        {plan.color}
      </span>
    );
  }
  if (plan.numbers) {
    return (
      <div className="flex items-center gap-1">
        {plan.numbers.map((n: number) => (
          <span
            key={n}
            className={`grid place-items-center rounded-full font-display font-black text-white ${bubble}`}
            style={{
              background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 55%, transparent))`,
              boxShadow: `0 3px 10px -3px color-mix(in oklab, ${accent} 65%, transparent)`,
            }}
          >
            {n}
          </span>
        ))}
      </div>
    );
  }
  return null;
}
