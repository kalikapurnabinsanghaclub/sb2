-- ==========================================
-- SUPABASE RLS UPDATE FOR CATEGORIES & VENUES
-- Run this in the Supabase SQL Editor to fix empty dropdowns on public forms.
-- ==========================================

-- Enable Row Level Security (RLS) on Categories and Venues
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "categories_read" ON public.categories;
DROP POLICY IF EXISTS "categories_manage" ON public.categories;
DROP POLICY IF EXISTS "venues_read" ON public.venues;
DROP POLICY IF EXISTS "venues_manage" ON public.venues;

-- 1. Create Policies for Categories
-- Allow anyone (including anonymous public users) to read/select categories
CREATE POLICY "categories_read"
  ON public.categories FOR SELECT
  USING (true);

-- Allow authenticated users (staff, admins) to manage categories (INSERT, UPDATE, DELETE)
CREATE POLICY "categories_manage"
  ON public.categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Create Policies for Venues
-- Allow anyone (including anonymous public users) to read/select venues
CREATE POLICY "venues_read"
  ON public.venues FOR SELECT
  USING (true);

-- Allow authenticated users (staff, admins) to manage venues (INSERT, UPDATE, DELETE)
CREATE POLICY "venues_manage"
  ON public.venues FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also ensure public select is active on Events (just in case)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_read" ON public.events;
CREATE POLICY "events_read"
  ON public.events FOR SELECT
  USING (true);
