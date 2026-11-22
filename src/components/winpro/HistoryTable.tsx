import { motion } from "framer-motion";
import type { GameItem } from "@/hooks/useGameData";
import type { ServerSignal } from "@/lib/games.server";
import type { GameKind } from "@/lib/games.config";

function colorVar(color: string) {
  if (color.includes("red")) return "var(--neon-red)";
  if (color.includes("green")) return "var(--neon-green)";
  if (color.includes("violet")) return "var(--neon-violet)";
  return "var(--muted-foreground)";
}

export function HistoryTable({
  items,
  signals,
  kind,
}: {
  items: GameItem[];
  signals: Record<string, ServerSignal>;
  kind: GameKind;
}) {
  const isK3 = kind === "k3";

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-display text-sm uppercase tracking-[0.3em] text-foreground">History Log</h3>
        <span className="font-mono text-[10px]" style={{ color: "var(--neon-green)" }}>
          ● LIVE • {items.length} rows
        </span>
      </div>
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-card/95 backdrop-blur">
            <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-2 font-mono">Period</th>
              {isK3 ? (
                <>
                  <th className="px-3 py-2 font-mono">Dice</th>
                  <th className="px-3 py-2 font-mono">Sum</th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2 font-mono">No.</th>
                  <th className="px-3 py-2 font-mono">Color</th>
                </>
              )}
              <th className="px-3 py-2 font-mono">Result</th>
              <th className="px-3 py-2 font-mono">Signal</th>
              <th className="px-3 py-2 font-mono text-right">Conf</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              let result: "BIG" | "SMALL";
              if (isK3) {
                result = (it.sum ?? 0) >= 11 ? "BIG" : "SMALL";
              } else {
                result = parseInt(it.number || "0", 10) >= 5 ? "BIG" : "SMALL";
              }
              const sig = signals[it.issueNumber];
              const win = sig ? sig.type === result : undefined;
              const c = colorVar(it.color);
              return (
                <motion.tr
                  key={it.issueNumber}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                  className="border-t border-border hover:bg-primary/5"
                >
                  <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">{it.issueNumber.slice(-8)}</td>

                  {isK3 ? (
                    <>
                      <td className="px-3 py-2 font-mono text-xs text-foreground">{it.premium}</td>
                      <td className="px-3 py-2 font-display text-sm font-bold" style={{ color: result === "BIG" ? "var(--neon-magenta)" : "var(--neon-cyan)" }}>{it.sum}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2">
                        <span
                          className="inline-grid size-7 place-items-center rounded-full font-display text-xs font-bold"
                          style={{ background: `color-mix(in oklab, ${c} 20%, transparent)`, color: c, boxShadow: `0 0 10px color-mix(in oklab, ${c} 40%, transparent)`, border: `1px solid ${c}` }}
                        >
                          {it.number}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {it.color.split(",").map((cc, i) => (
                            <div key={i} className="h-2 w-5 rounded-full" style={{ background: colorVar(cc), filter: "drop-shadow(0 0 6px currentColor)", color: colorVar(cc) }} />
                          ))}
                        </div>
                      </td>
                    </>
                  )}

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
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">Loading history…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
