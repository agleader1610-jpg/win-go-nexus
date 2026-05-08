import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Activity } from "lucide-react";
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
  const draw = latest?.nextIssue ? latest.nextIssue.slice(-10) : "————";
  const lastVal = latest?.lastSum ?? latest?.lastNumber;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/game/$gameId"
        params={{ gameId: game.id }}
        className="group block"
      >
        <div
          className="relative overflow-hidden rounded-[22px] p-[1.5px] transition-transform duration-300 group-hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(135deg, color-mix(in oklab, ${game.accent} 70%, transparent), color-mix(in oklab, ${game.accent} 5%, transparent) 40%, color-mix(in oklab, ${game.accent} 50%, transparent))`,
            boxShadow: `0 12px 40px -12px color-mix(in oklab, ${game.accent} 55%, transparent)`,
          }}
        >
          <div
            className="relative overflow-hidden rounded-[20px] p-4 sm:p-5"
            style={{ background: "var(--glass-strong-bg)" }}
          >
            {/* single soft accent wash (cheap, no blur filter) */}
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{ background: `radial-gradient(140% 90% at 100% 0%, color-mix(in oklab, ${game.accent} 22%, transparent), transparent 60%)` }}
            />

            <div className="relative flex items-center gap-4">
              {/* Icon */}
              <div className="relative shrink-0">
                <div
                  className="relative grid size-[68px] place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(140deg, color-mix(in oklab, ${game.accent} 30%, transparent), color-mix(in oklab, ${game.accent} 5%, transparent))`,
                    border: `1px solid color-mix(in oklab, ${game.accent} 50%, transparent)`,
                    boxShadow: `inset 0 1px 0 color-mix(in oklab, white 25%, transparent), 0 0 18px -4px color-mix(in oklab, ${game.accent} 50%, transparent)`,
                  }}
                >
                  <img src={GAME_ICONS[game.kind]} alt="" className="size-12" loading="lazy" decoding="async" />
                </div>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[15px] font-extrabold tracking-tight text-foreground sm:text-[17px] truncate">
                    {game.shortLabel}
                  </h3>
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      background: `color-mix(in oklab, ${game.accent} 18%, transparent)`,
                      color: game.accent,
                      border: `1px solid color-mix(in oklab, ${game.accent} 35%, transparent)`,
                    }}
                  >
                    {periodLabel}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                  <Activity className="size-2.5" style={{ color: "var(--neon-green)" }} />
                  <span className="uppercase tracking-[0.2em]">Period</span>
                  <span className="text-foreground/90 font-semibold tracking-wider">#{draw}</span>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition-all group-hover:gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${game.accent}, color-mix(in oklab, ${game.accent} 60%, transparent))`,
                      color: "white",
                      boxShadow: `0 4px 16px -4px color-mix(in oklab, ${game.accent} 70%, transparent)`,
                    }}
                  >
                    Predict
                    <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open("https://t.me/", "_blank", "noreferrer");
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/80 transition hover:bg-background/70 hover:text-foreground"
                  >
                    Bet
                  </button>
                </div>
              </div>

              {/* Last result chip */}
              <div className="relative shrink-0 text-center">
                <div className="font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Last</div>
                <div
                  className="relative mt-1 grid size-14 place-items-center rounded-2xl font-display text-2xl font-black"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${game.accent} 45%, transparent), color-mix(in oklab, ${game.accent} 5%, transparent))`,
                    border: `1px solid color-mix(in oklab, ${game.accent} 65%, transparent)`,
                    color: "white",
                    boxShadow: `0 0 18px -2px color-mix(in oklab, ${game.accent} 45%, transparent), inset 0 1px 0 color-mix(in oklab, white 30%, transparent)`,
                    textShadow: `0 0 12px color-mix(in oklab, ${game.accent} 80%, transparent), 0 1px 2px rgba(0,0,0,0.5)`,
                  }}
                >
                  {lastVal ?? "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
