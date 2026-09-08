-- ══════════════════════════════════════════════════════════════════════════
-- KNSDC Donation & Event Support Engine - Supabase Schema Migration
-- Run this in your Supabase SQL Editor to enable the complete Donation Engine
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Extend Events Table with Donation & Sponsorship Columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS allow_donations BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS target_goal     NUMERIC DEFAULT 50000;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS raised_amount   NUMERIC DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS upi_id          TEXT DEFAULT 'kalikapurnabinsangha@sbi';

-- 2. Create Dedicated Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT,
    event_name TEXT,
    donor_name TEXT NOT NULL,
    donor_phone TEXT,
    donor_email TEXT,
    amount NUMERIC NOT NULL,
    message TEXT,
    upi_ref_no TEXT,
    payment_status TEXT DEFAULT 'completed',
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure Row Level Security allows public contributions & admin reads
ALTER TABLE public.donations DISABLE ROW LEVEL SECURITY;

-- 4. Verify Tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('events', 'donations')
ORDER BY table_name, ordinal_position;
