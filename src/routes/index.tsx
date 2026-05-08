import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Sparkles, Send, Flame, Target, Users, Zap } from "lucide-react";
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
  const latestMap = new Map(latest.map((l) => [l.id, l]));

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

      <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
        {/* HERO CARD */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
          style={{
            background: "var(--gradient-cyber)",
            boxShadow: "0 20px 60px color-mix(in oklab, var(--primary) 30%, transparent)",
          }}
        >
          <div className="absolute -right-10 -top-10 size-48 rounded-full opacity-30" style={{ background: "radial-gradient(circle, white, transparent 70%)" }} />
          <div className="absolute -bottom-10 -left-10 size-48 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white, transparent 70%)" }} />

          <div className="relative grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="text-white">
              <h1 className="font-display text-xl font-bold leading-tight sm:text-2xl">
                AI-Powered<br />
                Lottery Predictions
              </h1>
              <p className="mt-2 max-w-xs text-xs opacity-90 sm:text-sm">
                Real-time signals delivered to your Telegram. Built on 1000+ rounds of deterministic data.
              </p>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-primary shadow-lg transition hover:scale-105"
              >
                <Send className="size-3" /> Contact
              </a>
            </div>

            {/* Decorative glyph instead of copyrighted illustration */}
            <div className="hidden sm:block">
              <div className="relative grid size-32 place-items-center rounded-3xl bg-white/15 backdrop-blur-sm">
                <div className="absolute inset-2 rounded-2xl border-2 border-dashed border-white/30 animate-pulse" />
                <Zap className="size-12 text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* POPULAR PREDICTIONS */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2 px-1">
            <Flame className="size-5" style={{ color: "var(--neon-amber)" }} />
            <h2 className="font-display text-base font-bold text-foreground">Popular Lottery Predictions</h2>
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
