import { Link, useLocation } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/predictors";

export function CategoryTabs({ gameId, active }: { gameId: string; active: string }) {
  // Reuse existing search/hash; categories live as a path segment.
  return (
    <div className="sticky top-[60px] z-20 -mx-4 px-4 sm:-mx-6 sm:px-6">
      <div className="relative rounded-2xl border border-border/40 bg-background/70 p-1 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1">
          {CATEGORIES.map((c) => {
            const isActive = c.id === active;
            return (
              <Link
                key={c.id}
                to="/game/$gameId"
                params={{ gameId }}
                search={{ cat: c.id }}
                className="relative grid place-items-center rounded-xl px-2 py-2 text-center transition"
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, color-mix(in oklab, ${c.accent} 35%, transparent), color-mix(in oklab, ${c.accent} 12%, transparent))`,
                        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${c.accent} 55%, transparent), 0 0 18px -6px color-mix(in oklab, ${c.accent} 60%, transparent)`,
                      }
                    : {}
                }
              >
                <span
                  className="font-display text-[11px] font-extrabold uppercase tracking-[0.22em] sm:text-xs"
                  style={{ color: isActive ? c.accent : "var(--muted-foreground)" }}
                >
                  {c.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper: tiny, unused — keep placeholder for clarity.
export function _suppressUnused() { useLocation; }
