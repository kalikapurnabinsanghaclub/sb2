-- ══════════════════════════════════════════════════════════════════════════
-- Add WhatsApp and Facebook Columns to Supabase Events Table
-- Run this in your Supabase Dashboard > SQL Editor > Run (Ctrl + Enter)
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS whatsapp        TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS facebook        TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS facebook_url    TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner          TEXT;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('whatsapp', 'facebook', 'whatsapp_number', 'facebook_url', 'banner');
