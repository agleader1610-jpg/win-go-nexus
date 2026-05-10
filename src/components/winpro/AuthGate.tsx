import { useEffect, useState } from "react";
import { LockScreen } from "./LockScreen";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(!!sessionStorage.getItem("winpro_auth"));
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;
  return <>{children}</>;
}
