-- ══════════════════════════════════════════════════════════════════════════
-- KNSDC Events Table - Complete Column Fix
-- Run this ENTIRE script in Supabase SQL Editor to fix all save errors
-- ══════════════════════════════════════════════════════════════════════════

-- Step 1: Add ALL columns the admin portal needs (IF NOT EXISTS = safe to re-run)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS title          TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS date           TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS time           TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue          TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description    TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image          TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category       TEXT    DEFAULT 'cultural';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer      TEXT    DEFAULT 'Kalikapur Nabin Sangha';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS active         BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date       TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_time       TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS capacity       INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS form_fields    JSONB   DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS switch_states  JSONB   DEFAULT '{}'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS round_schedules JSONB  DEFAULT '{}'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS "publicReg"    BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS "stagePreview" BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS "resultPublic" BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Make sure RLS is not blocking writes
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Step 3: Confirm - show all columns now in the events table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'events'
ORDER BY ordinal_position;
