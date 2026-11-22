import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { GAMES } from "./games.config";

export interface RawDraw {
  issueNumber: string;
  number: string;
  color: string;
  sum: number;
}

export const fetchAllHistory = createServerFn({ method: "GET" }).handler(async () => {
  const out: Record<string, RawDraw[]> = {};
  await Promise.all(
    GAMES.map(async (g) => {
      const { data, error } = await supabaseAdmin
        .from("game_history")
        .select("issue_number, number, color, sum")
        .eq("game_type", g.id)
        .order("issue_number", { ascending: false })
        .limit(1000);
      if (error) {
        out[g.id] = [];
        return;
      }
      out[g.id] = (data ?? []).map((r) => ({
        issueNumber: r.issue_number,
        number: r.number !== null ? String(r.number) : "0",
        color: r.color ?? "",
        sum: r.sum ?? 0,
      }));
    }),
  );
  return { ok: true as const, history: out, fetchedAt: Date.now() };
});
