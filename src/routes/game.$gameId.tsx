import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Sparkles } from "lucide-react";
import { LockScreen } from "@/components/winpro/LockScreen";
import { Particles } from "@/components/winpro/Particles";
import { CountdownTimer } from "@/components/winpro/CountdownTimer";
import { SignalCard } from "@/components/winpro/SignalCard";
import { HistoryTable } from "@/components/winpro/HistoryTable";
import { ThemeToggle } from "@/components/winpro/ThemeToggle";
import { useGameData } from "@/hooks/useGameData";
import { GAMES, getGame } from "@/lib/games.config";
import { fetchGameData } from "@/lib/games.functions";

export const Route = createFileRoute("/game/$gameId")({
  loader: async ({ params }) => {
    try {
      const res = await fetchGameData({ data: { gameId: params.gameId } });
      if (res.ok) return { initial: res };
    } catch { /* ignore — client will retry */ }
    return { initial: null };
  },
  head: ({ params }) => {
    const cfg = getGame(params.gameId);
    return {
      meta: [
        { title: cfg ? `${cfg.label} — WinPro Predictor` : "Game — WinPro Predictor" },
        { name: "description", content: cfg ? `Live AI signals and history for ${cfg.label}.` : "Live AI lottery signals." },
      ],
    };
  },
  component: GamePage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <h1 className="font-display text-4xl gradient-text">Unknown game</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">← Back home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="grid min-h-screen place-items-center text-center px-4">
        <div>
          <h1 className="font-display text-2xl text-destructive">Failed to load game</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          >Retry</button>
        </div>
      </div>
    );
  },
});

function GamePage() {
  const { gameId } = Route.useParams();
  const cfg = getGame(gameId);
  if (!cfg) throw notFound();

  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(!!sessionStorage.getItem("winpro_auth")); }, []);
  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />;
  return <GameDashboard onLogout={() => { sessionStorage.removeItem("winpro_auth"); setAuthed(false); }} />;
}

function GameDashboard({ onLogout }: { onLogout: () => void }) {
  const { gameId } = Route.useParams();
  const cfg = getGame(gameId)!;
  const { items, signals, error } = useGameData(gameId, 4000);

  const latest = items[0];
  const nextPeriod = useMemo(
    () => latest ? (BigInt(latest.issueNumber) + 1n).toString() : "",
    [latest],
  );
  const nextSignal = signals[nextPeriod];

  return (
    <div className="relative min-h-screen pb-12">
      <Particles count={20} />

      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="grid size-9 place-items-center rounded-xl border border-border bg-secondary/40 text-foreground hover:border-primary">
              <ArrowLeft className="size-4" />
            </Link>
            <div
              className="grid size-9 place-items-center rounded-xl text-lg"
              style={{ background: `color-mix(in oklab, ${cfg.accent} 18%, transparent)`, border: `1px solid ${cfg.accent}` }}
            >
              {cfg.emoji}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-sm font-bold uppercase tracking-[0.25em] truncate" style={{ color: cfg.accent }}>{cfg.shortLabel}</h1>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground truncate">{cfg.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest"
              style={{
                borderColor: error ? "var(--neon-red)" : "var(--neon-green)",
                color: error ? "var(--neon-red)" : "var(--neon-green)",
              }}
            >
              <Sparkles className="size-3" />
              {error ? "OFFLINE" : "ONLINE"}
            </span>
            <ThemeToggle />
            <button onClick={onLogout} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--neon-red)" }}>
              <LogOut className="size-3" /> Lock
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          <CountdownTimer
            nextPeriod={nextPeriod}
            currentPeriod={latest?.issueNumber ?? ""}
            periodSec={cfg.periodSec}
          />
          <div className="lg:col-span-2">
            <SignalCard signal={nextSignal} kind={cfg.kind} />
          </div>
        </motion.section>

        <KpiRow items={items} signals={signals} kind={cfg.kind} />

        <HistoryTable items={items} signals={signals} kind={cfg.kind} />

        <OtherGames currentId={cfg.id} />
      </main>
    </div>
  );
}

function KpiRow({
  items, signals, kind,
}: {
  items: ReturnType<typeof useGameData>["items"];
  signals: ReturnType<typeof useGameData>["signals"];
  kind: ReturnType<typeof getGame> extends infer T ? (T extends { kind: infer K } ? K : never) : never;
}) {
  const last20 = items.slice(0, 20);
  const isK3 = kind === "k3";
  const big = last20.filter((i) => isK3 ? (i.sum ?? 0) >= 11 : parseInt(i.number || "0", 10) >= 5).length;
  const small = last20.length - big;
  let acc = 0, total = 0;
  last20.forEach((it) => {
    const sig = signals[it.issueNumber];
    if (sig) {
      total++;
      const result = isK3 ? ((it.sum ?? 0) >= 11 ? "BIG" : "SMALL") : (parseInt(it.number || "0", 10) >= 5 ? "BIG" : "SMALL");
      if (result === sig.type) acc++;
    }
  });
  const accuracy = total ? Math.round((acc / total) * 100) : 0;
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Kpi label="Tracked" value={String(items.length)} color="var(--neon-cyan)" />
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
      <div className="mt-2 font-display text-3xl font-bold" style={{ color, textShadow: `0 0 16px color-mix(in oklab, ${color} 40%, transparent)` }}>{value}</div>
    </div>
  );
}

function OtherGames({ currentId }: { currentId: string }) {
  const others = GAMES.filter((g) => g.id !== currentId).slice(0, 6);
  return (
    <section>
      <h3 className="mb-3 font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">Other Games</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {others.map((g) => (
          <Link
            key={g.id}
            to="/game/$gameId"
            params={{ gameId: g.id }}
            className="glass flex items-center gap-2 rounded-xl px-3 py-2 transition hover:border-primary"
          >
            <span className="text-lg">{g.emoji}</span>
            <span className="font-mono text-[11px] truncate">{g.shortLabel}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
