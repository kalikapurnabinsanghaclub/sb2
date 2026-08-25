-- ================================================================
-- KNSDC STAFF MANAGEMENT MASTER FIX
-- Run this ENTIRE script in: Supabase Dashboard → SQL Editor
-- ================================================================

-- PART 1: Remove the delete trigger that caused "permission denied"
DROP TRIGGER IF EXISTS trg_delete_auth_user ON public.staff_credentials;

-- PART 2: Fix delete RLS policies
DROP POLICY IF EXISTS "staff_delete" ON public.staff_credentials;
CREATE POLICY "staff_delete" ON public.staff_credentials FOR DELETE USING (true);

DROP POLICY IF EXISTS "judge_delete" ON public.judge_credentials;
CREATE POLICY "judge_delete" ON public.judge_credentials FOR DELETE USING (true);

-- PART 3: Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PART 4: New staff login RPC (KEY FIX for "invalid candidate" error)
CREATE OR REPLACE FUNCTION public.admin_staff_login(p_email TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
  p_hash TEXT;
  rec    public.staff_credentials%ROWTYPE;
BEGIN
  p_hash := encode(digest(p_password, 'sha256'), 'hex');
  SELECT * INTO rec FROM public.staff_credentials
  WHERE email = lower(trim(p_email)) AND password_hash = p_hash;
  IF FOUND THEN
    RETURN json_build_object('success', true, 'email', rec.email, 'name', rec.name, 'role', rec.role);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.admin_staff_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_staff_login(TEXT, TEXT) TO authenticated;

-- PART 5: New role update RPC
CREATE OR REPLACE FUNCTION public.admin_update_staff_role(target_email TEXT, new_role TEXT)
RETURNS JSON AS $$
BEGIN
  UPDATE public.staff_credentials SET role = new_role, updated_at = now()
  WHERE email = lower(trim(target_email));
  IF FOUND THEN
    RETURN json_build_object('success', true);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Staff not found');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.admin_update_staff_role(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_staff_role(TEXT, TEXT) TO authenticated;

-- Verify setup:
SELECT proname, prosecdef FROM pg_proc
WHERE proname IN ('admin_staff_login','admin_update_staff_role','admin_delete_staff','admin_upsert_staff');
