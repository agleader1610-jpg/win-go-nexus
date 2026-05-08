import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Cache-Control": "public, max-age=2, s-maxage=2",
} as const;

export const Route = createFileRoute("/api/public/wingo-history")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
          const limit = Math.min(
            100,
            Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10) || 10),
          );
          const from = (page - 1) * limit;
          const to = from + limit - 1;

          const { data, error, count } = await supabaseAdmin
            .from("wingo_history")
            .select("issue_number, number, color, premium, sum, recorded_at", {
              count: "exact",
            })
            .order("issue_number", { ascending: false })
            .range(from, to);

          if (error) throw error;

          const items = (data ?? []).map((r) => ({
            period: r.issue_number,
            number: r.number,
            color: r.color,
            premium: r.premium,
            sum: r.sum,
            big_small: r.number >= 5 ? "BIG" : "SMALL",
            recorded_at: r.recorded_at,
          }));

          return new Response(
            JSON.stringify({
              ok: true,
              page,
              limit,
              total: count ?? items.length,
              count: items.length,
              items,
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
