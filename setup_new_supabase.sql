-- ============================================================
-- KNSDC — COMPLETE SCHEMA SETUP SCRIPT FOR NEW SUPABASE PROJECT
-- Target Project: https://fjscpohgysbelzkrkrxm.supabase.co
-- ✅ Safe, clean, and instant execution in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABLE: sync_state
CREATE TABLE IF NOT EXISTS public.sync_state (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sync_state_all" ON public.sync_state;
CREATE POLICY "sync_state_all" ON public.sync_state FOR ALL USING (true) WITH CHECK (true);

-- 2. TABLE: staff_credentials
CREATE TABLE IF NOT EXISTS public.staff_credentials (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'monitor',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.staff_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_credentials_all" ON public.staff_credentials;
CREATE POLICY "staff_credentials_all" ON public.staff_credentials FOR ALL USING (true) WITH CHECK (true);

-- 3. TABLE: judge_credentials
CREATE TABLE IF NOT EXISTS public.judge_credentials (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.judge_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "judge_credentials_all" ON public.judge_credentials;
CREATE POLICY "judge_credentials_all" ON public.judge_credentials FOR ALL USING (true) WITH CHECK (true);

-- 4. TABLE: public_registrations
CREATE TABLE IF NOT EXISTS public.public_registrations (
    id TEXT PRIMARY KEY,
    event_id BIGINT,
    name TEXT NOT NULL,
    phone TEXT,
    age INT,
    gender TEXT,
    category TEXT,
    venue TEXT,
    form_answers JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT true,
    stage_status TEXT DEFAULT 'waiting',
    round TEXT DEFAULT 'audition',
    present BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ,
    reg_date TIMESTAMPTZ DEFAULT NOW(),
    scores JSONB DEFAULT '{}'::jsonb,
    round_scores JSONB DEFAULT '{}'::jsonb,
    round_comments JSONB DEFAULT '{}'::jsonb,
    comment TEXT
);
ALTER TABLE public.public_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_registrations_all" ON public.public_registrations;
CREATE POLICY "public_registrations_all" ON public.public_registrations FOR ALL USING (true) WITH CHECK (true);

-- 5. TABLE: events
CREATE TABLE IF NOT EXISTS public.events (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    org TEXT DEFAULT 'Kalikapur Nabin Sangha',
    organizer TEXT DEFAULT 'Kalikapur Nabin Sangha',
    type TEXT DEFAULT 'cultural',
    category TEXT DEFAULT 'cultural',
    venue TEXT,
    date DATE DEFAULT CURRENT_DATE,
    start_date DATE,
    time TEXT,
    start_time TEXT,
    end_date DATE,
    end_time TEXT,
    description TEXT,
    whatsapp TEXT,
    facebook TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    form_fields JSONB DEFAULT '[]'::jsonb,
    staff JSONB DEFAULT '[]'::jsonb,
    judges JSONB DEFAULT '[]'::jsonb,
    categories JSONB DEFAULT '[]'::jsonb,
    venues JSONB DEFAULT '[]'::jsonb,
    scoring_subjects JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'upcoming',
    switch_states JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_all" ON public.events;
CREATE POLICY "events_all" ON public.events FOR ALL USING (true) WITH CHECK (true);

-- 6. TABLE: categories
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    event_id BIGINT,
    name TEXT NOT NULL,
    age_limit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_all" ON public.categories;
CREATE POLICY "categories_all" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- 7. TABLE: venues
CREATE TABLE IF NOT EXISTS public.venues (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    event_id BIGINT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venues_all" ON public.venues;
CREATE POLICY "venues_all" ON public.venues FOR ALL USING (true) WITH CHECK (true);

-- 8. TABLE: scoring_subjects
CREATE TABLE IF NOT EXISTS public.scoring_subjects (
    id SERIAL PRIMARY KEY,
    event_id BIGINT,
    subject_name TEXT NOT NULL,
    max_score INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.scoring_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scoring_subjects_all" ON public.scoring_subjects;
CREATE POLICY "scoring_subjects_all" ON public.scoring_subjects FOR ALL USING (true) WITH CHECK (true);

-- 9. TABLE: judge_agreements
CREATE TABLE IF NOT EXISTS public.judge_agreements (
    id TEXT PRIMARY KEY,
    event_id BIGINT,
    name TEXT,
    email TEXT,
    status TEXT DEFAULT 'pending',
    submitted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.judge_agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "judge_agreements_all" ON public.judge_agreements;
CREATE POLICY "judge_agreements_all" ON public.judge_agreements FOR ALL USING (true) WITH CHECK (true);

-- 10. TABLE: judge_scores
CREATE TABLE IF NOT EXISTS public.judge_scores (
    id SERIAL PRIMARY KEY,
    participant_id TEXT,
    judge_name TEXT,
    judge_email TEXT,
    scores JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.judge_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "judge_scores_all" ON public.judge_scores;
CREATE POLICY "judge_scores_all" ON public.judge_scores FOR ALL USING (true) WITH CHECK (true);

-- 11. TABLE: donations
CREATE TABLE IF NOT EXISTS public.donations (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    target NUMERIC DEFAULT 0,
    raised NUMERIC DEFAULT 0,
    icon TEXT,
    col TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "donations_all" ON public.donations;
CREATE POLICY "donations_all" ON public.donations FOR ALL USING (true) WITH CHECK (true);

-- 12. TABLE: ecosystem_log
CREATE TABLE IF NOT EXISTS public.ecosystem_log (
    id SERIAL PRIMARY KEY,
    actor TEXT,
    role TEXT,
    action TEXT,
    event_id BIGINT,
    participant_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ecosystem_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ecosystem_log_all" ON public.ecosystem_log;
CREATE POLICY "ecosystem_log_all" ON public.ecosystem_log FOR ALL USING (true) WITH CHECK (true);

-- 13. TABLE: feedback
CREATE TABLE IF NOT EXISTS public.feedback (
    id SERIAL PRIMARY KEY,
    name TEXT,
    phone TEXT,
    category TEXT,
    message TEXT,
    rating INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedback_all" ON public.feedback;
CREATE POLICY "feedback_all" ON public.feedback FOR ALL USING (true) WITH CHECK (true);

-- 14. TABLE: library_lockers
CREATE TABLE IF NOT EXISTS public.library_lockers (
    id SERIAL PRIMARY KEY,
    locker_number TEXT UNIQUE,
    holder_name TEXT,
    phone TEXT,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.library_lockers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "library_lockers_all" ON public.library_lockers;
CREATE POLICY "library_lockers_all" ON public.library_lockers FOR ALL USING (true) WITH CHECK (true);

-- 15. FINANCE PORTAL TABLES
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT DEFAULT 'Member',
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_all" ON public.members;
CREATE POLICY "members_all" ON public.members FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.membership_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    period TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "membership_plans_all" ON public.membership_plans;
CREATE POLICY "membership_plans_all" ON public.membership_plans FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.payment_records (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'completed',
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_records_all" ON public.payment_records;
CREATE POLICY "payment_records_all" ON public.payment_records FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.club_earnings (
    id TEXT PRIMARY KEY,
    source TEXT,
    amount NUMERIC DEFAULT 0,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.club_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "club_earnings_all" ON public.club_earnings;
CREATE POLICY "club_earnings_all" ON public.club_earnings FOR ALL USING (true) WITH CHECK (true);

-- 16. REALTIME ENABLEMENT
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_state;
    EXCEPTION WHEN duplicate_object THEN END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.public_registrations;
    EXCEPTION WHEN duplicate_object THEN END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ecosystem_log;
    EXCEPTION WHEN duplicate_object THEN END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

-- 17. RPC FUNCTIONS (FOR AUTH & STAFF MANAGEMENT)
CREATE OR REPLACE FUNCTION public.admin_staff_login(p_email TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
  rec RECORD;
  input_hash TEXT;
BEGIN
  input_hash := encode(digest(p_password, 'sha256'), 'hex');
  SELECT name, role, email INTO rec
  FROM public.staff_credentials
  WHERE email = lower(trim(p_email)) AND password_hash = input_hash;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'role', rec.role, 'name', rec.name, 'email', rec.email);
  END IF;

  SELECT name, 'judge' AS role, email INTO rec
  FROM public.judge_credentials
  WHERE email = lower(trim(p_email)) AND password_hash = input_hash;

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
  INSERT INTO public.staff_credentials (email, password_hash, name, role)
  VALUES (lower(trim(staff_email)), hashed, staff_name, staff_role)
  ON CONFLICT (email) DO UPDATE SET
    password_hash = hashed,
    name = staff_name,
    role = staff_role,
    updated_at = now();
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
GRANT EXECUTE ON FUNCTION public.admin_delete_staff(TEXT) TO authenticated, anon;
