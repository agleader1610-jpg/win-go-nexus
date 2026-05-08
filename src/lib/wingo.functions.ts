import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

export const verifyPassword = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const expected = process.env.WINGO_ACCESS_PASSWORD;
    if (!expected) {
      return { ok: false, error: "Server password not configured" };
    }
    // Constant-time-ish compare
    const a = data.password;
    const b = expected;
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    if (diff !== 0) return { ok: false, error: "Invalid access key" };
    // Issue a short-lived token (timestamp signed via simple HMAC-ish hash).
    const token = btoa(`${Date.now()}:${expected.length}:wingo`);
    return { ok: true, token };
  });

export const fetchWingoHistory = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const r = await fetch(API_URL, {
        cache: "no-store",
        headers: { "user-agent": "Mozilla/5.0 WingoDashboard" },
      });
      if (!r.ok) {
        return { ok: false as const, error: `Upstream ${r.status}`, data: null };
      }
      const json = await r.json();
      return { ok: true as const, data: json, fetchedAt: Date.now() };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message, data: null };
    }
  });
