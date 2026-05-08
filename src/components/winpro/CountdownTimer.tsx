import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : String(sec).padStart(2, "0");
}

export function CountdownTimer({
  nextPeriod,
  currentPeriod,
  periodSec,
}: {
  nextPeriod: string;
  currentPeriod: string;
  periodSec: number;
}) {
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

  const pct = (remaining / periodSec) * 100;
  const dangerPct = Math.max(10, Math.min(20, periodSec / 6));
  const danger = (remaining / periodSec) * 100 <= dangerPct;
  const stroke = danger ? "var(--neon-red)" : "var(--neon-cyan)";

  return (
    <div className="glass relative flex flex-col items-center justify-center gap-3 rounded-2xl p-5 sm:p-6">
      <p className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Next Period</p>
      <p className="font-mono text-xs break-all text-center" style={{ color: "var(--neon-cyan)" }}>{nextPeriod || "—"}</p>

      <div className="relative size-44 sm:size-52">
        <svg viewBox="0 0 120 120" className="-rotate-90 size-full">
          <circle cx="60" cy="60" r="52" stroke="color-mix(in oklab, var(--foreground) 8%, transparent)" strokeWidth="6" fill="none" />
          <motion.circle
            cx="60" cy="60" r="52"
            stroke={stroke}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={(2 * Math.PI * 52) * (1 - pct / 100)}
            style={{ filter: `drop-shadow(0 0 8px ${stroke})` }}
            transition={{ duration: 0.3 }}
          />
        </svg>
        <motion.div
          animate={danger ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ repeat: danger ? Infinity : 0, duration: 0.8 }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span
            className={`font-display ${remaining >= 60 ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl"} font-bold ${danger ? "neon-text-red" : "neon-text-cyan"}`}
          >
            {fmt(remaining)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">remaining</span>
        </motion.div>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Current: <span className="text-foreground">{currentPeriod.slice(-8) || "—"}</span>
      </p>
    </div>
  );
}
