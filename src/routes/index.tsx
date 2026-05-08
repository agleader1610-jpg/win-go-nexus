import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, BarChart3, History, LayoutDashboard, LogOut, Settings2, Sparkles, Zap } from "lucide-react";
import { LockScreen } from "@/components/wingo/LockScreen";
import { Particles } from "@/components/wingo/Particles";
import { CountdownTimer } from "@/components/wingo/CountdownTimer";
import { SignalCard } from "@/components/wingo/SignalCard";
import { HistoryTable } from "@/components/wingo/HistoryTable";
import { Analytics } from "@/components/wingo/Analytics";
import { ActivityTicker } from "@/components/wingo/ActivityTicker";
import { AdminPanel } from "@/components/wingo/AdminPanel";
import { useAdminSettings, useWingoData } from "@/hooks/useWingoData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WinGo 30S Hack Dashboard — AI Signal Engine" },
      { name: "description", content: "Futuristic AI-powered WinGo 30 second prediction dashboard with live signals, analytics, and probability simulation." },
    ],
  }),
  component: Index,
});

function Index() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(!!sessionStorage.getItem("wingo_auth")); }, []);

  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => { sessionStorage.removeItem("wingo_auth"); setAuthed(false); }} />;
}

type Tab = "overview" | "signals" | "history" | "analytics";

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [settings, setSettings] = useAdminSettings();
  const [tab, setTab] = useState<Tab>("overview");
  const [adminOpen, setAdminOpen] = useState(false);
  const { issues, signals, clearHistory, error } = useWingoData(settings.refreshMs, settings.confRange);

  const latest = issues[0];
  const nextPeriod = useMemo(() => latest ? (BigInt(latest.issueNumber) + 1n).toString() : "", [latest]);
  const nextSignal = signals[nextPeriod];

  return (
    <div className="relative min-h-screen pb-24 lg:pb-8">
      {settings.effects && <Particles count={32} />}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/30 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl border border-primary/40" style={{ boxShadow: "var(--shadow-neon-cyan)" }}>
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-sm font-bold uppercase tracking-[0.25em] gradient-text sm:text-base">WinGo 30S</h1>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Hack Dashboard · v3.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill ok={!error} />
            <button onClick={() => setAdminOpen(true)} className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:border-primary/50">
              <Settings2 className="size-3" /> Admin
            </button>
            <button onClick={onLogout} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-neon-red hover:bg-destructive/20" style={{ color: "var(--neon-red)" }}>
              <LogOut className="size-3" /> Lock
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
          <ActivityTicker />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {(tab === "overview" || tab === "signals") && (
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <CountdownTimer nextPeriod={nextPeriod} currentPeriod={latest?.issueNumber ?? ""} />
                <div className="lg:col-span-2">
                  <SignalCard signal={nextSignal} />
                </div>
              </section>
            )}

            {tab === "overview" && <KpiRow issues={issues} signals={signals} />}

            {(tab === "overview" || tab === "history") && (
              <HistoryTable issues={issues} signals={signals} />
            )}

            {(tab === "overview" || tab === "analytics") && (
              <Analytics issues={issues} signals={signals} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-3 left-1/2 z-30 -translate-x-1/2 lg:hidden">
        <div className="glass-strong flex items-center gap-1 rounded-2xl p-1.5">
          {([
            ["overview", LayoutDashboard, "Home"],
            ["signals", Zap, "Signals"],
            ["history", History, "History"],
            ["analytics", BarChart3, "Charts"],
          ] as const).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest transition ${
                tab === id ? "bg-primary/20 text-neon-cyan" : "text-muted-foreground"
              }`}
              style={tab === id ? { color: "var(--neon-cyan)", boxShadow: "0 0 16px oklch(0.78 0.22 195 / 0.4)" } : {}}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Floating admin (mobile) */}
      <button
        onClick={() => setAdminOpen(true)}
        className="fixed bottom-24 right-4 z-30 grid size-12 place-items-center rounded-full border border-primary/40 bg-background/70 backdrop-blur lg:hidden"
        style={{ boxShadow: "var(--shadow-neon-cyan)" }}
      >
        <Settings2 className="size-5 text-primary" />
      </button>

      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        settings={settings}
        setSettings={setSettings}
        onClear={clearHistory}
      />
    </div>
  );
}

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest"
      style={{
        borderColor: ok ? "var(--neon-green)" : "var(--neon-red)",
        color: ok ? "var(--neon-green)" : "var(--neon-red)",
        boxShadow: `0 0 12px ${ok ? "var(--neon-green)" : "var(--neon-red)"}55`,
      }}
    >
      <Activity className="size-3" />
      {ok ? "ONLINE" : "OFFLINE"}
    </span>
  );
}

function KpiRow({ issues, signals }: { issues: any[]; signals: Record<string, any> }) {
  const last20 = issues.slice(0, 20);
  const big = last20.filter((i) => parseInt(i.number, 10) >= 5).length;
  const small = last20.length - big;
  let acc = 0, total = 0;
  last20.forEach((it) => {
    const sig = signals[it.issueNumber];
    if (sig) { total++; if ((parseInt(it.number, 10) >= 5 ? "BIG" : "SMALL") === sig.type) acc++; }
  });
  const accuracy = total ? Math.round((acc / total) * 100) : 0;
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Kpi label="Total Tracked" value={String(issues.length)} color="var(--neon-cyan)" />
      <Kpi label="BIG Hits" value={String(big)} color="var(--neon-magenta)" />
      <Kpi label="SMALL Hits" value={String(small)} color="var(--neon-cyan)" />
      <Kpi label="AI Accuracy" value={`${accuracy}%`} color="var(--neon-green)" />
    </section>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4">
      <div className="absolute -right-6 -top-6 size-20 rounded-full opacity-30" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold" style={{ color, textShadow: `0 0 16px ${color}66` }}>{value}</div>
    </div>
  );
}
