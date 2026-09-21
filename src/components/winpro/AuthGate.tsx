import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { LockScreen } from "./LockScreen";
import { isUnlocked } from "@/lib/passgate";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    let alive = true;
    isUnlocked()
      .then((ok) => alive && setUnlocked(ok))
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" /> Checking access…
        </div>
      </div>
    );
  }
  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;
  return <>{children}</>;
}
