-- ==============================================================================
-- KNSDC SCHEMA PATCH: Categories, Venues & Scoring Subjects Persistence
-- Run this in Supabase Dashboard -> SQL Editor -> Click "Run"
-- ==============================================================================

-- 1. Ensure categories columns exist
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS age_min INTEGER;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS age_max INTEGER;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS event_id BIGINT;

-- 2. Ensure venues columns exist
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS dates TEXT[];
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS event_id BIGINT;

-- 3. Ensure scoring_subjects columns exist
ALTER TABLE public.scoring_subjects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.scoring_subjects ADD COLUMN IF NOT EXISTS max_marks INTEGER DEFAULT 10;
ALTER TABLE public.scoring_subjects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.scoring_subjects ADD COLUMN IF NOT EXISTS event_id BIGINT;

-- 4. Notify PostgREST schema cache to reload immediately
NOTIFY pgrst, 'reload schema';
