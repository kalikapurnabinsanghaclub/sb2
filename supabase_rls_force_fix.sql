-- Script to drop permissive RLS policies and recreate them securely

DROP POLICY IF EXISTS "sync_state_public_all" ON public.sync_state;
CREATE POLICY "sync_state_public_all" ON public.sync_state  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "staff_read_all" ON public.staff_credentials;
CREATE POLICY "staff_read_all" ON public.staff_credentials  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "staff_manage_all" ON public.staff_credentials;
CREATE POLICY "staff_manage_all" ON public.staff_credentials  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "judge_creds_read" ON public.judge_credentials;
CREATE POLICY "judge_creds_read" ON public.judge_credentials  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "judge_creds_upsert" ON public.judge_credentials;
CREATE POLICY "judge_creds_upsert" ON public.judge_credentials  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "pub_reg_insert" ON public.public_registrations;
CREATE POLICY "pub_reg_insert" ON public.public_registrations  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "pub_reg_read" ON public.public_registrations;
CREATE POLICY "pub_reg_read" ON public.public_registrations  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "pub_reg_all" ON public.public_registrations;
CREATE POLICY "pub_reg_all" ON public.public_registrations  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "events_read" ON public.events;
CREATE POLICY "events_read" ON public.events  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "events_manage" ON public.events;
CREATE POLICY "events_manage" ON public.events  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "past_events_read" ON public.past_events;
CREATE POLICY "past_events_read" ON public.past_events  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "past_events_manage" ON public.past_events;
CREATE POLICY "past_events_manage" ON public.past_events  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "gallery_read" ON public.gallery_images;
CREATE POLICY "gallery_read" ON public.gallery_images  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "gallery_manage" ON public.gallery_images;
CREATE POLICY "gallery_manage" ON public.gallery_images  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notices_read" ON public.notices;
CREATE POLICY "notices_read" ON public.notices  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notices_manage" ON public.notices;
CREATE POLICY "notices_manage" ON public.notices  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "donations_read" ON public.donations;
CREATE POLICY "donations_read" ON public.donations  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "donations_manage" ON public.donations;
CREATE POLICY "donations_manage" ON public.donations  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "work_items_read" ON public.work_items;
CREATE POLICY "work_items_read" ON public.work_items  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "work_items_manage" ON public.work_items;
CREATE POLICY "work_items_manage" ON public.work_items  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "team_read" ON public.team_members;
CREATE POLICY "team_read" ON public.team_members  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "team_manage" ON public.team_members;
CREATE POLICY "team_manage" ON public.team_members  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "partners_read" ON public.partners;
CREATE POLICY "partners_read" ON public.partners  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "partners_manage" ON public.partners;
CREATE POLICY "partners_manage" ON public.partners  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "eco_log_read" ON public.ecosystem_log;
CREATE POLICY "eco_log_read" ON public.ecosystem_log  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "eco_log_insert" ON public.ecosystem_log;
CREATE POLICY "eco_log_insert" ON public.ecosystem_log  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "categories_read" ON public.categories;
CREATE POLICY "categories_read" ON public.categories  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "categories_manage" ON public.categories;
CREATE POLICY "categories_manage" ON public.categories  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "venues_read" ON public.venues;
CREATE POLICY "venues_read" ON public.venues  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "venues_manage" ON public.venues;
CREATE POLICY "venues_manage" ON public.venues  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);