-- ══════════════════════════════════════════════════════════════════════════
-- Add staff column to events table to persist event staff assignments
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS staff JSONB DEFAULT '[]'::jsonb;
