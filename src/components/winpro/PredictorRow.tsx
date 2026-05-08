import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, ShieldAlert, Target, X } from "lucide-react";
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.32), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/game/$gameId/$category/$predictorId"
        params={{ gameId, category, predictorId: predictor.id }}
        className={`group block ${restricted ? "opacity-60" : ""}`}
      >
        <div
          className="relative overflow-hidden rounded-[20px] p-[1.5px] transition-transform duration-300 group-hover:-translate-y-0.5"
          style={{
            background: restricted
              ? `linear-gradient(135deg, color-mix(in oklab, var(--neon-red) 50%, transparent), color-mix(in oklab, var(--neon-red) 5%, transparent) 45%, color-mix(in oklab, var(--neon-red) 35%, transparent))`
              : `linear-gradient(135deg, color-mix(in oklab, ${accent} 60%, transparent), color-mix(in oklab, ${accent} 5%, transparent) 45%, color-mix(in oklab, ${accent} 45%, transparent))`,
            boxShadow: restricted
              ? `0 8px 24px -14px color-mix(in oklab, var(--neon-red) 60%, transparent)`
              : `0 10px 32px -14px color-mix(in oklab, ${accent} 55%, transparent)`,
          }}
        >
          <div
            className="relative overflow-hidden rounded-[18px] p-3.5 sm:p-4"
            style={{ background: "var(--glass-strong-bg)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{ background: `radial-gradient(120% 80% at 100% 0%, color-mix(in oklab, ${accent} 22%, transparent), transparent 60%)` }}
            />

            {/* Top row: logo + name + hit rate */}
            <div className="relative flex items-center gap-3">
              <div className="relative shrink-0">
                <div
                  className="grid size-14 place-items-center overflow-hidden rounded-2xl p-[2px]"
                  style={{
                    background: `conic-gradient(from 180deg, ${predictor.brand}, color-mix(in oklab, ${predictor.brand} 25%, transparent), ${predictor.brand})`,
                  }}
                >
                  <div className="grid size-full place-items-center rounded-[14px] bg-background/80">
                    <img
                      src={predictor.logo}
                      alt={predictor.name}
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="size-11 object-contain"
                      style={{ filter: `drop-shadow(0 0 6px color-mix(in oklab, ${predictor.brand} 60%, transparent))` }}
                    />
                  </div>
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full text-[8px] font-black ring-2 ring-background"
                  style={{ background: predictor.brand, color: "#0b1020" }}
                >
                  {predictor.index + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[15px] font-extrabold tracking-tight text-foreground truncate">
                    {predictor.name}
                  </h3>
                  {restricted ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.18em]"
                      style={{
                        background: `color-mix(in oklab, var(--neon-red) 18%, transparent)`,
                        color: "var(--neon-red)",
                        border: `1px solid color-mix(in oklab, var(--neon-red) 40%, transparent)`,
                      }}
                    >
                      <ShieldAlert className="size-2.5" /> Restricted
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.18em]"
                      style={{
                        background: `color-mix(in oklab, ${accent} 16%, transparent)`,
                        color: accent,
                        border: `1px solid color-mix(in oklab, ${accent} 35%, transparent)`,
                      }}
                    >
                      Pro
                    </span>
                  )}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">
                  {predictor.tagline}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Hit Rate</div>
                <div
                  className="font-display text-2xl font-black leading-none"
                  style={{ color: accent, textShadow: `0 0 12px color-mix(in oklab, ${accent} 50%, transparent)` }}
                >
                  {hitRate}%
                </div>
              </div>
            </div>

            {/* Trend strip */}
            <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-border/40 bg-background/30 px-2.5 py-1.5">
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground shrink-0">Trend</span>
              <div className="flex flex-1 items-center gap-0.5 overflow-hidden">
                {trend.map((hit: boolean, i: number) => (
                  <div key={i} className="grid place-items-center" title={hit ? "WIN" : "LOSS"}>
                    {hit ? (
                      <Target
                        className="size-3"
                        style={{
                          color: accent,
                          filter: `drop-shadow(0 0 4px color-mix(in oklab, ${accent} 70%, transparent))`,
                        }}
                      />
                    ) : (
                      <X className="size-3 text-muted-foreground/40" />
                    )}
                  </div>
                ))}
              </div>
              <span className="font-mono text-[9px] font-bold tabular-nums text-muted-foreground shrink-0">
                {state.wins}W·{state.losses}L
              </span>
            </div>

            {/* Plan row */}
            <div className="relative mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Plan</span>
                {plan ? (
                  <PlanBadge category={category} plan={plan} accent={accent} />
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Loading…</span>
                )}
              </div>
              <div
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-foreground/80 transition group-hover:gap-1.5 group-hover:text-foreground"
                style={{ border: `1px solid color-mix(in oklab, ${accent} 35%, transparent)` }}
              >
                Open
                <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </div>
        </div>
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
