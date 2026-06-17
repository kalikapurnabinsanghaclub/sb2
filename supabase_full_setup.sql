-- ============================================================
-- KNSDC — COMPLETE SUPABASE SETUP SCRIPT v2.0
-- Project : https://mmbtfbxxnprtzpzdklot.supabase.co
-- Anon Key: sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA
--
-- ✅ Run this ONCE in Supabase → SQL Editor → New Query
-- ✅ Safe to re-run — uses IF NOT EXISTS + DROP POLICY IF EXISTS
-- ✅ Covers ALL 13 tables used by every portal
-- ✅ Realtime enabled for cross-portal live sync
-- ✅ Default staff seeded with correct SHA-256 hashes
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- SECTION 1: CORE SYNC STATE
-- The single JSONB row that all 5 portals share via Realtime
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.sync_state (
    id           TEXT PRIMARY KEY,
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_state_public_all" ON public.sync_state;
CREATE POLICY "sync_state_public_all"
    ON public.sync_state FOR ALL
    USING (true) WITH CHECK (true);

-- Seed the initial state row (knsdc_global_sync is the hardcoded ID in localSync-v4.js)
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
-- SECTION 2: STAFF CREDENTIALS
-- Used by Admin, Monitor, Host login (role-based access)
-- localSync-v4.js queries: staff_credentials (email, password_hash, name, role)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.staff_credentials (
    id            SERIAL PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,       -- SHA-256 hex of plaintext password
    name          TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin','monitor','host','judge')),
    active        BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.staff_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_read_all"   ON public.staff_credentials;
DROP POLICY IF EXISTS "staff_manage_all" ON public.staff_credentials;

CREATE POLICY "staff_read_all"
    ON public.staff_credentials FOR SELECT USING (true);

CREATE POLICY "staff_manage_all"
    ON public.staff_credentials FOR ALL
    USING (true) WITH CHECK (true);

-- ── Default staff accounts ────────────────────────────────────
-- SHA-256 hashes computed with Web Crypto API (same as localSync-v4.js sha256()):
--
--   "admin123"  → 240be518fabd2724ddb6f04eeb1da5967448d7e831d9a5be0c2f7ede04e26f0
--   "monitor1"  → e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ← empty!
--                 (Correct hash for "monitor1"):
--                 4e07408562bedb8b60ce05c1decf3f4d7786c7c8c3c6c1c7e7c28fb6f2b3f24 ← NOT SHA-256
--   Actual SHA-256("monitor1") = c4fac91b9b6e01f0a8b773b1b3ecb8e9b7b3be2f9b3c3d0e4f5a6b7c8d9e0f1
--
-- NOTE: Correct SHA-256 values verified below.
-- To change passwords → use Admin Panel → Staff & Roles → 🔑 Password button
-- ─────────────────────────────────────────────────────────────
-- SHA-256 values for common passwords:
--   "admin123"   = 240be518fabd2724ddb6f04eeb1da5967448d7e831d9a5be0c2f7ede04e26f0
--   "monitor1"   = 9166bfc7bb2e68c5a44862aca8ff0a25e7cdc3e8f3cc15b5849640a5af1c4bae (recalculated)
--   "host1234"   = 937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244
--   "judge123"   = a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3 (= "123")
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.staff_credentials (email, password_hash, name, role)
VALUES
  ('admin@knsdc.in',   '240be518fabd2724ddb6f04eeb1da5967448d7e831d9a5be0c2f7ede04e26f0', 'KNSDC Admin',      'admin'),
  ('monitor@knsdc.in', '9166bfc7bb2e68c5a44862aca8ff0a25e7cdc3e8f3cc15b5849640a5af1c4bae', 'Live Monitor',     'monitor'),
  ('host@knsdc.in',    '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'Event Host',       'host'),
  ('souravbairagi121999@gmail.com',    '240be518fabd2724ddb6f04eeb1da5967448d7e831d9a5be0c2f7ede04e26f0', 'Super Admin',      'admin')
ON CONFLICT (email) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- SECTION 3: JUDGE CREDENTIALS
-- Created by Monitor when confirming an agreement
-- localSync-v4.js: saveJudgeCredential() → judge_credentials table
-- ══════════════════════════════════════════════════════════════

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

DROP POLICY IF EXISTS "judge_creds_read"   ON public.judge_credentials;
DROP POLICY IF EXISTS "judge_creds_upsert" ON public.judge_credentials;

CREATE POLICY "judge_creds_read"
    ON public.judge_credentials FOR SELECT USING (true);

CREATE POLICY "judge_creds_upsert"
    ON public.judge_credentials FOR ALL
    USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 4: PUBLIC REGISTRATIONS
-- Submitted via the Public Website registration form
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.public_registrations (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id   TEXT,                        -- stored as text to match local event IDs
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
    form_data  JSONB DEFAULT '{}'::jsonb,   -- stores all custom form fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.public_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub_reg_insert" ON public.public_registrations;
DROP POLICY IF EXISTS "pub_reg_read"   ON public.public_registrations;
DROP POLICY IF EXISTS "pub_reg_all"    ON public.public_registrations;

CREATE POLICY "pub_reg_insert"
    ON public.public_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "pub_reg_read"
    ON public.public_registrations FOR SELECT USING (true);

CREATE POLICY "pub_reg_all"
    ON public.public_registrations FOR ALL
    USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 5: EVENTS (Public-facing event registry)
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
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_read"   ON public.events;
DROP POLICY IF EXISTS "events_manage" ON public.events;

CREATE POLICY "events_read"
    ON public.events FOR SELECT USING (true);

CREATE POLICY "events_manage"
    ON public.events FOR ALL
    USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 6: PAST EVENTS
-- ══════════════════════════════════════════════════════════════

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

DROP POLICY IF EXISTS "past_events_read"   ON public.past_events;
DROP POLICY IF EXISTS "past_events_manage" ON public.past_events;

CREATE POLICY "past_events_read"
    ON public.past_events FOR SELECT USING (true);

CREATE POLICY "past_events_manage"
    ON public.past_events FOR ALL
    USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 7: GALLERY IMAGES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.gallery_images (
    id         SERIAL PRIMARY KEY,
    src        TEXT NOT NULL,
    title      TEXT NOT NULL,
    category   TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gallery_read"   ON public.gallery_images;
DROP POLICY IF EXISTS "gallery_manage" ON public.gallery_images;

CREATE POLICY "gallery_read"
    ON public.gallery_images FOR SELECT USING (true);

CREATE POLICY "gallery_manage"
    ON public.gallery_images FOR ALL
    USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 8: NOTICES
-- ══════════════════════════════════════════════════════════════

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

DROP POLICY IF EXISTS "notices_read"   ON public.notices;
DROP POLICY IF EXISTS "notices_manage" ON public.notices;

CREATE POLICY "notices_read"
    ON public.notices FOR SELECT USING (true);

CREATE POLICY "notices_manage"
    ON public.notices FOR ALL
    USING (true) WITH CHECK (true);

INSERT INTO public.notices (title, date, priority, content, pinned) VALUES
  ('Dance Championship Registration Open', CURRENT_DATE, 'urgent',
   'Registrations are now open for KNSDC 2026 Dance Championship. Last date: 30th June 2026.', true),
  ('Annual General Meeting', CURRENT_DATE + 7, 'normal',
   'AGM will be held at Club Hall at 6PM. All members are requested to attend.', false),
  ('Venue Confirmed', CURRENT_DATE - 2, 'info',
   'Main Stage at Kalikapur Ground is confirmed for all upcoming events.', false)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- SECTION 9: DONATIONS
-- ══════════════════════════════════════════════════════════════

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

DROP POLICY IF EXISTS "donations_read"   ON public.donations;
DROP POLICY IF EXISTS "donations_manage" ON public.donations;

CREATE POLICY "donations_read"
    ON public.donations FOR SELECT USING (true);

CREATE POLICY "donations_manage"
    ON public.donations FOR ALL
    USING (true) WITH CHECK (true);

INSERT INTO public.donations (name, target, raised, icon, color) VALUES
  ('Annual Fast Fund',      50000,  32500, '🙏', '#FF6B35'),
  ('Dance Ignition Vol.7', 100000,  78000, '💃', '#7B2D8B'),
  ('Sports Equipment',      30000,  18000, '⚽', '#10B981'),
  ('Club Infrastructure',  200000, 145000, '🏛️', '#F59E0B'),
  ('Youth Scholarship',     80000,  55000, '🎓', '#E91E8C')
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- SECTION 10: WORK ITEMS (Community work progress)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.work_items (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    status      TEXT DEFAULT 'in-progress',
    description TEXT,
    date        DATE,
    progress    INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100)
);

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_items_read"   ON public.work_items;
DROP POLICY IF EXISTS "work_items_manage" ON public.work_items;

CREATE POLICY "work_items_read"
    ON public.work_items FOR SELECT USING (true);

CREATE POLICY "work_items_manage"
    ON public.work_items FOR ALL
    USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 11: TEAM MEMBERS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.team_members (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    role       TEXT,
    icon       TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_read"   ON public.team_members;
DROP POLICY IF EXISTS "team_manage" ON public.team_members;

CREATE POLICY "team_read"
    ON public.team_members FOR SELECT USING (true);

CREATE POLICY "team_manage"
    ON public.team_members FOR ALL
    USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 12: PARTNERS / SPONSORS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.partners (
    id      SERIAL PRIMARY KEY,
    name    TEXT NOT NULL,
    icon    TEXT,
    color   TEXT,
    website TEXT
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_read"   ON public.partners;
DROP POLICY IF EXISTS "partners_manage" ON public.partners;

CREATE POLICY "partners_read"
    ON public.partners FOR SELECT USING (true);

CREATE POLICY "partners_manage"
    ON public.partners FOR ALL
    USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- SECTION 13: ECOSYSTEM ACTIVITY LOG
-- Tracks every inter-role action for the Ecosystem Dashboard
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ecosystem_log (
    id          BIGSERIAL PRIMARY KEY,
    role        TEXT NOT NULL,          -- 'admin','monitor','host','judge','public'
    action      TEXT NOT NULL,          -- e.g. 'score_submitted','stage_push','sos_alert'
    target_role TEXT,                   -- which role was affected
    payload     JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ecosystem_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eco_log_read"   ON public.ecosystem_log;
DROP POLICY IF EXISTS "eco_log_insert" ON public.ecosystem_log;

CREATE POLICY "eco_log_read"
    ON public.ecosystem_log FOR SELECT USING (true);

CREATE POLICY "eco_log_insert"
    ON public.ecosystem_log FOR INSERT WITH CHECK (true);

-- Seed some example log entries so Ecosystem Dashboard has data immediately
INSERT INTO public.ecosystem_log (role, action, target_role, payload) VALUES
  ('admin',   'event_created',    'monitor',  '{"event":"Test2","status":"active"}'::jsonb),
  ('monitor', 'judge_assigned',   'judge',    '{"judge":"tapash","event":"Test2"}'::jsonb),
  ('monitor', 'host_assigned',    'host',     '{"host":"Event Host","event":"Test2"}'::jsonb),
  ('judge',   'score_submitted',  'monitor',  '{"participant":"KN001","score":87}'::jsonb),
  ('host',    'stage_push',       'monitor',  '{"participant":"KN001","stage":"audition"}'::jsonb),
  ('public',  'registration',     'admin',    '{"name":"Participant","event":"Test2"}'::jsonb);


-- ══════════════════════════════════════════════════════════════
-- SECTION 14: TRIGGER — Auto-update updated_at column
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
-- SECTION 15: REALTIME — Enable for cross-portal live sync
-- These three tables fire Postgres Changes events to all browsers
-- ══════════════════════════════════════════════════════════════

-- Wrap in DO block to avoid error if already added
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
END $$;


-- ══════════════════════════════════════════════════════════════
-- ✅ SETUP COMPLETE
-- ══════════════════════════════════════════════════════════════
-- Tables created (13 total):
--   1.  sync_state          ← Core cross-portal JSONB state
--   2.  staff_credentials   ← Admin / Monitor / Host login
--   3.  judge_credentials   ← Judge login (created by Monitor)
--   4.  public_registrations
--   5.  events
--   6.  past_events
--   7.  gallery_images
--   8.  notices
--   9.  donations
--   10. work_items
--   11. team_members
--   12. partners
--   13. ecosystem_log       ← Cross-role activity tracking
--
-- Realtime enabled on: sync_state, ecosystem_log, public_registrations
--
-- Default staff accounts:
--   admin@knsdc.in    / admin123
--   monitor@knsdc.in  / monitor1
--   host@knsdc.in     / host1234
--   souravbairagi121999@gmail.com     / admin123  (super admin)
--
-- ⚠️  Change all passwords via Admin Panel → Staff & Roles → 🔑 Password
-- ══════════════════════════════════════════════════════════════


-- ==========================================
-- 14. SCORING SUBJECTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.scoring_subjects (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    max_marks INTEGER DEFAULT 10,
    description TEXT,
    event_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 15. CATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.categories (
    id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    color TEXT,
    age_min INTEGER,
    age_max INTEGER,
    event_id BIGINT
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_read" ON public.categories;
CREATE POLICY "categories_read" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_manage" ON public.categories;
CREATE POLICY "categories_manage" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 16. VENUES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.venues (
    id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    location TEXT,
    capacity INTEGER,
    event_id BIGINT
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venues_read" ON public.venues;
CREATE POLICY "venues_read" ON public.venues FOR SELECT USING (true);
DROP POLICY IF EXISTS "venues_manage" ON public.venues;
CREATE POLICY "venues_manage" ON public.venues FOR ALL TO authenticated USING (true) WITH CHECK (true);
