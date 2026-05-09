import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight, Target, ShieldAlert, Loader2 } from "lucide-react";
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.03, 0.25), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/game/$gameId/$category/$predictorId"
        params={{ gameId, category, predictorId: predictor.id }}
        preload="intent"
        className={`group block overflow-hidden rounded-2xl border border-border bg-card/75 shadow-[var(--shadow-glass)] backdrop-blur-xl transition-all active:scale-[0.985] hover:border-primary/45 ${restricted ? "opacity-70" : ""}`}
      >
        <div className="flex items-center gap-3 px-3 pb-2.5 pt-3">
          <div className="size-12 shrink-0 overflow-hidden rounded-2xl border border-primary/25 bg-secondary/60 shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_25%,transparent)]">
            <img
              src={predictor.logo}
              alt={predictor.name}
              className="size-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[15px] font-black text-foreground">{predictor.name}</h3>
              {restricted ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-destructive/25 bg-destructive/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-destructive">
                  <ShieldAlert className="size-2.5" /> Restricted
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-primary">
                  Pro
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {predictor.tagline}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[9px] font-black uppercase text-muted-foreground">Hit Rate</div>
            <div className="text-xl font-black leading-none text-primary tabular-nums">
              {hitRate}%
            </div>
          </div>
        </div>

        <div className="mx-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/55 px-3 py-2">
          <span className="shrink-0 text-[10px] font-black uppercase text-muted-foreground">
            Trend
          </span>
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
          <span className="shrink-0 pl-1 text-[10px] font-black tabular-nums text-muted-foreground">
            {state.wins}W·{state.losses}L
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-border px-3 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 text-[11px] font-black uppercase text-muted-foreground">
              Plan
            </span>
            {plan ? (
              <PlanBadge category={category} plan={plan} />
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" /> Loading
              </span>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-black text-primary">
            Open <ChevronRight className="size-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function PlanBadge({ category, plan }: { category: CategoryId; plan: PredictorPlan }) {
  if (category === "bs" && plan.bs) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
        {plan.bs}
      </span>
    );
  }
  if (category === "color" && plan.color) {
    const c = COLOR_TOKENS[plan.color];
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black capitalize text-white"
        style={{ background: c }}
      >
        <span className="size-1.5 rounded-full bg-white/90" />
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
            className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground"
          >
            {n}
          </span>
        ))}
      </div>
    );
  }
  return null;
}
