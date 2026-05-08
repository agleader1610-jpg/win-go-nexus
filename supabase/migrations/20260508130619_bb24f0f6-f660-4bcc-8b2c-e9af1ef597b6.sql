
-- Unified game history table for all 9 games (WinGo 30s/1M/3M/5M, K3 1M/3M/5M/10M, TrxWinGo 1M)

-- 1. Add new columns
ALTER TABLE public.wingo_history
  ADD COLUMN IF NOT EXISTS game_type text NOT NULL DEFAULT 'wingo_30s',
  ADD COLUMN IF NOT EXISTS block_hash text;

-- 2. Allow nullable number (K3 doesn't have single number)
ALTER TABLE public.wingo_history ALTER COLUMN number DROP NOT NULL;

-- 3. Recreate primary key as composite (game_type, issue_number)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wingo_history_pkey') THEN
    ALTER TABLE public.wingo_history DROP CONSTRAINT wingo_history_pkey;
  END IF;
END $$;

ALTER TABLE public.wingo_history ADD PRIMARY KEY (game_type, issue_number);

-- 4. Rename to generic name
ALTER TABLE public.wingo_history RENAME TO game_history;

-- 5. Index for fast latest-per-game lookup
CREATE INDEX IF NOT EXISTS idx_game_history_type_issue
  ON public.game_history (game_type, issue_number DESC);

-- 6. Replace trim function: keep last 1000 per game
DROP FUNCTION IF EXISTS public.trim_wingo_history();

CREATE OR REPLACE FUNCTION public.trim_game_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.game_history gh
  USING (
    SELECT game_type, issue_number,
           ROW_NUMBER() OVER (PARTITION BY game_type ORDER BY issue_number DESC) AS rn
    FROM public.game_history
  ) ranked
  WHERE gh.game_type = ranked.game_type
    AND gh.issue_number = ranked.issue_number
    AND ranked.rn > 1000;
END;
$$;

-- 7. RLS already enabled; existing public read policy still applies (table renamed keeps policies)
