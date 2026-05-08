import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import type { GameConfig } from "@/lib/games.config";

export function GameCard({ game, idx }: { game: GameConfig; idx: number }) {
  const periodLabel = game.periodSec >= 60 ? `${game.periodSec / 60}M` : `${game.periodSec}s`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
    >
      <Link to="/game/$gameId" params={{ gameId: game.id }} className="group block">
        <div
          className="glass relative h-full overflow-hidden rounded-2xl p-5 transition group-hover:scale-[1.02]"
          style={{ boxShadow: `0 8px 32px color-mix(in oklab, ${game.accent} 18%, transparent)` }}
        >
          <div
            className="absolute -right-10 -top-10 size-32 rounded-full opacity-30 transition group-hover:opacity-50"
            style={{ background: `radial-gradient(circle, ${game.accent}, transparent 70%)` }}
          />
          <div className="flex items-start justify-between">
            <div
              className="grid size-12 place-items-center rounded-xl text-2xl"
              style={{ background: `color-mix(in oklab, ${game.accent} 18%, transparent)`, boxShadow: `0 0 20px color-mix(in oklab, ${game.accent} 30%, transparent)` }}
            >
              <span>{game.emoji}</span>
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest"
              style={{ borderColor: game.accent, color: game.accent }}
            >
              <Clock className="size-2.5" />
              {periodLabel}
            </span>
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-foreground">{game.shortLabel}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{game.label}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--neon-green)" }}>● LIVE</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-primary">
              View signals <ArrowRight className="size-3 transition group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
