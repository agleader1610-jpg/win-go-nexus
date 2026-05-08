import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildSignals,
  ingestUpstreamToDb,
  readRecentRows,
  toApiShape,
  type ServerSignal,
} from "./wingo.server";

export const verifyPassword = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const expected = process.env.WINGO_ACCESS_PASSWORD;
    if (!expected) {
      return { ok: false as const, error: "Server password not configured" };
    }
    const a = data.password;
    const b = expected;
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    if (diff !== 0) return { ok: false as const, error: "Invalid access key" };
    const token = btoa(`${Date.now()}:${expected.length}:wingo`);
    return { ok: true as const, token };
  });

export const fetchWingoHistory = createServerFn({ method: "GET" }).handler(async () => {
  try {
    let rows = await readRecentRows(60);
    if (rows.length === 0) {
      try { await ingestUpstreamToDb(); } catch { /* keep going */ }
      rows = await readRecentRows(60);
    }
    return {
      ok: true as const,
      data: toApiShape(rows),
      signals: buildSignals(rows),
      fetchedAt: Date.now(),
    };
  } catch (e) {
    return {
      ok: false as const,
      error: (e as Error).message,
      data: null,
      signals: {} as Record<string, ServerSignal>,
    };
  }
});
