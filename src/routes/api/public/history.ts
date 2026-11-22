import { createFileRoute } from "@tanstack/react-router";
import { readPaged } from "@/lib/games.server";
import { getGame, GAMES } from "@/lib/games.config";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Cache-Control": "public, max-age=2, s-maxage=2",
} as const;

export const Route = createFileRoute("/api/public/history")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const gameId = url.searchParams.get("game") ?? "wingo_30s";
          const cfg = getGame(gameId);
          if (!cfg) {
            return new Response(
              JSON.stringify({ ok: false, error: "Unknown game", available: GAMES.map((g) => g.id) }),
              { status: 400, headers: { "Content-Type": "application/json", ...CORS } },
            );
          }
          const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
          const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10) || 10));
          const { rows, total } = await readPaged(gameId, page, limit);
          const items = rows.map((r) => ({
            period: r.issue_number,
            number: r.number,
            color: r.color,
            premium: r.premium,
            sum: r.sum,
            big_small:
              cfg.kind === "k3"
                ? ((r.sum ?? 0) >= 11 ? "BIG" : "SMALL")
                : ((r.number ?? 0) >= 5 ? "BIG" : "SMALL"),
            block_hash: r.block_hash,
            recorded_at: r.recorded_at,
          }));
          return new Response(
            JSON.stringify({
              ok: true,
              game: { id: cfg.id, label: cfg.label, kind: cfg.kind, periodSec: cfg.periodSec },
              page, limit, total, count: items.length, items,
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...CORS } },
          );
        } catch (e) {
          return new Response(
            JSON.stringify({ ok: false, error: (e as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }
      },
    },
  },
});
