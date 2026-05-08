import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CountdownTimer({ nextPeriod, currentPeriod }: { nextPeriod: string; currentPeriod: string }) {
  const [remaining, setRemaining] = useState(30);

  useEffect(() => {
    const tick = () => {
      const sec = Math.floor(Date.now() / 1000);
      setRemaining(30 - (sec % 30));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);

  const pct = (remaining / 30) * 100;
  const danger = remaining <= 5;
  const stroke = danger ? "var(--neon-red)" : "var(--neon-cyan)";

  return (
    <div className="glass relative flex flex-col items-center justify-center gap-3 rounded-2xl p-5 sm:p-6">
      <p className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Next Period</p>
      <p className="font-mono text-xs text-neon-cyan break-all text-center" style={{ color: "var(--neon-cyan)" }}>{nextPeriod || "—"}</p>

      <div className="relative size-44 sm:size-52">
        <svg viewBox="0 0 120 120" className="-rotate-90 size-full">
          <circle cx="60" cy="60" r="52" stroke="oklch(1 0 0 / 0.08)" strokeWidth="6" fill="none" />
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
            className={`font-display text-5xl sm:text-6xl font-bold ${danger ? "neon-text-red" : "neon-text-cyan"}`}
          >
            {String(remaining).padStart(2, "0")}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">seconds</span>
        </motion.div>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Current: <span className="text-foreground">{currentPeriod.slice(-6) || "—"}</span>
      </p>
    </div>
  );
}
