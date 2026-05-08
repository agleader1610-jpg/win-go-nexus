import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldAlert, Fingerprint, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Particles } from "./Particles";
import { verifyPassword } from "@/lib/wingo.functions";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [shake, setShake] = useState(false);
  const [denied, setDenied] = useState(false);
  const [errMsg, setErrMsg] = useState("Access denied");
  const [unlocking, setUnlocking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const verify = useServerFn(verifyPassword);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying || unlocking) return;
    setVerifying(true);
    setDenied(false);
    try {
      const res = await verify({ data: { password: pw } });
      if (res.ok) {
        setUnlocking(true);
        sessionStorage.setItem("wingo_auth", res.token ?? "1");
        setTimeout(() => onUnlock(), 800);
      } else {
        setErrMsg(res.error ?? "Access denied");
        setShake(true);
        setDenied(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setErrMsg("Network error");
      setShake(true);
      setDenied(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <Particles count={40} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: unlocking ? 0 : 1, scale: unlocking ? 1.1 : 1 }}
        transition={{ duration: 0.6 }}
        className={`glass-strong relative w-full max-w-md rounded-3xl p-8 ${shake ? "shake" : ""}`}
        style={{ boxShadow: "0 0 60px oklch(0.68 0.27 22 / 0.4), 0 0 120px oklch(0.7 0.3 330 / 0.2)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="relative grid size-20 place-items-center rounded-full border border-neon-red"
            style={{ boxShadow: "var(--shadow-neon-red)" }}
          >
            <Lock className="size-9 text-neon-red" style={{ color: "var(--neon-red)" }} />
            <div className="absolute inset-0 animate-pulse-glow rounded-full" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold gradient-text">WINGO 30S</h1>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Hack Dashboard</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="relative">
            <Fingerprint className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setDenied(false); }}
              placeholder="ENTER ACCESS KEY"
              className="w-full rounded-xl border border-border bg-input/40 px-10 py-3 font-mono text-sm tracking-[0.3em] text-foreground outline-none transition focus:border-primary focus:shadow-[0_0_20px_oklch(0.78_0.22_195/0.4)]"
            />
          </div>

          {denied && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-neon-red"
            >
              <ShieldAlert className="size-4" />
              <span className="font-mono tracking-widest uppercase">{errMsg}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={verifying || unlocking}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-neon-red bg-gradient-to-r from-destructive/30 to-accent/20 px-4 py-3 font-display font-bold uppercase tracking-[0.3em] text-foreground transition hover:scale-[1.02] disabled:opacity-60"
            style={{ boxShadow: "var(--shadow-neon-red)" }}
          >
            {(verifying || unlocking) && <Loader2 className="size-4 animate-spin" />}
            <span className="relative z-10">{unlocking ? "Granting..." : verifying ? "Verifying..." : "Unlock System"}</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition group-hover:translate-x-full duration-1000" />
          </button>
        </form>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Server-verified access · secured key
        </p>
      </motion.div>
    </div>
  );
}
