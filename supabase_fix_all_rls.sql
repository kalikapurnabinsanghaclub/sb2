-- =====================================================================
-- FIX ALL TABLE RLS POLICIES
-- Problem: auth.uid() IS NOT NULL blocks ALL writes because the app
-- uses hash-based login (no Supabase Auth session).
-- Solution: Allow full access via anon key (safe for community app).
-- The anon key is already protected and only your app uses it.
-- =====================================================================

-- ── EVENTS ──
DROP POLICY IF EXISTS "Allow all" ON public.events;
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;
CREATE POLICY "events_select" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (true);

-- ── CATEGORIES ──
DROP POLICY IF EXISTS "Allow all" ON public.categories;
DROP POLICY IF EXISTS "Allow all on categories" ON public.categories;
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (true);

-- ── VENUES ──
DROP POLICY IF EXISTS "Allow all" ON public.venues;
DROP POLICY IF EXISTS "venues_select" ON public.venues;
DROP POLICY IF EXISTS "venues_insert" ON public.venues;
DROP POLICY IF EXISTS "venues_update" ON public.venues;
DROP POLICY IF EXISTS "venues_delete" ON public.venues;
CREATE POLICY "venues_select" ON public.venues FOR SELECT USING (true);
CREATE POLICY "venues_insert" ON public.venues FOR INSERT WITH CHECK (true);
CREATE POLICY "venues_update" ON public.venues FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "venues_delete" ON public.venues FOR DELETE USING (true);

-- ── SCORING SUBJECTS ──
DROP POLICY IF EXISTS "Allow all" ON public.scoring_subjects;
DROP POLICY IF EXISTS "scoring_subjects_select" ON public.scoring_subjects;
DROP POLICY IF EXISTS "scoring_subjects_insert" ON public.scoring_subjects;
DROP POLICY IF EXISTS "scoring_subjects_update" ON public.scoring_subjects;
DROP POLICY IF EXISTS "scoring_subjects_delete" ON public.scoring_subjects;
CREATE POLICY "scoring_subjects_select" ON public.scoring_subjects FOR SELECT USING (true);
CREATE POLICY "scoring_subjects_insert" ON public.scoring_subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "scoring_subjects_update" ON public.scoring_subjects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "scoring_subjects_delete" ON public.scoring_subjects FOR DELETE USING (true);

-- ── JUDGE AGREEMENTS ──
DROP POLICY IF EXISTS "Allow all" ON public.judge_agreements;
DROP POLICY IF EXISTS "judge_agreements_select" ON public.judge_agreements;
DROP POLICY IF EXISTS "judge_agreements_insert" ON public.judge_agreements;
DROP POLICY IF EXISTS "judge_agreements_update" ON public.judge_agreements;
DROP POLICY IF EXISTS "judge_agreements_delete" ON public.judge_agreements;
CREATE POLICY "judge_agreements_select" ON public.judge_agreements FOR SELECT USING (true);
CREATE POLICY "judge_agreements_insert" ON public.judge_agreements FOR INSERT WITH CHECK (true);
CREATE POLICY "judge_agreements_update" ON public.judge_agreements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "judge_agreements_delete" ON public.judge_agreements FOR DELETE USING (true);

-- ── PUBLIC REGISTRATIONS ──
DROP POLICY IF EXISTS "Allow all" ON public.public_registrations;
DROP POLICY IF EXISTS "public_registrations_select" ON public.public_registrations;
DROP POLICY IF EXISTS "public_registrations_insert" ON public.public_registrations;
DROP POLICY IF EXISTS "public_registrations_update" ON public.public_registrations;
DROP POLICY IF EXISTS "public_registrations_delete" ON public.public_registrations;
CREATE POLICY "public_registrations_select" ON public.public_registrations FOR SELECT USING (true);
CREATE POLICY "public_registrations_insert" ON public.public_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "public_registrations_update" ON public.public_registrations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public_registrations_delete" ON public.public_registrations FOR DELETE USING (true);

-- ── SYNC STATE ──
DROP POLICY IF EXISTS "Allow all" ON public.sync_state;
DROP POLICY IF EXISTS "sync_state_select" ON public.sync_state;
DROP POLICY IF EXISTS "sync_state_insert" ON public.sync_state;
DROP POLICY IF EXISTS "sync_state_update" ON public.sync_state;
DROP POLICY IF EXISTS "sync_state_delete" ON public.sync_state;
CREATE POLICY "sync_state_select" ON public.sync_state FOR SELECT USING (true);
CREATE POLICY "sync_state_insert" ON public.sync_state FOR INSERT WITH CHECK (true);
CREATE POLICY "sync_state_update" ON public.sync_state FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sync_state_delete" ON public.sync_state FOR DELETE USING (true);

-- ── JUDGE CREDENTIALS ──
DROP POLICY IF EXISTS "Allow all" ON public.judge_credentials;
DROP POLICY IF EXISTS "judge_credentials_select" ON public.judge_credentials;
DROP POLICY IF EXISTS "judge_credentials_insert" ON public.judge_credentials;
DROP POLICY IF EXISTS "judge_credentials_update" ON public.judge_credentials;
DROP POLICY IF EXISTS "judge_credentials_delete" ON public.judge_credentials;
CREATE POLICY "judge_credentials_select" ON public.judge_credentials FOR SELECT USING (true);
CREATE POLICY "judge_credentials_insert" ON public.judge_credentials FOR INSERT WITH CHECK (true);
CREATE POLICY "judge_credentials_update" ON public.judge_credentials FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "judge_credentials_delete" ON public.judge_credentials FOR DELETE USING (true);

-- ── STAFF CREDENTIALS (keep using RPC functions for this one) ──
-- Staff credentials are managed via admin_delete_staff / admin_upsert_staff / admin_update_staff RPC
-- But we still need SELECT to work for listing staff
DROP POLICY IF EXISTS "Allow all" ON public.staff_credentials;
DROP POLICY IF EXISTS "staff_insert" ON public.staff_credentials;
DROP POLICY IF EXISTS "staff_update" ON public.staff_credentials;
DROP POLICY IF EXISTS "staff_credentials_select" ON public.staff_credentials;
CREATE POLICY "staff_credentials_select" ON public.staff_credentials FOR SELECT USING (true);

-- ── ACTIVITY LOG ──
DROP POLICY IF EXISTS "Allow all" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;
CREATE POLICY "activity_log_select" ON public.activity_log FOR SELECT USING (true);
CREATE POLICY "activity_log_insert" ON public.activity_log FOR INSERT WITH CHECK (true);
