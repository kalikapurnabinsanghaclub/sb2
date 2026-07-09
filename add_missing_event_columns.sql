-- ══════════════════════════════════════════════════════════════
-- Migration: Add missing columns to public.events table
-- Run this in your Supabase SQL Editor to fix "error updating event in database"
-- ══════════════════════════════════════════════════════════════

-- Add end_date column (date the event ends)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add end_time column (time the event ends)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Add capacity column (max participants)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS capacity INTEGER;

-- Add round_schedules column (audition/qualified/semifinal/final schedules)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS round_schedules JSONB DEFAULT '{}'::jsonb;

-- Add switch_states column (if not already present from supabase_final_setup.sql)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS switch_states JSONB DEFAULT '{}'::jsonb;

-- Add org column alias (organizer is the DB column, org is used in code)
-- We keep 'organizer' as the real column, the code already maps org -> organizer

-- Confirm columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events'
ORDER BY ordinal_position;
