import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const UPSTREAM = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
} as const;

interface UpstreamItem {
  issueNumber: string;
  number: string;
  color?: string;
  premium?: string;
  sum?: number;
}

async function ingest() {
  const r = await fetch(UPSTREAM, {
    cache: "no-store",
    headers: { "user-agent": "Mozilla/5.0 WingoCron" },
  });
  if (!r.ok) throw new Error(`Upstream ${r.status}`);
  const json = (await r.json()) as { data?: { list?: UpstreamItem[] } };
  const list = json?.data?.list ?? [];
  if (!list.length) return { inserted: 0, total: 0 };

  const rows = list.map((it) => ({
    issue_number: it.issueNumber,
    number: parseInt(it.number, 10),
    color: it.color ?? null,
    premium: it.premium ?? null,
    sum: typeof it.sum === "number" ? it.sum : null,
  }));

  const { error } = await supabaseAdmin
    .from("wingo_history")
    .upsert(rows, { onConflict: "issue_number", ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  // Trim to last 1000 rows
  await supabaseAdmin.rpc("trim_wingo_history");

  return { inserted: rows.length, total: rows.length };
}

const handler = async () => {
  try {
    const result = await ingest();
    return new Response(
      JSON.stringify({ ok: true, ...result, ts: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS } },
    );
  }
};

export const Route = createFileRoute("/api/public/wingo-ingest")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: handler,
      POST: handler,
    },
  },
});
