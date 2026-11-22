const PASSGATE = {
  base: "https://passgate.eip.lat",
  key: "pgk_live_BWDgUF4A_iQcxKyin8ASx35U18Lr60I5",
  store: "passgate_token",
};

export type UnlockResult = { ok: true } | { ok: false; reason?: string };

export async function unlock(password: string): Promise<UnlockResult> {
  try {
    const res = await fetch(PASSGATE.base + "/api/public/v1/verify", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": PASSGATE.key },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!data?.valid) return { ok: false, reason: data?.reason };
    localStorage.setItem(
      PASSGATE.store,
      JSON.stringify({ token: data.token, expiresAt: data.expiresAt }),
    );
    return { ok: true };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

export async function isUnlocked(): Promise<boolean> {
  try {
    const raw = localStorage.getItem(PASSGATE.store);
    if (!raw) return false;
    const { token, expiresAt } = JSON.parse(raw);
    if (!token || new Date(expiresAt) <= new Date()) {
      localStorage.removeItem(PASSGATE.store);
      return false;
    }
    const res = await fetch(PASSGATE.base + "/api/public/v1/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!data?.valid) localStorage.removeItem(PASSGATE.store);
    return data?.valid === true;
  } catch {
    return false;
  }
}

export function lock() {
  localStorage.removeItem(PASSGATE.store);
}

export function reasonToMessage(reason?: string): string {
  switch (reason) {
    case "rate_limited":
      return "Too many attempts, try later";
    case "network_error":
      return "Network error";
    case "password_not_set":
    case "app_disabled":
      return "Access temporarily unavailable";
    default:
      return "Wrong password";
  }
}

export const TELEGRAM_CHANNEL = "https://t.me/Eip_trader/24010";
export const TELEGRAM_SUPPORT = "https://t.me/teacher_eip";
