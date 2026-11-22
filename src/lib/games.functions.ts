import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildSignals,
  ingestGame,
  ingestAllGames,
  readRecent,
  toApiShape,
  type ServerSignal,
} from "./games.server";
import { getGame } from "./games.config";

export const verifyPassword = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const expected = process.env.WINGO_ACCESS_PASSWORD;
    if (!expected) return { ok: false as const, error: "Server password not configured" };
    const a = data.password;
    const b = expected;
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    if (diff !== 0) return { ok: false as const, error: "Invalid access key" };
    const token = btoa(`${Date.now()}:${expected.length}:winpro`);
    return { ok: true as const, token };
  });

export const fetchGameData = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ gameId: z.string().min(1).max(50) }).parse(input),
  )
  .handler(async ({ data }) => {
    const cfg = getGame(data.gameId);
    if (!cfg) return { ok: false as const, error: "Unknown game" };
    try {
      let rows = await readRecent(data.gameId, 60);
      if (rows.length === 0) {
        try { await ingestGame(cfg); } catch { /* ignore */ }
        rows = await readRecent(data.gameId, 60);
      }
      return {
        ok: true as const,
        data: toApiShape(data.gameId, rows),
        signals: buildSignals(data.gameId, rows),
        fetchedAt: Date.now(),
      };
    } catch (e) {
      return {
        ok: false as const,
        error: (e as Error).message,
        signals: {} as Record<string, ServerSignal>,
      };
    }
  });

export const ingestAllNow = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const result = await ingestAllGames();
    return { ok: true as const, result };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
});

export const fetchAllLatest = createServerFn({ method: "GET" }).handler(async () => {
  const { GAMES } = await import("./games.config");
  const results = await Promise.all(
    GAMES.map(async (g) => {
      try {
        const rows = await readRecent(g.id, 1);
        const latest = rows[0];
        const currentIssue = latest?.issue_number ?? "";
        const nextIssue = currentIssue ? (BigInt(currentIssue) + 1n).toString() : "";
        return {
          id: g.id,
          currentIssue,
          nextIssue,
          lastNumber: latest?.number ?? null,
          lastSum: latest?.sum ?? null,
          lastColor: latest?.color ?? null,
        };
      } catch {
        return { id: g.id, currentIssue: "", nextIssue: "", lastNumber: null, lastSum: null, lastColor: null };
      }
    }),
  );
  return { ok: true as const, latest: results, fetchedAt: Date.now() };
});

