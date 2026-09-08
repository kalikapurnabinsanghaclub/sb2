-- ==============================================================================
-- KNSDC COMPLETE FINANCE PORTAL DATABASE SCHEMA (SUPABASE)
-- Run this in your Supabase SQL Editor to enable full live cloud database sync
-- ==============================================================================

-- 1. Ensure staff_credentials allows all roles including 'finance'
ALTER TABLE IF EXISTS public.staff_credentials 
  DROP CONSTRAINT IF EXISTS staff_credentials_role_check;

-- 2. Membership Plans Table
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fee NUMERIC(12,2) NOT NULL DEFAULT 500,
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    active BOOLEAN NOT NULL DEFAULT true,
    late_fee_days INTEGER NOT NULL DEFAULT 10,
    late_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default plans if table is empty
INSERT INTO public.membership_plans (id, name, fee, billing_cycle, description, color, active, late_fee_days, late_fee_amount)
VALUES 
    ('plan-standard', 'Standard Club Plan', 500, 'monthly', 'Full access to general club facilities, lounge, and community events.', '#3b82f6', true, 10, 50),
    ('plan-premium', 'Premium Sports & Gym', 1000, 'monthly', 'All Standard perks plus fitness gym, sports coaching, sauna, and grounds.', '#8b5cf6', true, 10, 100),
    ('plan-vip', 'VIP Executive Plan', 2500, 'monthly', 'Executive lounge, priority ground bookings, free guest passes & lockers.', '#f59e0b', true, 10, 200),
    ('plan-student', 'Student & Youth Athlete', 300, 'monthly', 'Discounted membership for youth athletes & students with club training.', '#10b981', true, 10, 25)
ON CONFLICT (id) DO NOTHING;

-- 3. Club Members Directory Table
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    plan_id TEXT REFERENCES public.membership_plans(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'Member',
    custom_fee NUMERIC(12,2),
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Monthly Payment Records Table (Checklist)
CREATE TABLE IF NOT EXISTS public.payment_records (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES public.membership_plans(id) ON DELETE SET NULL,
    month_year TEXT NOT NULL, -- e.g. '2026-08'
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- 'paid', 'pending', 'overdue'
    payment_method TEXT DEFAULT 'cash', -- 'cash', 'upi', 'card', 'bank_transfer'
    paid_at TIMESTAMPTZ,
    invoice_no TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Club Other Earnings Table (Sponsorships, Donations, Tournaments, Canteen, etc.)
CREATE TABLE IF NOT EXISTS public.club_earnings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payer_or_customer TEXT,
    reference_no TEXT,
    description TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Custom Fields Configuration Table
CREATE TABLE IF NOT EXISTS public.finance_custom_fields (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    entity_type TEXT NOT NULL DEFAULT 'member',
    options JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.finance_custom_fields (id, name, label, type, entity_type, options)
VALUES 
    ('cf-1', 'emergencyContact', 'Emergency Phone', 'text', 'member', '[]'::jsonb),
    ('cf-2', 'lockerNumber', 'Locker #', 'text', 'member', '[]'::jsonb),
    ('cf-3', 'sportActivity', 'Primary Activity', 'select', 'member', '["Cricket", "Football", "Tennis", "Badminton", "Swimming", "Gym & Fitness", "Chess & Cards"]'::jsonb),
    ('cf-4', 'eventSponsorTier', 'Sponsorship Level', 'select', 'earning', '["Platinum Title", "Gold Partner", "Silver Sponsor", "Patron Support"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 7. Disable RLS or Enable Full Access for App Users
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_custom_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All membership_plans" ON public.membership_plans;
DROP POLICY IF EXISTS "Allow All members" ON public.members;
DROP POLICY IF EXISTS "Allow All payment_records" ON public.payment_records;
DROP POLICY IF EXISTS "Allow All club_earnings" ON public.club_earnings;
DROP POLICY IF EXISTS "Allow All finance_custom_fields" ON public.finance_custom_fields;

CREATE POLICY "Allow All membership_plans" ON public.membership_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All payment_records" ON public.payment_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All club_earnings" ON public.club_earnings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All finance_custom_fields" ON public.finance_custom_fields FOR ALL USING (true) WITH CHECK (true);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_members_plan ON public.members (plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_member_month ON public.payment_records (member_id, month_year);
CREATE INDEX IF NOT EXISTS idx_club_earnings_date ON public.club_earnings (date);
