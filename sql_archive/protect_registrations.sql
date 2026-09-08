-- Create a database rule (function) that completely prevents deleting rows
CREATE OR REPLACE FUNCTION public.prevent_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CRITICAL: Hard deletions are permanently disabled for registration data. Use status = ''Archived'' or ''Rejected'' instead.';
END;
$$ LANGUAGE plpgsql;

-- Apply the rule to the public_registrations table
DROP TRIGGER IF EXISTS protect_registrations_delete ON public.public_registrations;
CREATE TRIGGER protect_registrations_delete
BEFORE DELETE ON public.public_registrations
FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
