-- Drop all cricket-specific tables to clean up the database
-- The CASCADE keyword ensures any dependent views or foreign keys are also dropped
DROP TABLE IF EXISTS public.match_events CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.sports_registrations CASCADE;

-- (Optional) If you want to remove any leftover umpires from your staff table, you can run this:
-- DELETE FROM public.staff_credentials WHERE role = 'umpire';
