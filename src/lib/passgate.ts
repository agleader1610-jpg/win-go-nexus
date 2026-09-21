const PASSGATE = {
  store: "passgate_token",
};

function authUrl(): string {
  const path = `${(import.meta.env.BASE_URL || "/").replace(/\/+$/, "")}/api/auth.php`;
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

async function authRequest(payload: Record<string, string>) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6_000);
  try {
    const res = await fetch(authUrl(), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return { valid: false, reason: res.status === 429 ? "rate_limited" : "unavailable" };
    return await res.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

export type UnlockResult = { ok: true } | { ok: false; reason?: string };

export async function unlock(password: string): Promise<UnlockResult> {
  try {
    const data = await authRequest({ action: "verify", password });
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
    const data = await authRequest({ action: "session", token });
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
    case "unavailable":
      return "Access service unavailable";
    case "password_not_set":
    case "app_disabled":
      return "Access temporarily unavailable";
    default:
      return "Wrong password";
  }
}

export const TELEGRAM_CHANNEL = "https://t.me/Eip_trader/24010";
export const TELEGRAM_SUPPORT = "https://t.me/teacher_eip";
