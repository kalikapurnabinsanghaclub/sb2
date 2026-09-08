-- ==============================================================================
-- KALIKAPUR NABIN SANGHA (KNSDC) — DEFINITIVE MASTER SUPABASE SETUP SCRIPT
-- ==============================================================================
-- Safe to run in Supabase SQL Editor.
-- Every table has explicit ROW LEVEL SECURITY enabled directly after creation.
-- ==============================================================================

-- 0. EXTENSIONS & FUNCTION CLEANUP
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP FUNCTION IF EXISTS public.prune_old_logs(integer);
DROP FUNCTION IF EXISTS public.prune_old_logs(int);
DROP FUNCTION IF EXISTS public.prune_old_logs();
DROP FUNCTION IF EXISTS public.admin_staff_login(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_upsert_staff(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_update_staff(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_update_staff_role(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_delete_staff(TEXT);
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: sync_state
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sync_state (
    id           TEXT PRIMARY KEY,
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sync_state_all" ON public.sync_state;
DROP POLICY IF EXISTS "sync_state_all_access" ON public.sync_state;
DROP POLICY IF EXISTS "sync_state_public_all" ON public.sync_state;
DROP POLICY IF EXISTS "sync_state_read" ON public.sync_state;
DROP POLICY IF EXISTS "sync_state_write" ON public.sync_state;
CREATE POLICY "sync_state_read" ON public.sync_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sync_state_write" ON public.sync_state FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));
INSERT INTO public.sync_state (id, payload)
VALUES ('knsdc_global_sync', '{
  "activeEventId": null,
  "eventName": null,
  "organizer": "Kalikapur Nabin Sangha",
  "liveEventToday": null,
  "currentOnStage": null,
  "lastUpdated": 0,
  "participants": [],
  "chatMessages": [],
  "judges": [],
  "hostAssignments": [],
  "events": [],
  "upcomingEvents": [],
  "sosActive": false,
  "sosHistory": [],
  "judgeAgreements": [],
  "nxtId": {"reg":1,"cat":1,"venue":1,"subj":1,"agr":1},
  "donations": [
    {"id":1,"name":"Annual Fast Fund","target":50000,"raised":32500,"icon":"🙏","col":"#FF6B35"},
    {"id":2,"name":"Dance Ignition Vol.7","target":100000,"raised":78000,"icon":"💃","col":"#7B2D8B"},
    {"id":3,"name":"Sports Equipment","target":30000,"raised":18000,"icon":"⚽","col":"#10B981"},
    {"id":4,"name":"Club Infrastructure","target":200000,"raised":145000,"icon":"🏛️","col":"#F59E0B"},
    {"id":5,"name":"Youth Scholarship","target":80000,"raised":55000,"icon":"🎓","col":"#E91E8C"}
  ]
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: staff_credentials
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_credentials (
    id            SERIAL PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL,
    active        BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.staff_credentials DROP CONSTRAINT IF EXISTS staff_credentials_role_check;
ALTER TABLE public.staff_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_credentials_all" ON public.staff_credentials;
DROP POLICY IF EXISTS "staff_credentials_all_access" ON public.staff_credentials;
DROP POLICY IF EXISTS "staff_credentials_public_all" ON public.staff_credentials;
DROP POLICY IF EXISTS "staff_credentials_read" ON public.staff_credentials;
DROP POLICY IF EXISTS "staff_credentials_write" ON public.staff_credentials;
CREATE POLICY "staff_credentials_read" ON public.staff_credentials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff_credentials_write" ON public.staff_credentials FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));
INSERT INTO public.staff_credentials (email, password_hash, name, role)
VALUES
  ('host@knsdc.in',                '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'Event Host',  'host'),
  ('souravbairagi121999@gmail.com','240be518fabd2724ddb6f04eeb1da5967448d7e831d9a5be0c2f7ede04e26f0', 'Super Admin', 'admin')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: judge_credentials
-- ──────────────────────────────────────────────────────────────────────────────
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
ALTER TABLE public.judge_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "judge_credentials_all" ON public.judge_credentials;
DROP POLICY IF EXISTS "judge_credentials_all_access" ON public.judge_credentials;
DROP POLICY IF EXISTS "judge_credentials_public_all" ON public.judge_credentials;
DROP POLICY IF EXISTS "judge_credentials_read" ON public.judge_credentials;
DROP POLICY IF EXISTS "judge_credentials_write" ON public.judge_credentials;
CREATE POLICY "judge_credentials_read" ON public.judge_credentials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "judge_credentials_write" ON public.judge_credentials FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: judge_agreements
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.judge_agreements (
    id                NUMERIC PRIMARY KEY,
    name              TEXT,
    phone             TEXT,
    email             TEXT,
    password          TEXT,
    city              TEXT,
    event_id          TEXT,
    date              TEXT,
    date_upto         TEXT,
    time              TEXT,
    venue_id          NUMERIC,
    venue_name        TEXT,
    spec              TEXT,
    amount            NUMERIC DEFAULT 0,
    advance           NUMERIC DEFAULT 0,
    notes             TEXT,
    status            TEXT DEFAULT 'pending',
    submitted         BOOLEAN DEFAULT false,
    payment_received  NUMERIC DEFAULT 0,
    photo_url         TEXT,
    agreed_tc         BOOLEAN DEFAULT false,
    signature         TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.judge_agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "judge_agreements_all" ON public.judge_agreements;
DROP POLICY IF EXISTS "judge_agreements_all_access" ON public.judge_agreements;
DROP POLICY IF EXISTS "judge_agreements_public_all" ON public.judge_agreements;
DROP POLICY IF EXISTS "judge_agreements_read" ON public.judge_agreements;
DROP POLICY IF EXISTS "judge_agreements_write" ON public.judge_agreements;
CREATE POLICY "judge_agreements_read" ON public.judge_agreements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "judge_agreements_write" ON public.judge_agreements FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: events
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
    id              SERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    date            DATE NOT NULL,
    time            TEXT,
    venue           TEXT,
    organizer       TEXT DEFAULT 'Kalikapur Nabin Sangha',
    description     TEXT,
    category        TEXT DEFAULT 'cultural',
    image           TEXT,
    banner          TEXT,
    whatsapp        TEXT,
    facebook        TEXT,
    whatsapp_number TEXT,
    facebook_url    TEXT,
    "publicReg"     BOOLEAN DEFAULT false,
    "stagePreview"  BOOLEAN DEFAULT false,
    "resultPublic"  BOOLEAN DEFAULT false,
    active          BOOLEAN DEFAULT false,
    switch_states   JSONB DEFAULT '{}'::jsonb,
    form_fields     JSONB DEFAULT '[]'::jsonb,
    staff           JSONB DEFAULT '[]'::jsonb,
    round_schedules JSONB DEFAULT '{}'::jsonb,
    end_date        TEXT,
    end_time        TEXT,
    capacity        INTEGER,
    allow_donations BOOLEAN DEFAULT true,
    target_goal     NUMERIC DEFAULT 50000,
    raised_amount   NUMERIC DEFAULT 0,
    upi_id          TEXT DEFAULT 'kalikapurnabinsangha@sbi',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_all" ON public.events;
DROP POLICY IF EXISTS "events_all_access" ON public.events;
DROP POLICY IF EXISTS "events_public_all" ON public.events;
DROP POLICY IF EXISTS "events_read" ON public.events;
DROP POLICY IF EXISTS "events_write" ON public.events;
CREATE POLICY "events_read" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events_write" ON public.events FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: past_events
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.past_events (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    date        DATE NOT NULL,
    venue       TEXT,
    description TEXT,
    category    TEXT,
    image       TEXT,
    highlights  TEXT[]
);
ALTER TABLE public.past_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "past_events_all" ON public.past_events;
DROP POLICY IF EXISTS "past_events_all_access" ON public.past_events;
DROP POLICY IF EXISTS "past_events_public_all" ON public.past_events;
DROP POLICY IF EXISTS "past_events_read" ON public.past_events;
DROP POLICY IF EXISTS "past_events_write" ON public.past_events;
CREATE POLICY "past_events_read" ON public.past_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "past_events_write" ON public.past_events FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: scoring_subjects
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scoring_subjects (
    id          BIGINT PRIMARY KEY,
    name        TEXT NOT NULL,
    max_marks   INTEGER DEFAULT 10,
    description TEXT,
    event_id    BIGINT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.scoring_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scoring_subjects_all" ON public.scoring_subjects;
DROP POLICY IF EXISTS "scoring_subjects_all_access" ON public.scoring_subjects;
DROP POLICY IF EXISTS "scoring_subjects_public_all" ON public.scoring_subjects;
DROP POLICY IF EXISTS "scoring_subjects_read" ON public.scoring_subjects;
DROP POLICY IF EXISTS "scoring_subjects_write" ON public.scoring_subjects;
CREATE POLICY "scoring_subjects_read" ON public.scoring_subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "scoring_subjects_write" ON public.scoring_subjects FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: categories
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
    id         BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name       TEXT,
    color      TEXT,
    age_min    INTEGER,
    age_max    INTEGER,
    event_id   BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_all" ON public.categories;
DROP POLICY IF EXISTS "categories_all_access" ON public.categories;
DROP POLICY IF EXISTS "categories_public_all" ON public.categories;
DROP POLICY IF EXISTS "categories_read" ON public.categories;
DROP POLICY IF EXISTS "categories_write" ON public.categories;
CREATE POLICY "categories_read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories_write" ON public.categories FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: venues
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.venues (
    id         BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name       TEXT,
    location   TEXT,
    capacity   INTEGER,
    event_id   BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venues_all" ON public.venues;
DROP POLICY IF EXISTS "venues_all_access" ON public.venues;
DROP POLICY IF EXISTS "venues_public_all" ON public.venues;
DROP POLICY IF EXISTS "venues_read" ON public.venues;
DROP POLICY IF EXISTS "venues_write" ON public.venues;
CREATE POLICY "venues_read" ON public.venues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "venues_write" ON public.venues FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: public_registrations
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.public_registrations (
    id             TEXT PRIMARY KEY,
    event_id       TEXT,
    name           TEXT NOT NULL,
    phone          TEXT NOT NULL,
    email          TEXT,
    age            INTEGER,
    gender         TEXT,
    category       TEXT,
    venue          TEXT,
    timestamp      BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
    status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','waitlist')),
    notes          TEXT,
    form_data      JSONB DEFAULT '{}'::jsonb,
    scores         JSONB DEFAULT '{}'::jsonb,
    round_scores   JSONB DEFAULT '{}'::jsonb,
    round_comments JSONB DEFAULT '{}'::jsonb,
    comment        TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.public_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_registrations_all" ON public.public_registrations;
DROP POLICY IF EXISTS "public_registrations_all_access" ON public.public_registrations;
DROP POLICY IF EXISTS "public_registrations_public_all" ON public.public_registrations;
DROP POLICY IF EXISTS "public_registrations_read" ON public.public_registrations;
DROP POLICY IF EXISTS "public_registrations_write" ON public.public_registrations;
CREATE POLICY "public_registrations_read" ON public.public_registrations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_registrations_write" ON public.public_registrations FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: gallery_images
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id         SERIAL PRIMARY KEY,
    src        TEXT NOT NULL,
    title      TEXT NOT NULL,
    category   TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gallery_images_all" ON public.gallery_images;
DROP POLICY IF EXISTS "gallery_images_all_access" ON public.gallery_images;
DROP POLICY IF EXISTS "gallery_images_public_all" ON public.gallery_images;
DROP POLICY IF EXISTS "gallery_images_read" ON public.gallery_images;
DROP POLICY IF EXISTS "gallery_images_write" ON public.gallery_images;
CREATE POLICY "gallery_images_read" ON public.gallery_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "gallery_images_write" ON public.gallery_images FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: notices
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notices (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    date       DATE NOT NULL,
    priority   TEXT DEFAULT 'normal' CHECK (priority IN ('normal','urgent','info')),
    content    TEXT,
    pinned     BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notices_all" ON public.notices;
DROP POLICY IF EXISTS "notices_all_access" ON public.notices;
DROP POLICY IF EXISTS "notices_public_all" ON public.notices;
DROP POLICY IF EXISTS "notices_read" ON public.notices;
DROP POLICY IF EXISTS "notices_write" ON public.notices;
CREATE POLICY "notices_read" ON public.notices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "notices_write" ON public.notices FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));
INSERT INTO public.notices (title, date, priority, content, pinned) VALUES
  ('Dance Championship Registration Open', CURRENT_DATE, 'urgent', 'Registrations are now open for KNSDC Dance Championship.', true),
  ('Annual General Meeting', CURRENT_DATE + 7, 'normal', 'AGM will be held at Club Hall at 6PM. All members are requested to attend.', false),
  ('Venue Confirmed', CURRENT_DATE - 2, 'info', 'Main Stage at Kalikapur Ground is confirmed for all upcoming events.', false)
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: work_items
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_items (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    status      TEXT DEFAULT 'in-progress',
    description TEXT,
    date        DATE,
    progress    INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100)
);
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "work_items_all" ON public.work_items;
DROP POLICY IF EXISTS "work_items_all_access" ON public.work_items;
DROP POLICY IF EXISTS "work_items_public_all" ON public.work_items;
DROP POLICY IF EXISTS "work_items_read" ON public.work_items;
DROP POLICY IF EXISTS "work_items_write" ON public.work_items;
CREATE POLICY "work_items_read" ON public.work_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "work_items_write" ON public.work_items FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: team_members
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_members (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    role       TEXT,
    icon       TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_members_all" ON public.team_members;
DROP POLICY IF EXISTS "team_members_all_access" ON public.team_members;
DROP POLICY IF EXISTS "team_members_public_all" ON public.team_members;
DROP POLICY IF EXISTS "team_members_read" ON public.team_members;
DROP POLICY IF EXISTS "team_members_write" ON public.team_members;
CREATE POLICY "team_members_read" ON public.team_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "team_members_write" ON public.team_members FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: partners
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
    id      SERIAL PRIMARY KEY,
    name    TEXT NOT NULL,
    icon    TEXT,
    color   TEXT,
    website TEXT
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partners_all" ON public.partners;
DROP POLICY IF EXISTS "partners_all_access" ON public.partners;
DROP POLICY IF EXISTS "partners_public_all" ON public.partners;
DROP POLICY IF EXISTS "partners_read" ON public.partners;
DROP POLICY IF EXISTS "partners_write" ON public.partners;
CREATE POLICY "partners_read" ON public.partners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "partners_write" ON public.partners FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: donations
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.donations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id       TEXT,
    event_name     TEXT,
    donor_name     TEXT NOT NULL,
    donor_phone    TEXT,
    donor_email    TEXT,
    amount         NUMERIC NOT NULL,
    message        TEXT,
    upi_ref_no     TEXT,
    payment_status TEXT DEFAULT 'completed',
    is_anonymous   BOOLEAN DEFAULT false,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "donations_all" ON public.donations;
DROP POLICY IF EXISTS "donations_all_access" ON public.donations;
DROP POLICY IF EXISTS "donations_public_all" ON public.donations;
DROP POLICY IF EXISTS "donations_read" ON public.donations;
DROP POLICY IF EXISTS "donations_write" ON public.donations;
CREATE POLICY "donations_read" ON public.donations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "donations_write" ON public.donations FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: public_messages
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.public_messages (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT,
    email      TEXT,
    subject    TEXT,
    message    TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.public_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_messages_all" ON public.public_messages;
DROP POLICY IF EXISTS "public_messages_all_access" ON public.public_messages;
DROP POLICY IF EXISTS "public_messages_public_all" ON public.public_messages;
DROP POLICY IF EXISTS "public_messages_read" ON public.public_messages;
DROP POLICY IF EXISTS "public_messages_write" ON public.public_messages;
CREATE POLICY "public_messages_read" ON public.public_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_messages_write" ON public.public_messages FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: public_ratings
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.public_ratings (
    id         BIGSERIAL PRIMARY KEY,
    rating     NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.public_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_ratings_all" ON public.public_ratings;
DROP POLICY IF EXISTS "public_ratings_all_access" ON public.public_ratings;
DROP POLICY IF EXISTS "public_ratings_public_all" ON public.public_ratings;
DROP POLICY IF EXISTS "public_ratings_read" ON public.public_ratings;
DROP POLICY IF EXISTS "public_ratings_write" ON public.public_ratings;
CREATE POLICY "public_ratings_read" ON public.public_ratings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_ratings_write" ON public.public_ratings FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: ecosystem_log
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ecosystem_log (
    id          BIGSERIAL PRIMARY KEY,
    role        TEXT NOT NULL,
    action      TEXT NOT NULL,
    target_role TEXT,
    payload     JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ecosystem_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ecosystem_log_all" ON public.ecosystem_log;
DROP POLICY IF EXISTS "ecosystem_log_all_access" ON public.ecosystem_log;
DROP POLICY IF EXISTS "ecosystem_log_public_all" ON public.ecosystem_log;
DROP POLICY IF EXISTS "ecosystem_log_read" ON public.ecosystem_log;
DROP POLICY IF EXISTS "ecosystem_log_write" ON public.ecosystem_log;
CREATE POLICY "ecosystem_log_read" ON public.ecosystem_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ecosystem_log_write" ON public.ecosystem_log FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: membership_plans
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    fee             NUMERIC(12,2) NOT NULL DEFAULT 500,
    billing_cycle   TEXT NOT NULL DEFAULT 'monthly',
    description     TEXT,
    color           TEXT DEFAULT '#3b82f6',
    active          BOOLEAN NOT NULL DEFAULT true,
    late_fee_days   INTEGER NOT NULL DEFAULT 10,
    late_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 50,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "membership_plans_all" ON public.membership_plans;
DROP POLICY IF EXISTS "membership_plans_all_access" ON public.membership_plans;
DROP POLICY IF EXISTS "membership_plans_public_all" ON public.membership_plans;
DROP POLICY IF EXISTS "membership_plans_read" ON public.membership_plans;
DROP POLICY IF EXISTS "membership_plans_write" ON public.membership_plans;
CREATE POLICY "membership_plans_read" ON public.membership_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "membership_plans_write" ON public.membership_plans FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));
INSERT INTO public.membership_plans (id, name, fee, billing_cycle, description, color, active, late_fee_days, late_fee_amount)
VALUES 
    ('plan-standard', 'Standard Club Plan', 500, 'monthly', 'Full access to general club facilities, lounge, and community events.', '#3b82f6', true, 10, 50),
    ('plan-premium', 'Premium Sports & Gym', 1000, 'monthly', 'All Standard perks plus fitness gym, sports coaching, sauna, and grounds.', '#8b5cf6', true, 10, 100),
    ('plan-vip', 'VIP Executive Plan', 2500, 'monthly', 'Executive lounge, priority ground bookings, free guest passes & lockers.', '#f59e0b', true, 10, 200),
    ('plan-student', 'Student & Youth Athlete', 300, 'monthly', 'Discounted membership for youth athletes & students with club training.', '#10b981', true, 10, 25)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: members
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.members (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    email        TEXT,
    phone        TEXT,
    plan_id      TEXT REFERENCES public.membership_plans(id) ON DELETE SET NULL,
    role         TEXT NOT NULL DEFAULT 'Member',
    custom_fee   NUMERIC(12,2),
    join_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    status       TEXT NOT NULL DEFAULT 'active',
    notes        TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_all" ON public.members;
DROP POLICY IF EXISTS "members_all_access" ON public.members;
DROP POLICY IF EXISTS "members_public_all" ON public.members;
DROP POLICY IF EXISTS "members_read" ON public.members;
DROP POLICY IF EXISTS "members_write" ON public.members;
CREATE POLICY "members_read" ON public.members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "members_write" ON public.members FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: payment_records
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_records (
    id             TEXT PRIMARY KEY,
    member_id      TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    plan_id        TEXT REFERENCES public.membership_plans(id) ON DELETE SET NULL,
    month_year     TEXT NOT NULL,
    amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT DEFAULT 'cash',
    paid_at        TIMESTAMPTZ,
    invoice_no     TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_records_all" ON public.payment_records;
DROP POLICY IF EXISTS "payment_records_all_access" ON public.payment_records;
DROP POLICY IF EXISTS "payment_records_public_all" ON public.payment_records;
DROP POLICY IF EXISTS "payment_records_read" ON public.payment_records;
DROP POLICY IF EXISTS "payment_records_write" ON public.payment_records;
CREATE POLICY "payment_records_read" ON public.payment_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "payment_records_write" ON public.payment_records FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: club_earnings
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_earnings (
    id                TEXT PRIMARY KEY,
    title             TEXT NOT NULL,
    category          TEXT NOT NULL,
    amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
    date              DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method    TEXT NOT NULL DEFAULT 'cash',
    payer_or_customer TEXT,
    reference_no      TEXT,
    description       TEXT,
    custom_fields     JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.club_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "club_earnings_all" ON public.club_earnings;
DROP POLICY IF EXISTS "club_earnings_all_access" ON public.club_earnings;
DROP POLICY IF EXISTS "club_earnings_public_all" ON public.club_earnings;
DROP POLICY IF EXISTS "club_earnings_read" ON public.club_earnings;
DROP POLICY IF EXISTS "club_earnings_write" ON public.club_earnings;
CREATE POLICY "club_earnings_read" ON public.club_earnings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "club_earnings_write" ON public.club_earnings FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: finance_custom_fields
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.finance_custom_fields (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    label       TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'text',
    entity_type TEXT NOT NULL DEFAULT 'member',
    options     JSONB DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.finance_custom_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_custom_fields_all" ON public.finance_custom_fields;
DROP POLICY IF EXISTS "finance_custom_fields_all_access" ON public.finance_custom_fields;
DROP POLICY IF EXISTS "finance_custom_fields_public_all" ON public.finance_custom_fields;
DROP POLICY IF EXISTS "finance_custom_fields_read" ON public.finance_custom_fields;
DROP POLICY IF EXISTS "finance_custom_fields_write" ON public.finance_custom_fields;
CREATE POLICY "finance_custom_fields_read" ON public.finance_custom_fields FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "finance_custom_fields_write" ON public.finance_custom_fields FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));
INSERT INTO public.finance_custom_fields (id, name, label, type, entity_type, options)
VALUES 
    ('cf-1', 'emergencyContact', 'Emergency Phone', 'text', 'member', '[]'::jsonb),
    ('cf-2', 'lockerNumber', 'Locker #', 'text', 'member', '[]'::jsonb),
    ('cf-3', 'sportActivity', 'Primary Activity', 'select', 'member', '["Cricket", "Football", "Tennis", "Badminton", "Swimming", "Gym & Fitness", "Chess & Cards"]'::jsonb),
    ('cf-4', 'eventSponsorTier', 'Sponsorship Level', 'select', 'earning', '["Platinum Title", "Gold Partner", "Silver Sponsor", "Patron Support"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: club_settings
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_settings (
    key        TEXT PRIMARY KEY,
    value      JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "club_settings_all" ON public.club_settings;
DROP POLICY IF EXISTS "club_settings_all_access" ON public.club_settings;
DROP POLICY IF EXISTS "club_settings_public_all" ON public.club_settings;
DROP POLICY IF EXISTS "club_settings_read" ON public.club_settings;
DROP POLICY IF EXISTS "club_settings_write" ON public.club_settings;
CREATE POLICY "club_settings_read" ON public.club_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "club_settings_write" ON public.club_settings FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: club_assets
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_assets (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    category   TEXT DEFAULT 'Locker',
    code       TEXT,
    fee        NUMERIC(10,2) DEFAULT 0,
    deposit    NUMERIC(10,2) DEFAULT 0,
    status     TEXT DEFAULT 'Available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.club_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "club_assets_all" ON public.club_assets;
DROP POLICY IF EXISTS "club_assets_all_access" ON public.club_assets;
DROP POLICY IF EXISTS "club_assets_public_all" ON public.club_assets;
DROP POLICY IF EXISTS "club_assets_read" ON public.club_assets;
DROP POLICY IF EXISTS "club_assets_write" ON public.club_assets;
CREATE POLICY "club_assets_read" ON public.club_assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "club_assets_write" ON public.club_assets FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: donation_config
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.donation_config (
    id           TEXT PRIMARY KEY,
    razorpay_key TEXT,
    vpa          TEXT,
    payee        TEXT,
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.donation_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "donation_config_all" ON public.donation_config;
DROP POLICY IF EXISTS "donation_config_all_access" ON public.donation_config;
DROP POLICY IF EXISTS "donation_config_public_all" ON public.donation_config;
DROP POLICY IF EXISTS "donation_config_read" ON public.donation_config;
DROP POLICY IF EXISTS "donation_config_write" ON public.donation_config;
CREATE POLICY "donation_config_read" ON public.donation_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "donation_config_write" ON public.donation_config FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));
INSERT INTO public.donation_config (id, razorpay_key, vpa, payee)
VALUES ('main', '', 'kalikapurnabinsangha@sbi', 'Kalikapur Nabin Sangha')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: locker_bookings
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.locker_bookings (
    id             TEXT PRIMARY KEY,
    asset_id       TEXT NOT NULL,
    asset_name     TEXT NOT NULL,
    asset_code     TEXT,
    category       TEXT DEFAULT 'Locker',
    member_name    TEXT NOT NULL,
    member_phone   TEXT,
    start_date     DATE DEFAULT CURRENT_DATE,
    end_date       DATE,
    rent_amount    NUMERIC(10,2) DEFAULT 0,
    deposit_amount NUMERIC(10,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    notes          TEXT,
    status         TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned')),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.locker_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "locker_bookings_all" ON public.locker_bookings;
DROP POLICY IF EXISTS "locker_bookings_all_access" ON public.locker_bookings;
DROP POLICY IF EXISTS "locker_bookings_public_all" ON public.locker_bookings;
DROP POLICY IF EXISTS "locker_bookings_read" ON public.locker_bookings;
DROP POLICY IF EXISTS "locker_bookings_write" ON public.locker_bookings;
CREATE POLICY "locker_bookings_read" ON public.locker_bookings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "locker_bookings_write" ON public.locker_bookings FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: library_books
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.library_books (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    author       TEXT,
    code         TEXT,
    category     TEXT DEFAULT 'General',
    total_copies INT DEFAULT 1,
    fee          NUMERIC(10,2) DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "library_books_all" ON public.library_books;
DROP POLICY IF EXISTS "library_books_all_access" ON public.library_books;
DROP POLICY IF EXISTS "library_books_public_all" ON public.library_books;
DROP POLICY IF EXISTS "library_books_read" ON public.library_books;
DROP POLICY IF EXISTS "library_books_write" ON public.library_books;
CREATE POLICY "library_books_read" ON public.library_books FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "library_books_write" ON public.library_books FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- Table: library_issues
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.library_issues (
    id            TEXT PRIMARY KEY,
    book_id       TEXT NOT NULL,
    book_title    TEXT NOT NULL,
    book_code     TEXT,
    author        TEXT,
    category      TEXT,
    member_name   TEXT NOT NULL,
    member_phone  TEXT,
    issue_date    DATE DEFAULT CURRENT_DATE,
    due_date      DATE,
    returned_date DATE,
    fee           NUMERIC(10,2) DEFAULT 0,
    status        TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'returned')),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.library_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "library_issues_all" ON public.library_issues;
DROP POLICY IF EXISTS "library_issues_all_access" ON public.library_issues;
DROP POLICY IF EXISTS "library_issues_public_all" ON public.library_issues;
DROP POLICY IF EXISTS "library_issues_read" ON public.library_issues;
DROP POLICY IF EXISTS "library_issues_write" ON public.library_issues;
CREATE POLICY "library_issues_read" ON public.library_issues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "library_issues_write" ON public.library_issues FOR ALL TO anon, authenticated
    USING (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'))
    WITH CHECK (coalesce(current_setting('request.jwt.claim.role', true), 'anon') IN ('anon', 'authenticated'));

-- ──────────────────────────────────────────────────────────────────────────────
-- PERFORMANCE INDEXES
-- ──────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_members_plan ON public.members (plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_member_month ON public.payment_records (member_id, month_year);
CREATE INDEX IF NOT EXISTS idx_club_earnings_date ON public.club_earnings (date);
CREATE INDEX IF NOT EXISTS idx_public_reg_event ON public.public_registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_public_reg_phone ON public.public_registrations (phone);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events (date);
CREATE INDEX IF NOT EXISTS idx_judge_agreements_event ON public.judge_agreements (event_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- TRIGGERS FOR AUTO-UPDATING updated_at
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_staff_updated_at ON public.staff_credentials;
CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON public.staff_credentials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_judge_updated_at ON public.judge_credentials;
CREATE TRIGGER trg_judge_updated_at BEFORE UPDATE ON public.judge_credentials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_members_updated_at ON public.members;
CREATE TRIGGER trg_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_plans_updated_at ON public.membership_plans;
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payment_records;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payment_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_earnings_updated_at ON public.club_earnings;
CREATE TRIGGER trg_earnings_updated_at BEFORE UPDATE ON public.club_earnings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_lockers_updated_at ON public.locker_bookings;
CREATE TRIGGER trg_lockers_updated_at BEFORE UPDATE ON public.locker_bookings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_books_updated_at ON public.library_books;
CREATE TRIGGER trg_books_updated_at BEFORE UPDATE ON public.library_books FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_issues_updated_at ON public.library_issues;
CREATE TRIGGER trg_issues_updated_at BEFORE UPDATE ON public.library_issues FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- RPC FUNCTIONS (SECURITY INVOKER, fixed search_path, qualified digest)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prune_old_logs(days_old INT DEFAULT 30)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.ecosystem_log WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions;

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

GRANT EXECUTE ON FUNCTION public.admin_staff_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_staff(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_staff(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_staff_role(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_staff(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_old_logs(INT) TO anon, authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKET CONFIGURATION ('knsdc-registration')
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('knsdc-registration', 'knsdc-registration', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "knsdc_reg_public_select" ON storage.objects;
DROP POLICY IF EXISTS "knsdc_reg_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "knsdc_reg_public_update" ON storage.objects;
DROP POLICY IF EXISTS "knsdc_reg_public_delete" ON storage.objects;

CREATE POLICY "knsdc_reg_public_insert" ON storage.objects
    FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'knsdc-registration');

CREATE POLICY "knsdc_reg_public_update" ON storage.objects
    FOR UPDATE TO anon, authenticated WITH CHECK (bucket_id = 'knsdc-registration');

CREATE POLICY "knsdc_reg_public_delete" ON storage.objects
    FOR DELETE TO anon, authenticated USING (bucket_id = 'knsdc-registration');

-- ──────────────────────────────────────────────────────────────────────────────
-- REALTIME REPLICATION
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_state;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ecosystem_log;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.public_registrations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.judge_agreements;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- RELOAD SCHEMA CACHE
-- ──────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- ALL DONE
-- ==============================================================================
