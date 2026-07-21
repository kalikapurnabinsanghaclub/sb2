-- ============================================================
-- KNSDC — CONSOLIDATED SUPABASE ECOSYSTEM SETUP SCRIPT
-- Project : https://mmbtfbxxnprtzpzdklot.supabase.co
-- Anon Key: sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA
--
-- INSTRUCTIONS:
-- 1. Run this script in the Supabase SQL Editor to initialize all tables.
-- 2. This script is fully idempotent (safe to re-run multiple times).
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- SECTION 1: CORE REALTIME SYSTEM STATE
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.sync_state (
    id           TEXT PRIMARY KEY,
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sync_state_public_all" ON public.sync_state;
CREATE POLICY "sync_state_public_all" ON public.sync_state FOR ALL USING (true) WITH CHECK (true);

-- Seed initial global sync row
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


-- ══════════════════════════════════════════════════════════════
-- SECTION 2: STAFF & JUDGE CREDENTIALS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.staff_credentials (
    id            SERIAL PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin','monitor','host','judge','sportsmanager')),
    active        BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.staff_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_read_all" ON public.staff_credentials;
DROP POLICY IF EXISTS "staff_manage_all" ON public.staff_credentials;
CREATE POLICY "staff_read_all" ON public.staff_credentials FOR SELECT USING (true);
CREATE POLICY "staff_manage_all" ON public.staff_credentials FOR ALL USING (true) WITH CHECK (true);

-- Seed default administrative and monitor users
-- Passwords: admin123 (for admin), monitor1 (for monitor), host1234 (for host)
INSERT INTO public.staff_credentials (email, password_hash, name, role)
VALUES
  ('admin@knsdc.in',   '240be518fabd2724ddb6f04eeb1da5967448d7e831d9a5be0c2f7ede04e26f0', 'KNSDC Admin',  'admin'),
  ('monitor@knsdc.in', '9166bfc7bb2e68c5a44862aca8ff0a25e7cdc3e8f3cc15b5849640a5af1c4bae', 'Live Monitor', 'monitor'),
  ('host@knsdc.in',    '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'Event Host',   'host'),
  ('souravbairagi121999@gmail.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831d9a5be0c2f7ede04e26f0', 'Super Admin', 'admin'),
  ('laxmi@gmail.com',  'ffb7bcda5db5dc45aa8058ab92162526f821cdb682308bcab5f9edb6456c15a6', 'SAGBID',       'monitor')
ON CONFLICT (email) DO NOTHING;


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
DROP POLICY IF EXISTS "judge_creds_read" ON public.judge_credentials;
DROP POLICY IF EXISTS "judge_creds_upsert" ON public.judge_credentials;
CREATE POLICY "judge_creds_read" ON public.judge_credentials FOR SELECT USING (true);
CREATE POLICY "judge_creds_upsert" ON public.judge_credentials FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 3: JUDGE AGREEMENTS (Real-time Global Source of Truth)
-- ══════════════════════════════════════════════════════════════

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
CREATE POLICY "judge_agreements_all" ON public.judge_agreements FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 4: EVENTS AND SCHEDULING
-- ══════════════════════════════════════════════════════════════

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
    "publicReg"     BOOLEAN DEFAULT false,
    "stagePreview"  BOOLEAN DEFAULT false,
    "resultPublic"  BOOLEAN DEFAULT false,
    active          BOOLEAN DEFAULT false,
    switch_states   JSONB DEFAULT '{}'::jsonb,
    form_fields     JSONB DEFAULT '[]'::jsonb,
    staff           JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_read" ON public.events;
DROP POLICY IF EXISTS "events_manage" ON public.events;
CREATE POLICY "events_read" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_manage" ON public.events FOR ALL USING (true) WITH CHECK (true);


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
DROP POLICY IF EXISTS "past_events_read" ON public.past_events;
DROP POLICY IF EXISTS "past_events_manage" ON public.past_events;
CREATE POLICY "past_events_read" ON public.past_events FOR SELECT USING (true);
CREATE POLICY "past_events_manage" ON public.past_events FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 5: SCORING SUBJECTS, CATEGORIES & VENUES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.scoring_subjects (
    id          BIGINT PRIMARY KEY,
    name        TEXT NOT NULL,
    max_marks   INTEGER DEFAULT 10,
    description TEXT,
    event_id    BIGINT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scoring_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subjects_read" ON public.scoring_subjects;
DROP POLICY IF EXISTS "subjects_manage" ON public.scoring_subjects;
CREATE POLICY "subjects_read" ON public.scoring_subjects FOR SELECT USING (true);
CREATE POLICY "subjects_manage" ON public.scoring_subjects FOR ALL USING (true) WITH CHECK (true);


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
DROP POLICY IF EXISTS "categories_read" ON public.categories;
DROP POLICY IF EXISTS "categories_manage" ON public.categories;
CREATE POLICY "categories_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_manage" ON public.categories FOR ALL USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.venues (
    id         BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name       TEXT,
    location   TEXT,
    capacity   INTEGER,
    event_id   BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venues_read" ON public.venues;
DROP POLICY IF EXISTS "venues_manage" ON public.venues;
CREATE POLICY "venues_read" ON public.venues FOR SELECT USING (true);
CREATE POLICY "venues_manage" ON public.venues FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 6: PARTICIPANTS & REGISTRATIONS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.public_registrations (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id   TEXT,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    email      TEXT,
    age        INTEGER,
    gender     TEXT,
    category   TEXT,
    venue      TEXT,
    timestamp  BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
    status     TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','waitlist')),
    notes      TEXT,
    form_data  JSONB DEFAULT '{}'::jsonb,
    scores     JSONB DEFAULT '{}'::jsonb,
    round_scores JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.public_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pub_reg_all" ON public.public_registrations;
CREATE POLICY "pub_reg_all" ON public.public_registrations FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 7: WEBSITE CONTENT (GALLERY, NOTICES, DONATIONS, SPONSORS)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.gallery_images (
    id         SERIAL PRIMARY KEY,
    src        TEXT NOT NULL,
    title      TEXT NOT NULL,
    category   TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gallery_all" ON public.gallery_images;
CREATE POLICY "gallery_all" ON public.gallery_images FOR ALL USING (true) WITH CHECK (true);


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
CREATE POLICY "notices_all" ON public.notices FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.notices (title, date, priority, content, pinned) VALUES
  ('Dance Championship Registration Open', CURRENT_DATE, 'urgent', 'Registrations are now open for KNSDC 2026 Dance Championship. Last date: 30th June 2026.', true),
  ('Annual General Meeting', CURRENT_DATE + 7, 'normal', 'AGM will be held at Club Hall at 6PM. All members are requested to attend.', false)
ON CONFLICT DO NOTHING;


CREATE TABLE IF NOT EXISTS public.donations (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    target     NUMERIC(12,2) NOT NULL DEFAULT 0,
    raised     NUMERIC(12,2) NOT NULL DEFAULT 0,
    icon       TEXT DEFAULT '💰',
    color      TEXT DEFAULT '#8B5CF6',
    active     BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "donations_all" ON public.donations;
CREATE POLICY "donations_all" ON public.donations FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.donations (name, target, raised, icon, color) VALUES
  ('Annual Fast Fund',      50000,  32500, '🙏', '#FF6B35'),
  ('Dance Ignition Vol.7', 100000,  78000, '💃', '#7B2D8B'),
  ('Sports Equipment',      30000,  18000, '⚽', '#10B981'),
  ('Club Infrastructure',  200000, 145000, '🏛️', '#F59E0B'),
  ('Youth Scholarship',     80000,  55000, '🎓', '#E91E8C')
ON CONFLICT DO NOTHING;


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
CREATE POLICY "work_items_all" ON public.work_items FOR ALL USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.team_members (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    role       TEXT,
    icon       TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_all" ON public.team_members;
CREATE POLICY "team_all" ON public.team_members FOR ALL USING (true) WITH CHECK (true);


CREATE TABLE IF NOT EXISTS public.partners (
    id      SERIAL PRIMARY KEY,
    name    TEXT NOT NULL,
    icon    TEXT,
    color   TEXT,
    website TEXT
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partners_all" ON public.partners;
CREATE POLICY "partners_all" ON public.partners FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 8: ECOSYSTEM ACTIVITY LOGGER
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ecosystem_log (
    id          BIGSERIAL PRIMARY KEY,
    role        TEXT NOT NULL,
    action      TEXT NOT NULL,
    target_role TEXT,
    payload     JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ecosystem_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eco_log_all" ON public.ecosystem_log;
CREATE POLICY "eco_log_all" ON public.ecosystem_log FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 9: UTILITY TRIGGERS
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_updated_at ON public.staff_credentials;
CREATE TRIGGER trg_staff_updated_at
    BEFORE UPDATE ON public.staff_credentials
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_judge_updated_at ON public.judge_credentials;
CREATE TRIGGER trg_judge_updated_at
    BEFORE UPDATE ON public.judge_credentials
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ══════════════════════════════════════════════════════════════
-- SECTION 10: REALTIME PUBLICATIONS SUBSCRIPTION
-- ══════════════════════════════════════════════════════════════

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
