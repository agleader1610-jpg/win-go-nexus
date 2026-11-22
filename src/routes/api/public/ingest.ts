import { createFileRoute } from "@tanstack/react-router";
import { ingestAllGames } from "@/lib/games.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
} as const;

const handler = async () => {
  try {
    const result = await ingestAllGames();
    return new Response(
      JSON.stringify({ ok: true, result, ts: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS } },
    );
  }
};

export const Route = createFileRoute("/api/public/ingest")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: handler,
      POST: handler,
    },
  },
});
