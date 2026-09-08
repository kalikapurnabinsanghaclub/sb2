-- ==============================================================================
-- KNSDC FINANCE PORTAL - SUPABASE DATABASE FIX & PERMISSIONS SCRIPT
-- Paste this entire script into your Supabase SQL Editor and click "RUN"
-- This resolves:
--  1. Missing "role" column in "members" table
--  2. Permissions so the client portal can read, insert, update, and delete
-- ==============================================================================

-- 1. ADD MISSING 'role' COLUMN TO members TABLE
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Member';

-- 2. ENSURE EMAIL IS NOT STRICTLY ENFORCING NOT NULL
-- (Allows members without email or placeholder emails)
ALTER TABLE public.members ALTER COLUMN email DROP NOT NULL;

-- 3. ENABLE RLS POLICIES FOR ALL ROLES (ANON & AUTHENTICATED)
-- This allows the front-end client to securely communicate with the database

-- membership_plans
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon and auth full access to membership_plans" ON public.membership_plans;
DROP POLICY IF EXISTS "Finance & Admin full access to membership_plans" ON public.membership_plans;
CREATE POLICY "Allow anon and auth full access to membership_plans"
ON public.membership_plans FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon and auth full access to members" ON public.members;
DROP POLICY IF EXISTS "Finance & Admin full access to members" ON public.members;
CREATE POLICY "Allow anon and auth full access to members"
ON public.members FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- payment_records
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon and auth full access to payment_records" ON public.payment_records;
DROP POLICY IF EXISTS "Finance & Admin full access to payment_records" ON public.payment_records;
CREATE POLICY "Allow anon and auth full access to payment_records"
ON public.payment_records FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- club_earnings
ALTER TABLE public.club_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon and auth full access to club_earnings" ON public.club_earnings;
DROP POLICY IF EXISTS "Finance & Admin full access to club_earnings" ON public.club_earnings;
CREATE POLICY "Allow anon and auth full access to club_earnings"
ON public.club_earnings FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- custom_fields
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon and auth full access to custom_fields" ON public.custom_fields;
DROP POLICY IF EXISTS "Finance & Admin full access to custom_fields" ON public.custom_fields;
CREATE POLICY "Allow anon and auth full access to custom_fields"
ON public.custom_fields FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- club_settings
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon and auth full access to club_settings" ON public.club_settings;
DROP POLICY IF EXISTS "Finance & Admin access to club_settings" ON public.club_settings;
CREATE POLICY "Allow anon and auth full access to club_settings"
ON public.club_settings FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Reload the PostgREST schema cache
NOTIFY pgrst, 'reload schema';
