import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Sparkles, Zap, ShieldCheck, Activity } from "lucide-react";
import { LockScreen } from "@/components/winpro/LockScreen";
import { Particles } from "@/components/winpro/Particles";
import { GameCard } from "@/components/winpro/GameCard";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { GAMES } from "@/lib/games.config";

export const Route = createFileRoute("/")({
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
  return (
    <div className="relative min-h-screen pb-12">
      <Particles count={24} />

      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="grid size-9 place-items-center rounded-xl"
              style={{ background: "var(--gradient-cyber)", boxShadow: "var(--shadow-neon-cyan)" }}
            >
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <h1 className="font-display text-sm font-bold uppercase tracking-[0.25em] gradient-text sm:text-base">WinPro Predictor</h1>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">AI Signal Engine</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={onLogout} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--neon-red)" }}>
              <LogOut className="size-3" /> Lock
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
              <Activity className="size-3" /> Live · 9 Games · 1000 history each
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              <span className="gradient-text">AI Predictions</span>
              <br />for every Lottery Round
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Deterministic signals built from upstream history. Every viewer sees the same prediction, in real time, across WinGo, K3 Dice, and TrxWinGo formats.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              <Badge icon={<Zap className="size-3" />} text="Live cron" />
              <Badge icon={<ShieldCheck className="size-3" />} text="Server-verified" />
              <Badge icon={<Activity className="size-3" />} text="Public API" />
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="glass relative grid size-44 place-items-center rounded-3xl">
              <div className="absolute inset-0 rounded-3xl" style={{ background: "var(--gradient-cyber)", opacity: 0.15 }} />
              <div className="text-center">
                <div className="font-display text-5xl font-bold gradient-text">85%</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Accuracy</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <h3 className="font-display text-lg font-bold text-foreground">Popular Predictions</h3>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{GAMES.length} games</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g, i) => (
            <GameCard key={g.id} game={g} idx={i} />
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <div className="glass rounded-2xl p-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          WinPro Predictor · Server-side AI · Public API at /api/public/history?game=&lt;id&gt;
        </div>
      </footer>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-1">
      {icon} {text}
    </span>
  );
}
