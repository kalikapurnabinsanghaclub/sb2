-- =====================================================================
-- SUPABASE SECURITY & LINTER COMPLIANCE PATCH
-- This script secures the database and resolves all linter warnings by:
-- 1. Restricting anon (public) access to SELECT (read-only) for public tables.
-- 2. Limiting database modifications (INSERT, UPDATE, DELETE) to authenticated staff.
-- 3. Securing trigger/admin SECURITY DEFINER functions from public execution.
-- =====================================================================

-- ══════════════════════════════════════════════════════════════
-- STEP 1: CLEAN UP OVERLY PERMISSIVE LINTER-BYPASS POLICIES
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Enable ALL access for anon on categories" ON public.categories;
DROP POLICY IF EXISTS "Enable ALL access for anon on donations" ON public.donations;
DROP POLICY IF EXISTS "Enable ALL access for anon on ecosystem_log" ON public.ecosystem_log;
DROP POLICY IF EXISTS "Enable ALL access for anon on events" ON public.events;
DROP POLICY IF EXISTS "Enable ALL access for anon on gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Enable ALL access for anon on judge_agreements" ON public.judge_agreements;
DROP POLICY IF EXISTS "Enable ALL access for anon on judge_credentials" ON public.judge_credentials;
DROP POLICY IF EXISTS "Enable ALL access for anon on knsdc-registration" ON public."knsdc-registration";
DROP POLICY IF EXISTS "Enable ALL access for anon on notices" ON public.notices;
DROP POLICY IF EXISTS "Enable ALL access for anon on partners" ON public.partners;
DROP POLICY IF EXISTS "Enable ALL access for anon on past_events" ON public.past_events;
DROP POLICY IF EXISTS "Enable ALL access for anon on public_messages" ON public.public_messages;
DROP POLICY IF EXISTS "Enable ALL access for anon on public_ratings" ON public.public_ratings;
DROP POLICY IF EXISTS "Enable ALL access for anon on public_registrations" ON public.public_registrations;
DROP POLICY IF EXISTS "Enable ALL access for anon on scoring_subjects" ON public.scoring_subjects;
DROP POLICY IF EXISTS "Enable ALL access for anon on staff_credentials" ON public.staff_credentials;
DROP POLICY IF EXISTS "Enable ALL access for anon on sync_state" ON public.sync_state;
DROP POLICY IF EXISTS "Enable ALL access for anon on team_members" ON public.team_members;
DROP POLICY IF EXISTS "Enable ALL access for anon on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable ALL access for anon on venues" ON public.venues;
DROP POLICY IF EXISTS "Enable ALL access for anon on work_items" ON public.work_items;

-- Drop generic "Allow all" policies that might conflict
DROP POLICY IF EXISTS "Allow all" ON public.categories;
DROP POLICY IF EXISTS "Allow all on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all" ON public.events;
DROP POLICY IF EXISTS "Allow all" ON public.judge_agreements;
DROP POLICY IF EXISTS "Allow all on judge_agreements" ON public.judge_agreements;
DROP POLICY IF EXISTS "Allow all" ON public.judge_credentials;
DROP POLICY IF EXISTS "Allow all" ON public."knsdc-registration";
DROP POLICY IF EXISTS "Allow all" ON public.public_messages;
DROP POLICY IF EXISTS "Allow all on public_messages" ON public.public_messages;
DROP POLICY IF EXISTS "Allow all" ON public.public_ratings;
DROP POLICY IF EXISTS "Allow all on public_ratings" ON public.public_ratings;
DROP POLICY IF EXISTS "Allow all" ON public.public_registrations;
DROP POLICY IF EXISTS "Allow all" ON public.scoring_subjects;
DROP POLICY IF EXISTS "Allow all" ON public.staff_credentials;
DROP POLICY IF EXISTS "Allow all" ON public.sync_state;
DROP POLICY IF EXISTS "Allow all" ON public.venues;
DROP POLICY IF EXISTS "Allow all on venues" ON public.venues;

-- ══════════════════════════════════════════════════════════════
-- STEP 2: DEFINE SECURE AND RESOLVED RLS POLICIES
-- ══════════════════════════════════════════════════════════════

-- 1. categories
CREATE POLICY "categories_select_public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_all_auth" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. donations
CREATE POLICY "donations_select_public" ON public.donations FOR SELECT USING (true);
CREATE POLICY "donations_all_auth" ON public.donations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. ecosystem_log
CREATE POLICY "ecosystem_log_select_public" ON public.ecosystem_log FOR SELECT USING (true);
CREATE POLICY "ecosystem_log_all_auth" ON public.ecosystem_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. events
CREATE POLICY "events_select_public" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_all_auth" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. gallery_images
CREATE POLICY "gallery_images_select_public" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "gallery_images_all_auth" ON public.gallery_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. judge_agreements
CREATE POLICY "judge_agreements_select_public" ON public.judge_agreements FOR SELECT USING (true);
CREATE POLICY "judge_agreements_all_auth" ON public.judge_agreements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. judge_credentials
CREATE POLICY "judge_credentials_select_anon" ON public.judge_credentials FOR SELECT TO anon USING (true);
CREATE POLICY "judge_credentials_select_auth" ON public.judge_credentials FOR SELECT TO authenticated USING (true);
CREATE POLICY "judge_credentials_all_auth" ON public.judge_credentials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. knsdc-registration (Workshop registrations)
CREATE POLICY "knsdc_registration_select_public" ON public."knsdc-registration" FOR SELECT USING (true);
CREATE POLICY "knsdc_registration_all_auth" ON public."knsdc-registration" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. notices
CREATE POLICY "notices_select_public" ON public.notices FOR SELECT USING (true);
CREATE POLICY "notices_all_auth" ON public.notices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. partners
CREATE POLICY "partners_select_public" ON public.partners FOR SELECT USING (true);
CREATE POLICY "partners_all_auth" ON public.partners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. past_events
CREATE POLICY "past_events_select_public" ON public.past_events FOR SELECT USING (true);
CREATE POLICY "past_events_all_auth" ON public.past_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 12. public_messages (Contact Form - Anon can insert)
CREATE POLICY "public_messages_insert_anon" ON public.public_messages FOR INSERT TO anon WITH CHECK (length(name) > 0 AND length(email) > 0);
CREATE POLICY "public_messages_select_auth" ON public.public_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "public_messages_all_auth" ON public.public_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 13. public_ratings (Workshop Feedback Ratings - Anon can insert)
CREATE POLICY "public_ratings_insert_anon" ON public.public_ratings FOR INSERT TO anon WITH CHECK (rating >= 1 AND rating <= 5);
CREATE POLICY "public_ratings_select_auth" ON public.public_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "public_ratings_all_auth" ON public.public_ratings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 14. public_registrations (Tournament Participants)
CREATE POLICY "public_registrations_select_public" ON public.public_registrations FOR SELECT USING (true);
CREATE POLICY "public_registrations_all_auth" ON public.public_registrations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 15. scoring_subjects
CREATE POLICY "scoring_subjects_select_public" ON public.scoring_subjects FOR SELECT USING (true);
CREATE POLICY "scoring_subjects_all_auth" ON public.scoring_subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 16. staff_credentials
CREATE POLICY "staff_credentials_select_anon" ON public.staff_credentials FOR SELECT TO anon USING (true);
CREATE POLICY "staff_credentials_select_auth" ON public.staff_credentials FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff_credentials_all_auth" ON public.staff_credentials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 17. sync_state (Main State Synchronization)
CREATE POLICY "sync_state_select_public" ON public.sync_state FOR SELECT USING (true);
CREATE POLICY "sync_state_all_auth" ON public.sync_state FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 18. team_members
CREATE POLICY "team_members_select_public" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "team_members_all_auth" ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 19. user_roles
CREATE POLICY "user_roles_select_public" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "user_roles_all_auth" ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 20. venues
CREATE POLICY "venues_select_public" ON public.venues FOR SELECT USING (true);
CREATE POLICY "venues_all_auth" ON public.venues FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 21. work_items
CREATE POLICY "work_items_select_public" ON public.work_items FOR SELECT USING (true);
CREATE POLICY "work_items_all_auth" ON public.work_items FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- STEP 3: REVOKE PUBLIC EXECUTE PRIVILEGES FROM SECURITY DEFINER FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- Revoke default public execution rights for the admin/trigger functions
REVOKE EXECUTE ON FUNCTION public.admin_delete_staff(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_staff(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_staff(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.insert_staff_from_auth() FROM PUBLIC, anon, authenticated;
