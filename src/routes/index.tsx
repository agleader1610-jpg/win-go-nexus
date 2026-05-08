import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { LogOut, Sparkles, Flame, Target, Users, Zap, TrendingUp, Shield } from "lucide-react";
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
      { title: "SignalWin — AI Lottery Signal Engine" },
      { name: "description", content: "Live AI-powered prediction signals for WinGo, K3 Dice, and TrxWinGo across all timeframes." },
      { property: "og:title", content: "SignalWin — AI Signal Engine" },
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
    <div className="relative min-h-screen pb-16">
      <Particles count={24} />

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-border/40 backdrop-blur-2xl">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 75%, transparent), color-mix(in oklab, var(--accent) 60%, transparent))" }}
        />
        <div className="absolute inset-0 -z-10 grid-pattern opacity-10" />

        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="relative grid size-10 place-items-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.18)", boxShadow: "0 0 22px rgba(255,255,255,0.35), inset 0 1px 0 rgba(255,255,255,0.4)" }}
            >
              <Sparkles className="size-4 text-white drop-shadow" />
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-white/30 animate-pulse" />
            </div>
            <div className="text-white leading-tight">
              <div className="font-display text-base font-extrabold tracking-wider">SignalWin</div>
              <div className="font-mono text-[8px] uppercase tracking-[0.35em] opacity-85">AI · Predictor</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <LogOut className="size-3" /> Lock
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5 sm:px-6">
        {/* TAGLINE STRIP */}
        <div className="slide-up mb-5 flex items-center justify-center gap-2 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground backdrop-blur">
            <Zap className="size-3" style={{ color: "var(--neon-amber)" }} />
            <span className="shimmer-text">Real-time AI Signal Engine</span>
          </span>
        </div>

        {/* STATS BAND */}
        <div className="slide-up grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard icon={<TrendingUp className="size-4" />} value="85%" label="Accuracy" color="var(--neon-cyan)" />
          <StatCard icon={<Zap className="size-4" />} value="9" label="Games Live" color="var(--neon-amber)" />
          <StatCard icon={<Shield className="size-4" />} value="24/7" label="Uptime" color="var(--neon-green)" />
        </div>

        {/* POPULAR PREDICTIONS */}
        <section className="mt-7">
          <SectionHeader
            icon={<Flame className="size-4" />}
            iconColor="var(--neon-amber)"
            title="Popular Predictions"
            subtitle="Live signals · all timeframes"
            badge="LIVE"
          />
          <div className="mt-4 space-y-3">
            {GAMES.map((g, i) => (
              <PredictionRow key={g.id} game={g} latest={latestMap.get(g.id)} idx={i} />
            ))}
          </div>
        </section>

        {/* PREDICTION ACCURACY */}
        <section className="mt-8">
          <SectionHeader
            icon={<Target className="size-4" />}
            iconColor="var(--neon-red)"
            title="Engine Accuracy"
            subtitle="Tracked over 10K+ rounds"
          />
          <div className="mt-4 relative overflow-hidden rounded-3xl">
            <div
              className="absolute inset-0 opacity-60"
              style={{ background: "radial-gradient(ellipse at top, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%)" }}
            />
            <div className="glass relative rounded-3xl p-6 grid place-items-center">
              <AccuracyGauge value={85} size={190} />
              <div className="mt-4 grid grid-cols-3 gap-3 w-full text-center">
                <Stat label="Tracked" value="9" color="var(--neon-cyan)" />
                <Stat label="Live" value="24/7" color="var(--neon-green)" />
                <Stat label="History" value="10K+" color="var(--neon-magenta)" />
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVE USERS */}
        <section className="mt-8">
          <SectionHeader
            icon={<Users className="size-4" />}
            iconColor="var(--neon-green)"
            title="Active Community"
            subtitle="Online right now"
          />
          <div className="mt-4 glass relative overflow-hidden rounded-3xl p-5">
            <div className="absolute -right-16 -top-16 size-48 rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, var(--neon-green), transparent 70%)" }} />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="font-display text-4xl font-black gradient-text leading-none">12,847</div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--neon-green)", boxShadow: "0 0 8px var(--neon-green)" }} />
                  Active now
                </div>
              </div>
              <div className="flex -space-x-2.5">
                {["var(--neon-cyan)", "var(--neon-magenta)", "var(--neon-violet)", "var(--neon-green)"].map((c, i) => (
                  <div
                    key={i}
                    className="grid size-10 place-items-center rounded-full border-[2.5px] border-background font-display text-xs font-extrabold text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 50%, black))` }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="grid size-10 place-items-center rounded-full border-[2.5px] border-background bg-secondary font-mono text-[10px] font-bold text-foreground">
                  +9k
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground backdrop-blur">
            <Sparkles className="size-3" style={{ color: "var(--neon-cyan)" }} />
            <span>SignalWin · Built with AI</span>
          </div>
          <div className="mt-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
            Public API · <Link to="/" className="text-primary">/api/public/history</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SectionHeader({
  icon, iconColor, title, subtitle, badge,
}: { icon: React.ReactNode; iconColor: string; title: string; subtitle?: string; badge?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div className="flex items-center gap-3">
        <div
          className="grid size-9 place-items-center rounded-xl"
          style={{
            background: `linear-gradient(135deg, color-mix(in oklab, ${iconColor} 25%, transparent), transparent)`,
            border: `1px solid color-mix(in oklab, ${iconColor} 40%, transparent)`,
            boxShadow: `0 0 18px color-mix(in oklab, ${iconColor} 30%, transparent)`,
            color: iconColor,
          }}
        >
          {icon}
        </div>
        <div className="leading-tight">
          <h2 className="font-display text-[17px] font-extrabold tracking-tight text-foreground">{title}</h2>
          {subtitle && (
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{subtitle}</div>
          )}
        </div>
      </div>
      {badge && (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{
            borderColor: "color-mix(in oklab, var(--neon-green) 50%, transparent)",
            color: "var(--neon-green)",
            background: "color-mix(in oklab, var(--neon-green) 10%, transparent)",
          }}
        >
          <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--neon-green)", boxShadow: "0 0 8px var(--neon-green)" }} />
          {badge}
        </span>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div
      className="glass relative overflow-hidden rounded-2xl p-3 sm:p-4"
      style={{ boxShadow: `0 8px 24px -10px color-mix(in oklab, ${color} 45%, transparent)` }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full blur-2xl opacity-30"
        style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
      />
      <div className="relative flex items-center gap-2">
        <div
          className="grid size-7 place-items-center rounded-lg"
          style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color, border: `1px solid color-mix(in oklab, ${color} 35%, transparent)` }}
        >
          {icon}
        </div>
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      </div>
      <div className="mt-2 font-display text-2xl font-black leading-none tracking-tight" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-black" style={{ color }}>{value}</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
