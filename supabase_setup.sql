-- ============================================================
-- KNSDC Supabase Setup Script
-- Run this ONCE in your Supabase project → SQL Editor
-- Project: https://mmbtfbxxnprtzpzdklot.supabase.co
-- ============================================================

-- Step 1: Create judge_credentials table
-- Stores judge login credentials created by the Monitor
CREATE TABLE IF NOT EXISTS public.judge_credentials (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,          -- SHA-256 hex hash of the password
  name          TEXT NOT NULL,
  event_id      TEXT,
  agreement_id  BIGINT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE public.judge_credentials ENABLE ROW LEVEL SECURITY;

-- Step 3: Allow anyone to SELECT (needed for login check)
CREATE POLICY "Public can read judge credentials for login"
  ON public.judge_credentials
  FOR SELECT
  USING (true);

-- Step 4: Allow anyone to INSERT/UPDATE (monitor saves credentials)
CREATE POLICY "Anyone can upsert judge credentials"
  ON public.judge_credentials
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 5: Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS judge_credentials_updated_at ON public.judge_credentials;
CREATE TRIGGER judge_credentials_updated_at
  BEFORE UPDATE ON public.judge_credentials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DONE! The judge_credentials table is ready.
-- Now the Monitor can create judge logins from the Agreement form.
-- ============================================================
