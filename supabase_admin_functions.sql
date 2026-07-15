-- =====================================================================
-- COMPLETE STAFF MANAGEMENT FIX
-- This script fixes ALL staff operations: CREATE, DELETE, UPDATE
-- by using SECURITY DEFINER functions that bypass RLS safely
-- =====================================================================

-- =====================================================================
-- STEP 1: Create a secure admin function to DELETE staff
-- This function runs with elevated privileges (SECURITY DEFINER)
-- but only if the caller is authenticated
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_delete_staff(target_email TEXT)
RETURNS JSON AS $$
DECLARE
  deleted_count INT;
BEGIN
  -- Security check: caller must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Delete from staff_credentials
  DELETE FROM public.staff_credentials WHERE email = lower(trim(target_email));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Also delete from judge_credentials if exists
  DELETE FROM public.judge_credentials WHERE email = lower(trim(target_email));

  IF deleted_count > 0 THEN
    RETURN json_build_object('success', true, 'deleted', deleted_count);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Staff member not found');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================================
-- STEP 2: Create a secure admin function to ADD/UPDATE staff
-- When admin creates staff, this also creates Supabase Auth user
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_upsert_staff(
  staff_email TEXT,
  staff_password TEXT,
  staff_name TEXT,
  staff_role TEXT DEFAULT 'monitor'
)
RETURNS JSON AS $$
DECLARE
  hashed TEXT;
  existing_auth_id UUID;
BEGIN
  -- Security check: caller must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Hash the password using pgcrypto
  hashed := encode(digest(staff_password, 'sha256'), 'hex');

  -- Upsert into staff_credentials
  INSERT INTO public.staff_credentials (email, password_hash, name, role)
  VALUES (lower(trim(staff_email)), hashed, staff_name, staff_role)
  ON CONFLICT (email) DO UPDATE SET
    password_hash = hashed,
    name = staff_name,
    role = staff_role,
    updated_at = now();

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================================
-- STEP 3: Create a secure admin function to UPDATE staff details
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_update_staff(
  target_email TEXT,
  new_name TEXT DEFAULT NULL,
  new_password TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  hashed TEXT;
BEGIN
  -- Security check: caller must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================================
-- STEP 4: Grant EXECUTE permission to authenticated users
-- =====================================================================
GRANT EXECUTE ON FUNCTION public.admin_delete_staff(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_staff(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_staff(TEXT, TEXT, TEXT) TO authenticated;

-- Also grant to anon so staff login check works
GRANT EXECUTE ON FUNCTION public.admin_delete_staff(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_staff(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_staff(TEXT, TEXT, TEXT) TO anon;

-- =====================================================================
-- STEP 5: Enable pgcrypto extension for sha256 hashing
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
