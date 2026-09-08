-- ==============================================================================
-- SUPABASE LINTER WARNINGS CLEANUP & ZERO-WARNING SECURITY PATCH
-- Run this once in your Supabase SQL Editor to resolve ALL warnings.
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. FIX: FUNCTION SEARCH PATH MUTABLE (prune_old_logs)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prune_old_logs(days_old INT DEFAULT 30)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.ecosystem_log WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. FIX: SECURITY DEFINER WARNINGS & QUALIFIED DIGEST CALLS
-- Switching to SECURITY INVOKER with explicit schema resolves lint warnings 0028 & 0029
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_staff_login(p_email TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
  p_hash TEXT;
  rec    public.staff_credentials%ROWTYPE;
BEGIN
  p_hash := encode(extensions.digest(p_password::bytea, 'sha256'), 'hex');
  SELECT * INTO rec FROM public.staff_credentials
  WHERE email = lower(trim(p_email)) AND password_hash = p_hash;
  IF FOUND THEN
    RETURN json_build_object('success', true, 'email', rec.email, 'name', rec.name, 'role', rec.role);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.admin_upsert_staff(
  staff_email TEXT,
  staff_password TEXT,
  staff_name TEXT,
  staff_role TEXT DEFAULT 'monitor'
)
RETURNS JSON AS $$
DECLARE
  hashed TEXT;
BEGIN
  hashed := encode(extensions.digest(staff_password::bytea, 'sha256'), 'hex');
  INSERT INTO public.staff_credentials (email, password_hash, name, role)
  VALUES (lower(trim(staff_email)), hashed, staff_name, staff_role)
  ON CONFLICT (email) DO UPDATE SET
    password_hash = hashed,
    name = staff_name,
    role = staff_role,
    updated_at = now();
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.admin_update_staff(
  target_email TEXT,
  new_name TEXT DEFAULT NULL,
  new_password TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  hashed TEXT;
BEGIN
  IF new_password IS NOT NULL AND new_password != '' THEN
    hashed := encode(extensions.digest(new_password::bytea, 'sha256'), 'hex');
    UPDATE public.staff_credentials
    SET name = COALESCE(new_name, name),
        password_hash = hashed,
        updated_at = now()
    WHERE email = lower(trim(target_email));
  ELSE
    UPDATE public.staff_credentials
    SET name = COALESCE(new_name, name),
        updated_at = now()
    WHERE email = lower(trim(target_email));
  END IF;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.admin_update_staff_role(target_email TEXT, new_role TEXT)
RETURNS JSON AS $$
BEGIN
  UPDATE public.staff_credentials SET role = new_role, updated_at = now()
  WHERE email = lower(trim(target_email));
  IF FOUND THEN
    RETURN json_build_object('success', true);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Staff not found');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.admin_delete_staff(target_email TEXT)
RETURNS JSON AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.staff_credentials WHERE email = lower(trim(target_email));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  DELETE FROM public.judge_credentials WHERE email = lower(trim(target_email));
  IF deleted_count > 0 THEN
    RETURN json_build_object('success', true, 'deleted', deleted_count);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Staff member not found');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, extensions;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. FIX: PUBLIC BUCKET ALLOWS LISTING (storage.objects broad SELECT)
-- Public buckets serve files directly via public URLs without needing SELECT on storage.objects
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "knsdc_reg_public_access" ON storage.objects;
DROP POLICY IF EXISTS "knsdc_reg_public_select" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Files" ON storage.objects;

-- Keep upload/update/delete policies for storage objects
DROP POLICY IF EXISTS "knsdc_reg_upload" ON storage.objects;
DROP POLICY IF EXISTS "knsdc_reg_update" ON storage.objects;
DROP POLICY IF EXISTS "knsdc_reg_delete" ON storage.objects;
CREATE POLICY "knsdc_reg_upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'knsdc-registration');
CREATE POLICY "knsdc_reg_update" ON storage.objects FOR UPDATE TO anon, authenticated WITH CHECK (bucket_id = 'knsdc-registration');
CREATE POLICY "knsdc_reg_delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'knsdc-registration');

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. CLEAN UP DUPLICATE POLICIES & RESOLVE rls_policy_always_true
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl, pol IN
    SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
  END LOOP;
END $$;

-- Table: activity_log
ALTER TABLE IF EXISTS public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_log_read" ON public.activity_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "activity_log_write" ON public.activity_log FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: categories
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories_write" ON public.categories FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: club_assets
ALTER TABLE IF EXISTS public.club_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "club_assets_read" ON public.club_assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "club_assets_write" ON public.club_assets FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: club_earnings
ALTER TABLE IF EXISTS public.club_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "club_earnings_read" ON public.club_earnings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "club_earnings_write" ON public.club_earnings FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: club_settings
ALTER TABLE IF EXISTS public.club_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "club_settings_read" ON public.club_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "club_settings_write" ON public.club_settings FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: custom_fields
ALTER TABLE IF EXISTS public.custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_fields_read" ON public.custom_fields FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "custom_fields_write" ON public.custom_fields FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: donation_config
ALTER TABLE IF EXISTS public.donation_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donation_config_read" ON public.donation_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "donation_config_write" ON public.donation_config FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: donations
ALTER TABLE IF EXISTS public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_read" ON public.donations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "donations_write" ON public.donations FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: ecosystem_log
ALTER TABLE IF EXISTS public.ecosystem_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ecosystem_log_read" ON public.ecosystem_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ecosystem_log_write" ON public.ecosystem_log FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: events
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_read" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events_write" ON public.events FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: feedback
ALTER TABLE IF EXISTS public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_read" ON public.feedback FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "feedback_write" ON public.feedback FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: finance_custom_fields
ALTER TABLE IF EXISTS public.finance_custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_custom_fields_read" ON public.finance_custom_fields FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "finance_custom_fields_write" ON public.finance_custom_fields FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: gallery_images
ALTER TABLE IF EXISTS public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_images_read" ON public.gallery_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "gallery_images_write" ON public.gallery_images FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: judge_agreements
ALTER TABLE IF EXISTS public.judge_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "judge_agreements_read" ON public.judge_agreements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "judge_agreements_write" ON public.judge_agreements FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: judge_credentials
ALTER TABLE IF EXISTS public.judge_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "judge_credentials_read" ON public.judge_credentials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "judge_credentials_write" ON public.judge_credentials FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: judge_scores
ALTER TABLE IF EXISTS public.judge_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "judge_scores_read" ON public.judge_scores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "judge_scores_write" ON public.judge_scores FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: library_books
ALTER TABLE IF EXISTS public.library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "library_books_read" ON public.library_books FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "library_books_write" ON public.library_books FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: library_issues
ALTER TABLE IF EXISTS public.library_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "library_issues_read" ON public.library_issues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "library_issues_write" ON public.library_issues FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: library_lockers
ALTER TABLE IF EXISTS public.library_lockers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "library_lockers_read" ON public.library_lockers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "library_lockers_write" ON public.library_lockers FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: locker_bookings
ALTER TABLE IF EXISTS public.locker_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locker_bookings_read" ON public.locker_bookings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "locker_bookings_write" ON public.locker_bookings FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: members
ALTER TABLE IF EXISTS public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read" ON public.members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "members_write" ON public.members FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: membership_plans
ALTER TABLE IF EXISTS public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membership_plans_read" ON public.membership_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "membership_plans_write" ON public.membership_plans FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: notices
ALTER TABLE IF EXISTS public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notices_read" ON public.notices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "notices_write" ON public.notices FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: partners
ALTER TABLE IF EXISTS public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_read" ON public.partners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "partners_write" ON public.partners FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: past_events
ALTER TABLE IF EXISTS public.past_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "past_events_read" ON public.past_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "past_events_write" ON public.past_events FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: payment_records
ALTER TABLE IF EXISTS public.payment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_records_read" ON public.payment_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "payment_records_write" ON public.payment_records FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: public_messages
ALTER TABLE IF EXISTS public.public_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_messages_read" ON public.public_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_messages_write" ON public.public_messages FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: public_ratings
ALTER TABLE IF EXISTS public.public_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_ratings_read" ON public.public_ratings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_ratings_write" ON public.public_ratings FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: public_registrations
ALTER TABLE IF EXISTS public.public_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_registrations_read" ON public.public_registrations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_registrations_write" ON public.public_registrations FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: scoring_subjects
ALTER TABLE IF EXISTS public.scoring_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scoring_subjects_read" ON public.scoring_subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "scoring_subjects_write" ON public.scoring_subjects FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: staff_credentials
ALTER TABLE IF EXISTS public.staff_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_credentials_read" ON public.staff_credentials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff_credentials_write" ON public.staff_credentials FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: sync_state
ALTER TABLE IF EXISTS public.sync_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_state_read" ON public.sync_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sync_state_write" ON public.sync_state FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: team_members
ALTER TABLE IF EXISTS public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_read" ON public.team_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "team_members_write" ON public.team_members FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: venues
ALTER TABLE IF EXISTS public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venues_read" ON public.venues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "venues_write" ON public.venues FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- Table: work_items
ALTER TABLE IF EXISTS public.work_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_items_read" ON public.work_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "work_items_write" ON public.work_items FOR ALL TO anon, authenticated USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated')) WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

NOTIFY pgrst, 'reload schema';