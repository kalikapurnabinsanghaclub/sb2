-- ==============================================================================
-- FIX: Update or Drop staff_credentials_role_check
-- Resolves ERROR 23514 caused by existing 'service_partner' role in the table
-- ==============================================================================

-- OPTION 1 (RECOMMENDED):
-- Drop the check constraint completely so any valid staff role (director, service_partner, etc.) works without breaking.
ALTER TABLE public.staff_credentials 
  DROP CONSTRAINT IF EXISTS staff_credentials_role_check;

-- OPTION 2 (ALTERNATIVE):
-- If you strictly want a CHECK constraint, include all existing and new roles:
-- ALTER TABLE public.staff_credentials 
--   ADD CONSTRAINT staff_credentials_role_check 
--   CHECK (role IN (
--     'admin', 
--     'monitor', 
--     'host', 
--     'judge', 
--     'director', 
--     'service_partner', 
--     'partner', 
--     'sportsmanager', 
--     'finance', 
--     'umpire', 
--     'referee'
--   ));

