-- ==============================================================================
-- KALIKAPUR NABIN SANGHA (KNSDC) — DEFINITIVE MASTER SUPABASE SETUP SCRIPT
-- Target Project: https://cquterfxuwafvhnlfjob.supabase.co
-- Safe, clean, idempotent, and instant execution in Supabase SQL Editor.
-- Every table has RLS enabled with permissive policies for anon & authenticated.
-- ==============================================================================

-- 0. EXTENSIONS & FUNCTION CLEANUP
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP FUNCTION IF EXISTS public.admin_staff_login(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_upsert_staff(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_update_staff(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_update_staff_role(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_delete_staff(TEXT);

-- ------------------------------------------------------------------------------
-- 1. TABLE: sync_state
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sync_state (
    id           TEXT PRIMARY KEY,
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sync_state_all" ON public.sync_state;
CREATE POLICY "sync_state_all" ON public.sync_state FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 2. TABLE: staff_credentials
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_credentials (
    id            SERIAL PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'monitor',
    active        BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.staff_credentials ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.staff_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_credentials_all" ON public.staff_credentials;
CREATE POLICY "staff_credentials_all" ON public.staff_credentials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. TABLE: judge_credentials
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.judge_credentials (
    id            SERIAL PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    event_id      TEXT,
    agreement_id  BIGINT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.judge_credentials ADD COLUMN IF NOT EXISTS event_id TEXT;
ALTER TABLE public.judge_credentials ADD COLUMN IF NOT EXISTS agreement_id BIGINT;
ALTER TABLE public.judge_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "judge_credentials_all" ON public.judge_credentials;
CREATE POLICY "judge_credentials_all" ON public.judge_credentials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. TABLE: judge_agreements
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.judge_agreements (
    id           BIGINT PRIMARY KEY,
    event_id     BIGINT,
    venue_id     TEXT,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL,
    phone        TEXT,
    password     TEXT,
    status       TEXT DEFAULT 'pending',
    submitted    BOOLEAN DEFAULT false,
    signature    TEXT,
    spec         TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.judge_agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "judge_agreements_all" ON public.judge_agreements;
CREATE POLICY "judge_agreements_all" ON public.judge_agreements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. TABLE: events
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id               BIGINT PRIMARY KEY,
    name             TEXT NOT NULL,
    title            TEXT,
    org              TEXT DEFAULT 'Kalikapur Nabin Sangha',
    organizer        TEXT DEFAULT 'Kalikapur Nabin Sangha',
    type             TEXT DEFAULT 'cultural',
    category         TEXT DEFAULT 'cultural',
    venue            TEXT,
    date             DATE DEFAULT CURRENT_DATE,
    start_date       DATE,
    time             TEXT,
    start_time       TEXT,
    end_date         DATE,
    end_time         TEXT,
    description      TEXT,
    whatsapp         TEXT,
    facebook         TEXT,
    social_links     JSONB DEFAULT '{}'::jsonb,
    form_fields      JSONB DEFAULT '[]'::jsonb,
    staff            JSONB DEFAULT '[]'::jsonb,
    judges           JSONB DEFAULT '[]'::jsonb,
    categories       JSONB DEFAULT '[]'::jsonb,
    venues           JSONB DEFAULT '[]'::jsonb,
    scoring_subjects JSONB DEFAULT '[]'::jsonb,
    status           TEXT DEFAULT 'upcoming',
    switch_states    JSONB DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_all" ON public.events;
CREATE POLICY "events_all" ON public.events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. TABLE: club_events (Compatibility & Outbox sync)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_events (
    id         TEXT PRIMARY KEY,
    name       TEXT,
    data       JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "club_events_all" ON public.club_events;
CREATE POLICY "club_events_all" ON public.club_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. TABLE: past_events
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.past_events (
    id          BIGINT PRIMARY KEY,
    name        TEXT NOT NULL,
    date        DATE DEFAULT CURRENT_DATE,
    description TEXT,
    winners     JSONB DEFAULT '[]'::jsonb,
    gallery     JSONB DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.past_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "past_events_all" ON public.past_events;
CREATE POLICY "past_events_all" ON public.past_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. TABLE: categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id         BIGINT PRIMARY KEY,
    event_id   BIGINT,
    name       TEXT NOT NULL,
    age_limit  TEXT,
    color      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_all" ON public.categories;
CREATE POLICY "categories_all" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 9. TABLE: venues
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.venues (
    id         TEXT PRIMARY KEY,
    event_id   BIGINT,
    name       TEXT NOT NULL,
    address    TEXT,
    city       TEXT DEFAULT 'Kolkata',
    dates      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venues_all" ON public.venues;
CREATE POLICY "venues_all" ON public.venues FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 10. TABLE: scoring_subjects
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scoring_subjects (
    id        TEXT PRIMARY KEY,
    event_id  BIGINT,
    name      TEXT NOT NULL,
    max_marks INT DEFAULT 10
);
ALTER TABLE public.scoring_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scoring_subjects_all" ON public.scoring_subjects;
CREATE POLICY "scoring_subjects_all" ON public.scoring_subjects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 11. TABLE: public_registrations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_registrations (
    id             TEXT PRIMARY KEY,
    event_id       BIGINT,
    name           TEXT NOT NULL,
    phone          TEXT,
    age            INT,
    gender         TEXT,
    category       TEXT,
    venue          TEXT,
    form_answers   JSONB DEFAULT '{}'::jsonb,
    is_verified    BOOLEAN DEFAULT true,
    stage_status   TEXT DEFAULT 'waiting',
    round          TEXT DEFAULT 'audition',
    present        BOOLEAN DEFAULT false,
    timestamp      TIMESTAMPTZ,
    reg_date       TIMESTAMPTZ DEFAULT NOW(),
    scores         JSONB DEFAULT '{}'::jsonb,
    round_scores   JSONB DEFAULT '{}'::jsonb,
    round_comments JSONB DEFAULT '{}'::jsonb,
    comment        TEXT
);
ALTER TABLE public.public_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_registrations_all" ON public.public_registrations;
CREATE POLICY "public_registrations_all" ON public.public_registrations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 12. TABLE: judge_scores
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.judge_scores (
    id             TEXT PRIMARY KEY,
    event_id       TEXT,
    participant_id TEXT,
    judge_id       TEXT,
    round          TEXT DEFAULT 'audition',
    scores         JSONB DEFAULT '{}'::jsonb,
    total          NUMERIC DEFAULT 0,
    comments       TEXT,
    timestamp      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.judge_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "judge_scores_all" ON public.judge_scores;
CREATE POLICY "judge_scores_all" ON public.judge_scores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 13. TABLE: donations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donations (
    id         SERIAL PRIMARY KEY,
    order_id   TEXT UNIQUE,
    donor_name TEXT,
    amount     NUMERIC DEFAULT 0,
    cause      TEXT,
    status     TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "donations_all" ON public.donations;
CREATE POLICY "donations_all" ON public.donations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 14. TABLE: ecosystem_log
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ecosystem_log (
    id         SERIAL PRIMARY KEY,
    actor_role TEXT,
    action     TEXT,
    details    JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ecosystem_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ecosystem_log_all" ON public.ecosystem_log;
CREATE POLICY "ecosystem_log_all" ON public.ecosystem_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 15. TABLE: feedback
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
    id         SERIAL PRIMARY KEY,
    name       TEXT,
    message    TEXT,
    rating     INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedback_all" ON public.feedback;
CREATE POLICY "feedback_all" ON public.feedback FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 16. TABLE: notices, work_items, team_members, partners, gallery_images
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notices (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    content    TEXT,
    date       DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notices_all" ON public.notices;
CREATE POLICY "notices_all" ON public.notices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.work_items (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    status     TEXT DEFAULT 'pending',
    assigned_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "work_items_all" ON public.work_items;
CREATE POLICY "work_items_all" ON public.work_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.team_members (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    role       TEXT,
    phone      TEXT,
    email      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_members_all" ON public.team_members;
CREATE POLICY "team_members_all" ON public.team_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.partners (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    category   TEXT,
    phone      TEXT,
    email      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partners_all" ON public.partners;
CREATE POLICY "partners_all" ON public.partners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.gallery_images (
    id         SERIAL PRIMARY KEY,
    event_id   TEXT,
    url        TEXT NOT NULL,
    caption    TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gallery_images_all" ON public.gallery_images;
CREATE POLICY "gallery_images_all" ON public.gallery_images FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 17. TABLE: MEMBERS & FINANCE (KNSDC Finance Portal)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.members (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    phone         TEXT,
    email         TEXT,
    role          TEXT DEFAULT 'Member',
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_all" ON public.members;
CREATE POLICY "members_all" ON public.members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.membership_plans (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    amount     NUMERIC DEFAULT 0,
    period     TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "membership_plans_all" ON public.membership_plans;
CREATE POLICY "membership_plans_all" ON public.membership_plans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.payment_records (
    id         TEXT PRIMARY KEY,
    member_id  TEXT,
    amount     NUMERIC DEFAULT 0,
    status     TEXT DEFAULT 'completed',
    date       TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_records_all" ON public.payment_records;
CREATE POLICY "payment_records_all" ON public.payment_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.club_earnings (
    id         TEXT PRIMARY KEY,
    source     TEXT,
    amount     NUMERIC DEFAULT 0,
    date       TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.club_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "club_earnings_all" ON public.club_earnings;
CREATE POLICY "club_earnings_all" ON public.club_earnings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.finance_custom_fields (
    id         TEXT PRIMARY KEY,
    label      TEXT NOT NULL,
    type       TEXT DEFAULT 'text',
    required   BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.finance_custom_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_custom_fields_all" ON public.finance_custom_fields;
CREATE POLICY "finance_custom_fields_all" ON public.finance_custom_fields FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.club_settings (
    key        TEXT PRIMARY KEY,
    value      JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "club_settings_all" ON public.club_settings;
CREATE POLICY "club_settings_all" ON public.club_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.library_lockers (
    id         TEXT PRIMARY KEY,
    locker_num INT,
    status     TEXT DEFAULT 'available',
    user_id    TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.library_lockers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "library_lockers_all" ON public.library_lockers;
CREATE POLICY "library_lockers_all" ON public.library_lockers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 18. REALTIME REPLICATION SETUP
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_state; EXCEPTION WHEN duplicate_object THEN END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.public_registrations; EXCEPTION WHEN duplicate_object THEN END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.events; EXCEPTION WHEN duplicate_object THEN END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.club_events; EXCEPTION WHEN duplicate_object THEN END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ecosystem_log; EXCEPTION WHEN duplicate_object THEN END;
END $$;

-- ------------------------------------------------------------------------------
-- 19. RPC FUNCTIONS FOR SECURE AUTH & MANAGEMENT
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_staff_login(p_email TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
  rec RECORD;
  input_hash TEXT;
BEGIN
  input_hash := encode(digest(p_password, 'sha256'), 'hex');
  SELECT name, role, email INTO rec
  FROM public.staff_credentials
  WHERE email = lower(trim(p_email)) AND (password_hash = input_hash OR password_hash = p_password);
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'role', rec.role, 'name', rec.name, 'email', rec.email);
  END IF;

  SELECT name, 'judge' AS role, email INTO rec
  FROM public.judge_credentials
  WHERE email = lower(trim(p_email)) AND (password_hash = input_hash OR password_hash = p_password);

  IF FOUND THEN
    RETURN json_build_object('success', true, 'role', 'judge', 'name', rec.name, 'email', rec.email);
  END IF;

  RETURN json_build_object('success', false, 'error', 'Invalid credentials');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
  hashed := encode(digest(staff_password, 'sha256'), 'hex');
  INSERT INTO public.staff_credentials (email, password_hash, name, role, active)
  VALUES (lower(trim(staff_email)), hashed, staff_name, lower(trim(staff_role)), true)
  ON CONFLICT (email) DO UPDATE SET
    password_hash = hashed,
    name = staff_name,
    role = lower(trim(staff_role)),
    active = true,
    updated_at = now();
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.admin_update_staff(
  target_email TEXT,
  new_name TEXT DEFAULT NULL,
  new_password TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  hashed TEXT;
BEGIN
  IF new_password IS NOT NULL AND trim(new_password) <> '' THEN
    hashed := encode(digest(new_password, 'sha256'), 'hex');
    UPDATE public.staff_credentials
    SET name = coalesce(new_name, name),
        password_hash = hashed,
        updated_at = now()
    WHERE email = lower(trim(target_email));
  ELSE
    UPDATE public.staff_credentials
    SET name = coalesce(new_name, name),
        updated_at = now()
    WHERE email = lower(trim(target_email));
  END IF;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.admin_update_staff_role(target_email TEXT, new_role TEXT)
RETURNS JSON AS $$
BEGIN
  UPDATE public.staff_credentials SET role = lower(trim(new_role)), updated_at = now()
  WHERE email = lower(trim(target_email));
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.admin_delete_staff(target_email TEXT)
RETURNS JSON AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.staff_credentials WHERE email = lower(trim(target_email));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  DELETE FROM public.judge_credentials WHERE email = lower(trim(target_email));
  RETURN json_build_object('success', true, 'deleted', deleted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.admin_staff_login(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_staff(TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_staff(TEXT, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_staff_role(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_staff(TEXT) TO authenticated, anon;

-- ------------------------------------------------------------------------------
-- 20. SEED INITIAL GLOBAL SYNC STATE
-- ------------------------------------------------------------------------------
INSERT INTO public.sync_state (id, payload)
VALUES 
  ('knsdc_global_sync', '{"activeEventId": null, "eventName": null, "organizer": "Kalikapur Nabin Sangha", "liveEventToday": null, "currentOnStage": null, "lastUpdated": 0, "participants": [], "chatMessages": [], "judges": [], "hostAssignments": [], "events": [], "upcomingEvents": [], "sosActive": false, "sosHistory": [], "judgeAgreements": []}'::jsonb),
  ('knsdc_finance_sync', '{"donations": [], "expenses": [], "earnings": []}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 21. SEED AUTHORIZED STAFF ACCOUNTS (ACTIVE ONLY)
-- ------------------------------------------------------------------------------
INSERT INTO public.staff_credentials (email, password_hash, name, role, active)
VALUES 
  ('souravbairagi121999@gmail.com',        '5440505a59224af2d0dea51b91cb84e3648a1e5cdfa16936ec47a3f68d8c7b42', 'Super Admin',           'admin',           true),
  ('kalikapurnabinsanghaclub@gmail.com',   'ffb7bcda5db5dc45aa8058ab92162526f821cdb682308bcab5f9edb6456c15a6', 'KNSDC Super Monitor',   'monitor',         true),
  ('d@knsdc.in',                           'd56fff2322355f2f9090a421fbb6dc0acdce1679c3749d4694d1e5952c67e66f', 'tg',                    'director',        true),
  ('pert@knsdc.in',                        'd56fff2322355f2f9090a421fbb6dc0acdce1679c3749d4694d1e5952c67e66f', 'lok',                   'service_partner', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  active = EXCLUDED.active;
