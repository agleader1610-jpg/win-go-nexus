import { motion } from "framer-motion";
import type { Signal, WingoIssue } from "@/types/wingo";

function colorClass(color: string) {
  if (color.includes("red") && color.includes("violet")) return "from-neon-red to-neon-violet";
  if (color.includes("green") && color.includes("violet")) return "from-neon-green to-neon-violet";
  if (color.includes("red")) return "from-neon-red to-neon-red";
  if (color.includes("green")) return "from-neon-green to-neon-green";
  return "from-neon-violet to-neon-violet";
}

function colorVar(color: string) {
  if (color.includes("red")) return "var(--neon-red)";
  if (color.includes("green")) return "var(--neon-green)";
  return "var(--neon-violet)";
}

export function HistoryTable({ issues, signals }: { issues: WingoIssue[]; signals: Record<string, Signal> }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <h3 className="font-display text-sm uppercase tracking-[0.3em] text-foreground">History Log</h3>
        <span className="font-mono text-[10px] text-neon-green" style={{ color: "var(--neon-green)" }}>
          ● LIVE • {issues.length} rows
        </span>
      </div>
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-background/80 backdrop-blur">
            <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-2 font-mono">Period</th>
              <th className="px-3 py-2 font-mono">No.</th>
              <th className="px-3 py-2 font-mono">Color</th>
              <th className="px-3 py-2 font-mono">Result</th>
              <th className="px-3 py-2 font-mono">Signal</th>
              <th className="px-3 py-2 font-mono text-right">Conf</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((it, idx) => {
              const n = parseInt(it.number, 10);
              const result: "BIG" | "SMALL" = n >= 5 ? "BIG" : "SMALL";
              const sig = signals[it.issueNumber];
              const win = sig ? sig.type === result : undefined;
              const c = colorVar(it.color);
              return (
                <motion.tr
                  key={it.issueNumber}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                  className="border-t border-border/20 hover:bg-primary/5"
                >
                  <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">{it.issueNumber.slice(-8)}</td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-grid size-7 place-items-center rounded-full font-display text-xs font-bold"
                      style={{ background: `${c}33`, color: c, boxShadow: `0 0 10px ${c}66`, border: `1px solid ${c}` }}
                    >
                      {it.number}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className={`h-2 w-12 rounded-full bg-gradient-to-r ${colorClass(it.color)}`}
                      style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-[11px]" style={{ color: result === "BIG" ? "var(--neon-magenta)" : "var(--neon-cyan)" }}>
                      {result}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px]">
                    {sig ? (
                      <span style={{ color: sig.type === "BIG" ? "var(--neon-magenta)" : "var(--neon-cyan)" }}>
                        {sig.type}
                        {win !== undefined && (
                          <span className="ml-1" style={{ color: win ? "var(--neon-green)" : "var(--neon-red)" }}>
                            {win ? "✓" : "✗"}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] text-foreground">
                    {sig?.confidence ?? "—"}{sig ? "%" : ""}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
