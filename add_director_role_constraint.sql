-- ==============================================================================
-- FIX: Allow 'director' role in staff_credentials table
-- Run this in your Supabase SQL Editor to allow adding Director staff
-- ==============================================================================

-- 1. Drop existing role check constraint
ALTER TABLE public.staff_credentials 
  DROP CONSTRAINT IF EXISTS staff_credentials_role_check;

-- 2. Add updated constraint including 'director'
ALTER TABLE public.staff_credentials 
  ADD CONSTRAINT staff_credentials_role_check 
  CHECK (role IN ('admin', 'monitor', 'host', 'judge', 'sportsmanager', 'finance', 'umpire', 'referee', 'director'));
