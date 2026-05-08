import { motion, AnimatePresence } from "framer-motion";
import { Settings2, X } from "lucide-react";
import type { AdminSettings } from "@/hooks/useWingoData";

export function AdminPanel({
  open, onClose, settings, setSettings, onClear,
}: {
  open: boolean;
  onClose: () => void;
  settings: AdminSettings;
  setSettings: (s: AdminSettings) => void;
  onClear: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-md rounded-2xl p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                <h3 className="font-display text-sm uppercase tracking-[0.3em]">Admin Console</h3>
              </div>
              <button onClick={onClose} className="rounded-lg p-1 hover:bg-secondary/50">
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label={`Refresh rate · ${settings.refreshMs / 1000}s`}>
                <input
                  type="range" min={2000} max={15000} step={1000}
                  value={settings.refreshMs}
                  onChange={(e) => setSettings({ ...settings, refreshMs: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </Field>

              <Field label={`Confidence range · ${settings.confRange[0]}% – ${settings.confRange[1]}%`}>
                <div className="flex gap-2">
                  <input type="number" min={1} max={99}
                    className="w-1/2 rounded-lg border border-border bg-input/40 px-2 py-1 font-mono text-xs"
                    value={settings.confRange[0]}
                    onChange={(e) => setSettings({ ...settings, confRange: [Number(e.target.value), settings.confRange[1]] })}
                  />
                  <input type="number" min={1} max={99}
                    className="w-1/2 rounded-lg border border-border bg-input/40 px-2 py-1 font-mono text-xs"
                    value={settings.confRange[1]}
                    onChange={(e) => setSettings({ ...settings, confRange: [settings.confRange[0], Number(e.target.value)] })}
                  />
                </div>
              </Field>

              <Toggle label="Visual effects" value={settings.effects} onChange={(v) => setSettings({ ...settings, effects: v })} />
              <Toggle label="Sound feedback" value={settings.sounds} onChange={(v) => setSettings({ ...settings, sounds: v })} />

              <button
                onClick={() => { onClear(); onClose(); }}
                className="w-full rounded-xl border border-destructive/50 bg-destructive/10 py-2 font-mono text-xs uppercase tracking-widest text-neon-red transition hover:bg-destructive/20"
                style={{ color: "var(--neon-red)" }}
              >
                Clear History
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/30 px-3 py-2">
      <span className="font-mono text-xs">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-primary/40" : "bg-secondary"}`}
        style={value ? { boxShadow: "0 0 12px var(--neon-cyan)" } : {}}
      >
        <span
          className="absolute top-0.5 size-5 rounded-full bg-foreground transition-all"
          style={{ left: value ? "22px" : "2px", background: value ? "var(--neon-cyan)" : "oklch(0.6 0 0)" }}
        />
      </button>
    </div>
  );
}
