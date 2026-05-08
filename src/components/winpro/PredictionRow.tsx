import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TrendingUp, ExternalLink } from "lucide-react";
import { GAME_ICONS, type GameConfig } from "@/lib/games.config";

export interface LatestSummary {
  id: string;
  currentIssue: string;
  nextIssue: string;
  lastNumber: number | null;
  lastSum: number | null;
  lastColor: string | null;
}

export function PredictionRow({
  game,
  latest,
  idx,
}: {
  game: GameConfig;
  latest?: LatestSummary;
  idx: number;
}) {
  const periodLabel = game.periodSec >= 60 ? `${game.periodSec / 60}M` : `${game.periodSec}s`;
  const draw = latest?.nextIssue ? latest.nextIssue.slice(-8) : "— — — —";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.3) }}
      className="glass relative overflow-hidden rounded-2xl p-3 sm:p-4"
      style={{ boxShadow: `0 6px 24px color-mix(in oklab, ${game.accent} 15%, transparent)` }}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-25"
        style={{ background: `radial-gradient(circle, ${game.accent}, transparent 70%)` }}
      />

      <div className="relative flex items-center gap-3 sm:gap-4">
        {/* Icon */}
        <div
          className="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl sm:size-16"
          style={{
            background: `linear-gradient(135deg, color-mix(in oklab, ${game.accent} 30%, transparent), color-mix(in oklab, ${game.accent} 10%, transparent))`,
            border: `1px solid ${game.accent}`,
            boxShadow: `0 0 20px color-mix(in oklab, ${game.accent} 30%, transparent)`,
          }}
        >
          {game.emoji}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-bold text-foreground sm:text-base truncate">
              {game.shortLabel}
            </h3>
            <span
              className="hidden sm:inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest"
              style={{ borderColor: game.accent, color: game.accent }}
            >
              {periodLabel}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
            <span className="uppercase tracking-widest">Draw No:</span>
            <span className="text-foreground font-semibold">{draw}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Link
              to="/game/$gameId"
              params={{ gameId: game.id }}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition hover:scale-105"
              style={{
                background: `color-mix(in oklab, var(--neon-cyan) 15%, transparent)`,
                color: "var(--neon-cyan)",
                border: `1px solid color-mix(in oklab, var(--neon-cyan) 50%, transparent)`,
              }}
            >
              <TrendingUp className="size-2.5" /> Pred. Results
            </Link>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition hover:scale-105"
              style={{
                background: `color-mix(in oklab, var(--neon-red) 15%, transparent)`,
                color: "var(--neon-red)",
                border: `1px solid color-mix(in oklab, var(--neon-red) 50%, transparent)`,
              }}
            >
              <ExternalLink className="size-2.5" /> Bet Now
            </a>
          </div>
        </div>

        {/* Last result chip */}
        <div className="hidden shrink-0 text-right sm:block">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Last</div>
          <div
            className="mt-1 grid size-10 place-items-center rounded-full font-display text-base font-bold"
            style={{
              background: `color-mix(in oklab, ${game.accent} 18%, transparent)`,
              border: `1px solid ${game.accent}`,
              color: game.accent,
            }}
          >
            {latest?.lastSum ?? latest?.lastNumber ?? "—"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
