-- Drop the redundant "Allow All" policies we just added
DROP POLICY IF EXISTS "Allow All" ON public.events;
DROP POLICY IF EXISTS "Allow All" ON public.sync_state;
DROP POLICY IF EXISTS "Allow All" ON public.staff_credentials;
DROP POLICY IF EXISTS "Allow All" ON public.judge_credentials;
DROP POLICY IF EXISTS "Allow All" ON public.public_messages;
DROP POLICY IF EXISTS "Allow All" ON public.sports_registrations;
DROP POLICY IF EXISTS "Allow All" ON public.matches;
DROP POLICY IF EXISTS "Allow All" ON public.match_events;
DROP POLICY IF EXISTS "Allow All" ON public.teams;
DROP POLICY IF EXISTS "Allow All" ON public.players;
DROP POLICY IF EXISTS "Allow All" ON public.venues;
