-- Migration: add season_award_winners table to allow multiple winners per award
-- 1) Create table
CREATE TABLE IF NOT EXISTS public.season_award_winners (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  award_id uuid REFERENCES public.season_awards(id) ON DELETE CASCADE,
  winner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc', now())
);

-- 2) Migrate existing single-winner values into the new table
INSERT INTO public.season_award_winners (award_id, winner_id)
SELECT id, winner_id FROM public.season_awards WHERE winner_id IS NOT NULL;

-- 3) (Optional) Drop the legacy winner_id column from season_awards once verified
-- ALTER TABLE public.season_awards DROP COLUMN IF EXISTS winner_id;

-- 4) Index for lookups
CREATE INDEX IF NOT EXISTS idx_season_award_winners_award_id ON public.season_award_winners(award_id);

COMMIT;
