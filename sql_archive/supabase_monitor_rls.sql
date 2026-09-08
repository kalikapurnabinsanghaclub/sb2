-- ==========================================
-- SUPABASE SECURITY: MONITOR PORTAL RLS
-- Run this in the Supabase SQL Editor to secure backend tables.
-- ==========================================

-- Enable Row Level Security (RLS)
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_credentials ENABLE ROW LEVEL SECURITY;

-- 1. sync_state
-- The ecosystem uses anon keys for syncing. We allow read/write but strictly forbid deletion
-- of the master state to prevent catastrophic data loss.
DROP POLICY IF EXISTS "sync_state_select" ON public.sync_state;
CREATE POLICY "sync_state_select" ON public.sync_state FOR SELECT USING (true);

DROP POLICY IF EXISTS "sync_state_insert" ON public.sync_state;
CREATE POLICY "sync_state_insert" ON public.sync_state FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "sync_state_update" ON public.sync_state;
CREATE POLICY "sync_state_update" ON public.sync_state FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sync_state_delete" ON public.sync_state;
CREATE POLICY "sync_state_delete" ON public.sync_state FOR DELETE USING (false);

-- 2. staff_credentials
-- Allow reading so the localSync client can verify password hashes.
DROP POLICY IF EXISTS "staff_read" ON public.staff_credentials;
CREATE POLICY "staff_read" ON public.staff_credentials FOR SELECT USING (true);

-- Allow upserts (so Admins can add staff from the app), but we don't allow deletes.
DROP POLICY IF EXISTS "staff_insert" ON public.staff_credentials;
CREATE POLICY "staff_insert" ON public.staff_credentials FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "staff_update" ON public.staff_credentials;
CREATE POLICY "staff_update" ON public.staff_credentials FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "staff_delete" ON public.staff_credentials;
CREATE POLICY "staff_delete" ON public.staff_credentials FOR DELETE USING (false);

-- 3. judge_credentials
DROP POLICY IF EXISTS "judge_read" ON public.judge_credentials;
CREATE POLICY "judge_read" ON public.judge_credentials FOR SELECT USING (true);

DROP POLICY IF EXISTS "judge_insert" ON public.judge_credentials;
CREATE POLICY "judge_insert" ON public.judge_credentials FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "judge_update" ON public.judge_credentials;
CREATE POLICY "judge_update" ON public.judge_credentials FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "judge_delete" ON public.judge_credentials;
CREATE POLICY "judge_delete" ON public.judge_credentials FOR DELETE USING (false);
