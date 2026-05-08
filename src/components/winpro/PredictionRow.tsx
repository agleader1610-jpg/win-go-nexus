import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TrendingUp, Send } from "lucide-react";
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
  const draw = latest?.nextIssue ? latest.nextIssue.slice(-10) : "— — — —";
  const lastVal = latest?.lastSum ?? latest?.lastNumber;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.05, 0.35), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="glass group relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-shadow"
      style={{
        boxShadow: `0 8px 28px -8px color-mix(in oklab, ${game.accent} 35%, transparent), inset 0 1px 0 color-mix(in oklab, ${game.accent} 18%, transparent)`,
      }}
    >
      {/* accent left bar */}
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, transparent, ${game.accent}, transparent)` }}
      />
      {/* corner glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-50"
        style={{ background: `radial-gradient(circle, ${game.accent}, transparent 70%)` }}
      />

      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-2xl blur-md opacity-60"
            style={{ background: `radial-gradient(circle, ${game.accent}, transparent 70%)` }}
          />
          <div
            className="relative grid size-16 place-items-center rounded-2xl backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, color-mix(in oklab, ${game.accent} 25%, transparent), color-mix(in oklab, ${game.accent} 5%, transparent))`,
              border: `1px solid color-mix(in oklab, ${game.accent} 45%, transparent)`,
              boxShadow: `inset 0 0 18px color-mix(in oklab, ${game.accent} 25%, transparent)`,
            }}
          >
            <img src={GAME_ICONS[game.kind]} alt="" className="size-12 drop-shadow-md" loading="lazy" />
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground sm:text-base truncate">
              {game.shortLabel}
            </h3>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em]"
              style={{
                background: `color-mix(in oklab, ${game.accent} 15%, transparent)`,
                color: game.accent,
                border: `1px solid color-mix(in oklab, ${game.accent} 40%, transparent)`,
              }}
            >
              {periodLabel}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
            <span className="uppercase tracking-[0.2em]">Draw</span>
            <span className="text-foreground font-semibold tracking-wider">#{draw}</span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Link
              to="/game/$gameId"
              params={{ gameId: game.id }}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] transition hover:scale-[1.04] active:scale-95"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklab, var(--neon-cyan) 22%, transparent), color-mix(in oklab, var(--neon-cyan) 8%, transparent))`,
                color: "var(--neon-cyan)",
                border: `1px solid color-mix(in oklab, var(--neon-cyan) 55%, transparent)`,
                boxShadow: `0 0 14px color-mix(in oklab, var(--neon-cyan) 30%, transparent)`,
              }}
            >
              <TrendingUp className="size-3" /> Predict
            </Link>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] transition hover:scale-[1.04] active:scale-95"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklab, var(--neon-magenta) 22%, transparent), color-mix(in oklab, var(--neon-magenta) 8%, transparent))`,
                color: "var(--neon-magenta)",
                border: `1px solid color-mix(in oklab, var(--neon-magenta) 55%, transparent)`,
                boxShadow: `0 0 14px color-mix(in oklab, var(--neon-magenta) 30%, transparent)`,
              }}
            >
              <Send className="size-3" /> Bet Now
            </a>
          </div>
        </div>

        {/* Last result chip */}
        <div className="shrink-0 text-center">
          <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground">Last</div>
          <div
            className="mt-1 grid size-12 place-items-center rounded-2xl font-display text-lg font-bold"
            style={{
              background: `linear-gradient(135deg, color-mix(in oklab, ${game.accent} 28%, transparent), color-mix(in oklab, ${game.accent} 8%, transparent))`,
              border: `1px solid color-mix(in oklab, ${game.accent} 60%, transparent)`,
              color: game.accent,
              boxShadow: `0 0 18px color-mix(in oklab, ${game.accent} 35%, transparent), inset 0 0 10px color-mix(in oklab, ${game.accent} 15%, transparent)`,
              textShadow: `0 0 10px color-mix(in oklab, ${game.accent} 60%, transparent)`,
            }}
          >
            {lastVal ?? "—"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
