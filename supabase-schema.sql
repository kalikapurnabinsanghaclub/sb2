-- KNSDC Ecosystem Supabase Database Schema Setup Script
-- Run this script in your Supabase SQL Editor to initialize all tables needed for the application.

-- 1. Create Core Tables

-- Sync State (Real-time application state)
CREATE TABLE IF NOT EXISTS public.sync_state (
  id text PRIMARY KEY,
  payload jsonb,
  last_updated timestamptz
);

-- Staff Credentials
CREATE TABLE IF NOT EXISTS public.staff_credentials (
  email text PRIMARY KEY,
  password_hash text,
  name text,
  role text
);

-- Judge Credentials
CREATE TABLE IF NOT EXISTS public.judge_credentials (
  email text PRIMARY KEY,
  password_hash text,
  name text,
  event_id text,
  agreement_id numeric,
  category text,
  color text
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  title text,
  date text,
  time text,
  venue text,
  description text,
  category text,
  image text,
  "publicReg" boolean,
  "stagePreview" boolean,
  "resultPublic" boolean,
  form_fields jsonb
);

-- Past Events
CREATE TABLE IF NOT EXISTS public.past_events (
  id text PRIMARY KEY,
  title text,
  date text,
  venue text,
  description text,
  category text,
  image text,
  highlights text
);

-- Public Registrations
CREATE TABLE IF NOT EXISTS public.public_registrations (
  id text PRIMARY KEY,
  name text,
  phone text,
  age numeric,
  category text,
  transaction_id text,
  payment_proof_url text,
  social_link text,
  guardian_name text,
  emergency_contact text,
  status text,
  event_id text,
  form_data jsonb,
  submitted_at timestamptz DEFAULT now()
);

-- Gallery Images
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id text PRIMARY KEY,
  src text,
  title text,
  category text
);

-- Notices
CREATE TABLE IF NOT EXISTS public.notices (
  id text PRIMARY KEY,
  title text,
  date text,
  priority text,
  content text,
  pinned boolean
);

-- Work Items
CREATE TABLE IF NOT EXISTS public.work_items (
  id text PRIMARY KEY,
  title text,
  status text,
  description text,
  date text,
  progress numeric
);

-- Partners
CREATE TABLE IF NOT EXISTS public.partners (
  id text PRIMARY KEY,
  name text,
  icon text,
  color text,
  website text
);

-- Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
  id numeric PRIMARY KEY,
  name text,
  role text,
  icon text
);

-- Donations
CREATE TABLE IF NOT EXISTS public.donations (
  id numeric PRIMARY KEY,
  name text,
  target numeric,
  raised numeric,
  icon text,
  color text
);

-- Ecosystem Log
CREATE TABLE IF NOT EXISTS public.ecosystem_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp numeric,
  action text,
  details text,
  user_email text
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id numeric PRIMARY KEY,
  name text,
  color text,
  age_min numeric,
  age_max numeric,
  event_id text
);

-- Venues
CREATE TABLE IF NOT EXISTS public.venues (
  id numeric PRIMARY KEY,
  name text,
  location text,
  event_id text
);

-- Judge Agreements
CREATE TABLE IF NOT EXISTS public.judge_agreements (
  id numeric PRIMARY KEY,
  name text,
  phone text,
  email text,
  password text,
  city text,
  event_id text,
  date text,
  date_upto text,
  time text,
  venue_id numeric,
  venue_name text,
  spec text,
  amount numeric,
  advance numeric,
  notes text,
  status text,
  submitted boolean,
  payment_received numeric,
  photo_url text,
  agreed_tc boolean,
  signature text,
  created_at timestamptz DEFAULT now()
);

-- Scoring Subjects
CREATE TABLE IF NOT EXISTS public.scoring_subjects (
  id numeric PRIMARY KEY,
  name text,
  max_marks numeric,
  description text,
  event_id text
);

-- Public Messages (Contact Form)
CREATE TABLE IF NOT EXISTS public.public_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  message text,
  timestamp numeric
);


-- 2. Enable Realtime on sync_state (Using a safe DO block to prevent duplicate errors)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'sync_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_state;
  END IF;
END $$;

-- 3. Row Level Security (RLS) Setup
-- Since the application operates largely as a client-side database through LocalSync,
-- we'll disable RLS to allow the anon key to perform CRUD operations smoothly for the ecosystem logic.

ALTER TABLE public.sync_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_messages DISABLE ROW LEVEL SECURITY;

-- Setup complete!
