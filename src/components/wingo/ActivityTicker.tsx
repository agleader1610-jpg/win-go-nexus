import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

const MESSAGES = [
  "AI detected volatility spike on stream-7",
  "New trend pattern scanned · BIG cluster",
  "Market movement updated · Δ +2.3%",
  "Signal recalculated · neural weights tuned",
  "Heat index synchronized with global feed",
  "Quantum probability matrix re-seeded",
  "Auto-bet engine armed · risk balanced",
  "Edge intelligence handshake complete",
  "Pattern divergence above threshold",
  "Data oracle pinged · 12ms latency",
];

export function ActivityTicker() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);
  const items = [...MESSAGES, ...MESSAGES];
  void tick;
  return (
    <div className="glass relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2">
      <div className="flex shrink-0 items-center gap-2 border-r border-border/40 pr-3">
        <Radio className="size-3 animate-pulse text-neon-red" style={{ color: "var(--neon-red)" }} />
        <span className="font-mono text-[10px] uppercase tracking-widest text-neon-red" style={{ color: "var(--neon-red)" }}>LIVE</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="animate-ticker flex gap-10 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
          {items.map((m, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-neon-cyan" style={{ background: "var(--neon-cyan)" }} />
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
