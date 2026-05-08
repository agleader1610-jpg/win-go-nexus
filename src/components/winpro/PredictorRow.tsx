import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight, Target, ShieldAlert } from "lucide-react";
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
        className={`block rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow ${restricted ? "opacity-70" : ""}`}
      >
        {/* Top: avatar, name, hit rate */}
        <div className="px-3 pt-3 pb-2.5 flex items-center gap-3">
          <div className="size-12 rounded-full overflow-hidden ring-2 ring-blue-100 dark:ring-slate-700 bg-white shrink-0">
            <img
              src={predictor.logo}
              alt={predictor.name}
              className="size-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 truncate">
                {predictor.name}
              </h3>
              {restricted ? (
                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <ShieldAlert className="size-2.5" /> Restricted
                </span>
              ) : (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                  Pro
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {predictor.tagline}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Hit Rate</div>
            <div className="text-xl font-bold leading-none text-blue-600 dark:text-blue-400 tabular-nums">
              {hitRate}%
            </div>
          </div>
        </div>

        {/* Trend strip */}
        <div className="mx-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">Trend</span>
          <div className="flex-1 flex items-center justify-end gap-px flex-nowrap min-w-0">
            {trend.map((hit, i) => (
              <span key={i} className="flex items-center gap-px shrink-0">
                {i > 0 && <span className="text-slate-300 dark:text-slate-600 text-[9px] px-px">{"<"}</span>}
                {hit ? (
                  <Target className="size-[14px] text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                ) : (
                  <span className="relative inline-grid place-items-center size-[14px]">
                    <Target className="size-[14px] text-slate-300 dark:text-slate-600" strokeWidth={2} />
                    <span className="absolute h-[1.5px] w-[18px] bg-slate-400 rotate-45 rounded" />
                  </span>
                )}
              </span>
            ))}
          </div>
          <span className="text-[10px] font-semibold tabular-nums text-slate-500 dark:text-slate-400 shrink-0 pl-1">
            {state.wins}W·{state.losses}L
          </span>
        </div>

        {/* Plan row */}
        <div className="px-3 py-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">Plan</span>
            {plan ? (
              <PlanBadge category={category} plan={plan} />
            ) : (
              <span className="text-xs text-slate-400">Loading…</span>
            )}
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">
            Open <ChevronRight className="size-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function PlanBadge({
  category,
  plan,
}: {
  category: CategoryId;
  plan: PredictorPlan;
}) {
  if (category === "bs" && plan.bs) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-semibold">
        {plan.bs}
      </span>
    );
  }
  if (category === "color" && plan.color) {
    const c = COLOR_TOKENS[plan.color];
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full text-white px-3 py-1 text-xs font-semibold capitalize"
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
            className="grid place-items-center size-7 rounded-full bg-blue-600 text-white text-xs font-bold"
          >
            {n}
          </span>
        ))}
      </div>
    );
  }
  return null;
}
