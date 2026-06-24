-- OPTIMIZATION 1: ADD INDEXES TO PREVENT SEQUENTIAL SCANS IN RAM
-- These indexes tell Postgres to use a quick lookup map instead of loading the entire table into memory

-- Indexes for fast lookups on auth & credentials
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff_credentials (email);
CREATE INDEX IF NOT EXISTS idx_judge_email ON public.judge_credentials (email);

-- Indexes for frequently joined/filtered tables
CREATE INDEX IF NOT EXISTS idx_judge_agreements_email ON public.judge_agreements (judge_email);
CREATE INDEX IF NOT EXISTS idx_judge_agreements_event ON public.judge_agreements (event_id);
CREATE INDEX IF NOT EXISTS idx_public_registrations_event ON public.public_registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);

-- Indexes for fast sorting on large log tables
CREATE INDEX IF NOT EXISTS idx_ecosystem_log_created_at ON public.ecosystem_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_messages_created_at ON public.public_messages (created_at DESC);

-- OPTIMIZATION 2: CREATE A FUNCTION TO PRUNE OLD LOGS
-- You can run this function periodically (e.g. SELECT prune_old_logs(30)) to delete logs older than X days.
CREATE OR REPLACE FUNCTION public.prune_old_logs(days_to_keep INT)
RETURNS void AS $$
BEGIN
  -- Delete logs older than the specified days
  DELETE FROM public.ecosystem_log WHERE created_at < NOW() - (days_to_keep || ' days')::interval;
  DELETE FROM public.public_messages WHERE created_at < NOW() - (days_to_keep || ' days')::interval;
END;
$$ LANGUAGE plpgsql;

-- Run the pruner immediately to clear out any logs older than 60 days
SELECT public.prune_old_logs(60);
