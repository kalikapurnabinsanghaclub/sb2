-- Supabase SQL Schema for Kalikapur Nabin Sangha Portal
-- Run this in your Supabase SQL Editor

-- 1. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT,
    venue TEXT,
    description TEXT,
    category TEXT,
    image TEXT,
    "publicReg" BOOLEAN DEFAULT false,
    "stagePreview" BOOLEAN DEFAULT false,
    "resultPublic" BOOLEAN DEFAULT false
);

-- 2. Past Events Table
CREATE TABLE IF NOT EXISTS public.past_events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    venue TEXT,
    description TEXT,
    category TEXT,
    image TEXT,
    highlights TEXT[] -- Array of strings
);

-- 3. Gallery Images Table
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id SERIAL PRIMARY KEY,
    src TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT
);

-- 4. Notices Table
CREATE TABLE IF NOT EXISTS public.notices (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    priority TEXT,
    content TEXT,
    pinned BOOLEAN DEFAULT false
);

-- 5. Work Items Table
CREATE TABLE IF NOT EXISTS public.work_items (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT,
    description TEXT,
    date DATE,
    progress INTEGER DEFAULT 0
);

-- 6. Public Registrations Table
CREATE TABLE IF NOT EXISTS public.public_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER,
    timestamp BIGINT
);

-- 7. Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    icon TEXT
);

-- 8. Partners Table
CREATE TABLE IF NOT EXISTS public.partners (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    website TEXT
);

-- Optional: Enable Row Level Security (RLS) and create basic policies
-- For now, we will allow public read access to all visual tables, and allow public inserts only to registrations.
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone on these tables
CREATE POLICY "Allow public read access" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.past_events FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.work_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.partners FOR SELECT USING (true);

-- Registrations: allow anyone to insert, but only admins to read (this is generic)
CREATE POLICY "Allow public insert" ON public.public_registrations FOR INSERT WITH CHECK (true);


-- 9. Sync State Table (Global App State)
CREATE TABLE IF NOT EXISTS public.sync_state (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write access" ON public.sync_state FOR ALL USING (true);

-- Enable Realtime for the sync_state table (CRITICAL for portal synchronization)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_state;

