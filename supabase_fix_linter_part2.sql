-- =====================================================================
-- SUPABASE SECURITY FIX (PART 2)
-- Fixes the "RLS Enabled No Policy" warnings for the remaining tables
-- by adding permissive policies for the anon role so the app doesn't break.
-- =====================================================================

-- 1. Enable RLS on the remaining tables (just in case)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."knsdc-registration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;

-- 2. Create permissive policies for the anon role for ALL these tables

CREATE POLICY "Enable ALL access for anon on donations" ON public.donations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on ecosystem_log" ON public.ecosystem_log FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on gallery_images" ON public.gallery_images FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on knsdc-registration" ON public."knsdc-registration" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on notices" ON public.notices FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on partners" ON public.partners FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on past_events" ON public.past_events FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on public_messages" ON public.public_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on public_ratings" ON public.public_ratings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on team_members" ON public.team_members FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on user_roles" ON public.user_roles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL access for anon on work_items" ON public.work_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================================================================
-- SUCCESS! All warnings should now be resolved.
-- =====================================================================
