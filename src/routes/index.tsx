import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { LogOut, Sparkles, Flame, Target, Users } from "lucide-react";
import { LockScreen } from "@/components/winpro/LockScreen";
import { Particles } from "@/components/winpro/Particles";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { AccuracyGauge } from "@/components/winpro/AccuracyGauge";
import { PredictionRow, type LatestSummary } from "@/components/winpro/PredictionRow";
import { GAMES } from "@/lib/games.config";
import { fetchAllLatest } from "@/lib/games.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const res = await fetchAllLatest();
      if (res.ok) return { latest: res.latest as LatestSummary[] };
    } catch { /* ignore */ }
    return { latest: [] as LatestSummary[] };
  },
  head: () => ({
    meta: [
      { title: "WinPro Predictor — AI Lottery Signal Engine" },
      { name: "description", content: "Live AI-powered prediction signals for WinGo, K3 Dice, and TrxWinGo across all timeframes." },
      { property: "og:title", content: "WinPro Predictor — AI Signal Engine" },
      { property: "og:description", content: "Real-time signals for 9 lottery games with deterministic AI predictions." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(!!sessionStorage.getItem("winpro_auth")); }, []);
  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />;
  return <Home onLogout={() => { sessionStorage.removeItem("winpro_auth"); setAuthed(false); }} />;
}

function Home({ onLogout }: { onLogout: () => void }) {
  const { latest } = Route.useLoaderData();
  const latestMap = new Map<string, LatestSummary>(latest.map((l: LatestSummary) => [l.id, l]));

  return (
    <div className="relative min-h-screen pb-12">
      <Particles count={20} />

      {/* HEADER */}
      <header
        className="sticky top-0 z-30 border-b border-border backdrop-blur-xl"
        style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 70%, transparent), color-mix(in oklab, var(--accent) 50%, transparent))" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className="grid size-9 place-items-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.18)", boxShadow: "0 0 18px rgba(255,255,255,0.25)" }}
            >
              <Sparkles className="size-4 text-white" />
            </div>
            <div className="text-white">
              <div className="font-display text-base font-bold tracking-wider">WinPro</div>
              <div className="font-mono text-[8px] uppercase tracking-[0.3em] opacity-80">Predictor</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <LogOut className="size-3" /> Lock
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5 sm:px-6">
        {/* POPULAR PREDICTIONS */}
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Flame className="size-5" style={{ color: "var(--neon-amber)" }} />
              <h2 className="font-display text-base font-bold text-foreground">Popular Lottery Predictions</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--neon-green)" }} /> Live
            </span>
          </div>
          <div className="space-y-2.5">
            {GAMES.map((g, i) => (
              <PredictionRow key={g.id} game={g} latest={latestMap.get(g.id)} idx={i} />
            ))}
          </div>
        </section>

        {/* PREDICTION ACCURACY */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2 px-1">
            <Target className="size-5" style={{ color: "var(--neon-red)" }} />
            <h2 className="font-display text-base font-bold text-foreground">Prediction Accuracy</h2>
          </div>
          <div className="glass rounded-3xl p-5 grid place-items-center">
            <AccuracyGauge value={85} size={180} />
            <div className="mt-3 grid grid-cols-3 gap-3 w-full text-center">
              <Stat label="Tracked" value="9" color="var(--neon-cyan)" />
              <Stat label="Live" value="24/7" color="var(--neon-green)" />
              <Stat label="History" value="1000" color="var(--neon-magenta)" />
            </div>
          </div>
        </section>

        {/* ACTIVE USERS */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2 px-1">
            <Users className="size-5" style={{ color: "var(--neon-green)" }} />
            <h2 className="font-display text-base font-bold text-foreground">Active Users</h2>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-3xl font-bold gradient-text">12,847</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Online right now</div>
              </div>
              <div className="flex -space-x-2">
                {["var(--neon-cyan)", "var(--neon-magenta)", "var(--neon-violet)", "var(--neon-green)"].map((c, i) => (
                  <div
                    key={i}
                    className="grid size-9 place-items-center rounded-full border-2 border-background font-display text-xs font-bold text-white"
                    style={{ background: c }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="grid size-9 place-items-center rounded-full border-2 border-background bg-secondary font-mono text-[10px] text-foreground">
                  +9k
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          WinPro Predictor · Server-side AI · Public API at <Link to="/" className="text-primary">/api/public/history</Link>
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="font-display text-xl font-bold" style={{ color }}>{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
