import { useEffect, useState } from "react";
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

  if (!ready) return null;
  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;
  return <>{children}</>;
}
