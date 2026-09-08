-- ================================================================
-- KNSDC FIX FOR STAFF PASSWORDS & CREATION
-- Issue: Empty search_path prevents the 'digest' function from being found.
-- Run this ENTIRE script in: Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Fix admin_update_staff
CREATE OR REPLACE FUNCTION public.admin_update_staff(
  target_email TEXT,
  new_name TEXT DEFAULT NULL,
  new_password TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  hashed TEXT;
BEGIN
  IF new_password IS NOT NULL AND new_password != '' THEN
    hashed := encode(digest(new_password, 'sha256'), 'hex');
    UPDATE public.staff_credentials
    SET name = COALESCE(new_name, name),
        password_hash = hashed,
        updated_at = now()
    WHERE email = lower(trim(target_email));
  ELSE
    UPDATE public.staff_credentials
    SET name = COALESCE(new_name, name),
        updated_at = now()
    WHERE email = lower(trim(target_email));
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;


-- 2. Fix admin_upsert_staff
CREATE OR REPLACE FUNCTION public.admin_upsert_staff(
  staff_email TEXT,
  staff_password TEXT,
  staff_name TEXT,
  staff_role TEXT DEFAULT 'monitor'
)
RETURNS JSON AS $$
DECLARE
  hashed TEXT;
BEGIN
  hashed := encode(digest(staff_password, 'sha256'), 'hex');

  INSERT INTO public.staff_credentials (email, password_hash, name, role)
  VALUES (lower(trim(staff_email)), hashed, staff_name, staff_role)
  ON CONFLICT (email) DO UPDATE SET
    password_hash = hashed,
    name = staff_name,
    role = staff_role,
    updated_at = now();

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;


-- 3. Fix admin_staff_login
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;


-- Ensure execution permissions are granted to both authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.admin_update_staff(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_staff(TEXT, TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_upsert_staff(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_staff(TEXT, TEXT, TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_staff_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_staff_login(TEXT, TEXT) TO authenticated;
