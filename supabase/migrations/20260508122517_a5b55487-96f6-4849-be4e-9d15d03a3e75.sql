
-- History table
CREATE TABLE IF NOT EXISTS public.wingo_history (
  issue_number TEXT PRIMARY KEY,
  number SMALLINT NOT NULL,
  color TEXT,
  premium TEXT,
  sum INTEGER,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wingo_history_issue_desc_idx
  ON public.wingo_history (issue_number DESC);

-- Public read; no public write (writes only via service role from server route)
ALTER TABLE public.wingo_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wingo_history public read" ON public.wingo_history;
CREATE POLICY "wingo_history public read"
  ON public.wingo_history FOR SELECT
  USING (true);

-- Trim old rows: keep newest 1000
CREATE OR REPLACE FUNCTION public.trim_wingo_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.wingo_history
  WHERE issue_number IN (
    SELECT issue_number FROM public.wingo_history
    ORDER BY issue_number DESC
    OFFSET 1000
  );
END;
$$;
