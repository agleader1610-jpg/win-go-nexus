import { motion, AnimatePresence } from "framer-motion";
import { Activity, BrainCircuit, Flame, TrendingUp, Waves, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { Signal } from "@/types/wingo";

const STATUSES = ["ANALYZING...", "PROCESSING...", "SCANNING HISTORY...", "AI LEARNING...", "DEEP NEURAL SYNC..."];

export function SignalCard({ signal }: { signal?: Signal }) {
  const [status, setStatus] = useState(STATUSES[0]);
  useEffect(() => {
    const id = setInterval(() => setStatus(STATUSES[Math.floor(Math.random() * STATUSES.length)]), 1800);
    return () => clearInterval(id);
  }, []);

  const isBig = signal?.type === "BIG";
  const accentColor = isBig ? "var(--neon-magenta)" : "var(--neon-cyan)";

  return (
    <div
      className="glass relative overflow-hidden rounded-2xl p-5 sm:p-6"
      style={{ boxShadow: `0 0 40px ${accentColor}33`, borderColor: `${accentColor}55` }}
    >
      <div className="absolute inset-0 -z-10 opacity-30" style={{
        background: `radial-gradient(circle at 80% 0%, ${accentColor}, transparent 60%)`,
      }} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-primary" />
          <span className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">AI Signal</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="font-mono text-[10px] uppercase text-neon-green"
            style={{ color: "var(--neon-green)" }}
          >
            ● {status}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={signal?.period ?? "x"}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="flex flex-col"
          >
            <span
              className="font-display text-5xl sm:text-6xl font-black"
              style={{ color: accentColor, textShadow: `0 0 24px ${accentColor}` }}
            >
              {signal?.type ?? "—"}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Period {signal?.period.slice(-6) ?? "..."}
            </span>
          </motion.div>
        </AnimatePresence>
        <div className="text-right">
          <div className="font-display text-3xl font-bold gradient-text">{signal?.confidence ?? 0}%</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Confidence</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat icon={<TrendingUp className="size-3" />} label="Trend" value={signal?.trendPower ?? 0} color="var(--neon-cyan)" />
        <Stat icon={<Waves className="size-3" />} label="Volatility" value={signal?.volatility ?? 0} color="var(--neon-violet)" />
        <Stat icon={<Flame className="size-3" />} label="Heat" value={signal?.marketHeat ?? 0} color="var(--neon-amber)" />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <Activity className="size-3 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Engine</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-neon-green" style={{ color: "var(--neon-green)" }}>
          <Zap className="size-3" />
          <span className="font-mono">ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/30 p-2">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-1 font-display text-lg font-bold" style={{ color }}>{value}</div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6 }}
          className="h-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}
