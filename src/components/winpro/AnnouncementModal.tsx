import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, AlertTriangle, Gift, LifeBuoy } from "lucide-react";
import { TELEGRAM_CHANNEL, TELEGRAM_SUPPORT } from "@/lib/passgate";

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
  </svg>
);

export function AnnouncementModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("sw_notice_seen")) {
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    sessionStorage.setItem("sw_notice_seen", "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center px-4"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={close} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            role="dialog"
            aria-modal="true"
            aria-label="Important notice"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card/95 shadow-[var(--shadow-glass)] backdrop-blur-xl"
          >
            <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />

            <button
              type="button"
              onClick={close}
              aria-label="Close notice"
              className="absolute right-3 top-4 grid size-8 place-items-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                  <ShieldCheck className="size-4" />
                </span>
                <div className="leading-tight">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                    Official Notice
                  </div>
                  <h2 className="font-display text-lg font-black text-foreground">
                    গুরুত্বপূর্ণ বিজ্ঞপ্তি
                  </h2>
                </div>
              </div>

              <ul className="mt-4 space-y-2.5">
                <li className="flex gap-2.5 rounded-2xl border border-border/60 bg-background/40 p-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <p className="text-[13px] leading-relaxed text-foreground/90">
                    আমাদের হ্যাক <b>অন্য কারও কাছ থেকে কেনা থেকে বিরত থাকুন</b> — scam এর শিকার হবেন না।
                  </p>
                </li>
                <li className="flex gap-2.5 rounded-2xl border border-border/60 bg-background/40 p-3">
                  <Gift className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <p className="text-[13px] leading-relaxed text-foreground/90">
                    আমরা সবকিছু <b>সম্পূর্ণ ফ্রিতে</b> দিয়ে থাকি, কোনো টাকা লাগে না।
                  </p>
                </li>
                <li className="flex gap-2.5 rounded-2xl border border-border/60 bg-background/40 p-3">
                  <LifeBuoy className="mt-0.5 size-4 shrink-0 text-cyan-400" />
                  <p className="text-[13px] leading-relaxed text-foreground/90">
                    সিস্টেমে কোনো সমস্যা দেখা দিলে দ্রুত জানান —{" "}
                    <a
                      href={TELEGRAM_SUPPORT}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary underline underline-offset-2"
                    >
                      t.me/teacher_eip
                    </a>
                  </p>
                </li>
              </ul>

              <p className="mt-3 text-center text-[12px] leading-relaxed text-muted-foreground">
                হ্যাক ও অন্যান্য সকল বিষয়ের প্রেডিকশন হ্যাক নিতে আমাদের চ্যানেলে যোগাযোগ করুন।
              </p>

              <a
                href={TELEGRAM_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-display text-sm font-black uppercase tracking-[0.2em] text-primary-foreground transition hover:scale-[1.02]"
                style={{ background: "var(--gradient-cyber)", boxShadow: "var(--shadow-neon-cyan)" }}
              >
                <TelegramIcon className="size-4" />
                Join Telegram Channel
              </a>

              <button
                type="button"
                onClick={close}
                className="mt-2 w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground transition hover:text-foreground"
              >
                বুঝেছি, বন্ধ করুন
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
