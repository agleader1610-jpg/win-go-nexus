import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldAlert, Fingerprint, Loader2, Sparkles } from "lucide-react";
import { Particles } from "./Particles";
import { unlock as passgateUnlock, reasonToMessage, TELEGRAM_CHANNEL } from "@/lib/passgate";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [shake, setShake] = useState(false);
  const [denied, setDenied] = useState(false);
  const [errMsg, setErrMsg] = useState("Access denied");
  const [unlocking, setUnlocking] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying || unlocking) return;
    setVerifying(true);
    setDenied(false);
    const res = await passgateUnlock(pw);
    if (res.ok) {
      setUnlocking(true);
      setTimeout(() => onUnlock(), 700);
    } else {
      setErrMsg(reasonToMessage(res.reason));
      setShake(true);
      setDenied(true);
      setTimeout(() => setShake(false), 600);
    }
    setVerifying(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <Particles count={30} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: unlocking ? 0 : 1, scale: unlocking ? 1.08 : 1 }}
        transition={{ duration: 0.5 }}
        className={`glass-strong relative w-full max-w-md rounded-3xl p-8 ${shake ? "shake" : ""}`}
      >
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 4, -4, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
            className="relative grid size-20 place-items-center rounded-2xl"
            style={{ background: "var(--gradient-cyber)", boxShadow: "var(--shadow-neon-cyan)" }}
          >
            <Sparkles className="size-9 text-white" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold gradient-text">SIGNALWIN</h1>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">AI Signal Engine</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="relative">
            <Fingerprint className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              type="password"
              aria-label="Access Key"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setDenied(false); }}
              placeholder="ENTER ACCESS KEY"
              className="w-full rounded-xl border border-border bg-input px-10 py-3 font-mono text-sm tracking-[0.3em] text-foreground outline-none transition focus:border-primary"
            />
          </div>

          {denied && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs"
              style={{ color: "var(--neon-red)" }}
            >
              <ShieldAlert className="size-4" />
              <span className="font-mono tracking-widest uppercase">{errMsg}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={verifying || unlocking}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 font-display font-bold uppercase tracking-[0.3em] text-primary-foreground transition hover:scale-[1.02] disabled:opacity-60"
            style={{ background: "var(--gradient-cyber)", boxShadow: "var(--shadow-neon-cyan)" }}
          >
            {(verifying || unlocking) && <Loader2 className="size-4 animate-spin" />}
            <Lock className="size-4" />
            <span>{unlocking ? "Granting..." : verifying ? "Verifying..." : "Unlock System"}</span>
          </button>
        </form>

        <a
          href={TELEGRAM_CHANNEL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-primary transition hover:border-primary/60 hover:bg-primary/15"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
          </svg>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">
            Get Password on Telegram
          </span>
        </a>

        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Server-verified · secured key
        </p>
      </motion.div>
    </div>
  );
}
