-- ============================================================
-- Migration: 20261127_harden_staff_credentials_rls.sql
-- Purpose  : Tighten Row-Level Security (RLS) on staff_credentials
--            and judge_credentials to prevent credential leaks from
--            client-side Anon Key / browser DevTools.
-- Date     : 2026-11-27
-- ============================================================

-- 1. Enable RLS on staff_credentials & judge_credentials
ALTER TABLE IF EXISTS staff_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS judge_credentials ENABLE ROW LEVEL SECURITY;

-- 2. Drop any permissive public/anon SELECT policies
DROP POLICY IF EXISTS "Allow anon read staff credentials" ON staff_credentials;
DROP POLICY IF EXISTS "Public can view staff" ON staff_credentials;
DROP POLICY IF EXISTS "Allow public read judge credentials" ON judge_credentials;

-- 3. Disallow all direct anonymous SELECT queries
CREATE POLICY "Block direct anon read on staff credentials"
  ON staff_credentials
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Block direct anon read on judge credentials"
  ON judge_credentials
  FOR SELECT
  TO anon
  USING (false);

-- 4. Allow only service_role or authenticated admin to manage credentials
CREATE POLICY "Allow service_role full control on staff"
  ON staff_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full control on judges"
  ON judge_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Safe verification RPC (Returns true/false without exposing hashes/tokens)
CREATE OR REPLACE FUNCTION verify_staff_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff RECORD;
BEGIN
  SELECT id, username, role, name INTO v_staff
  FROM staff_credentials
  WHERE username = p_username AND password = p_password;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'id', v_staff.id,
      'username', v_staff.username,
      'role', v_staff.role,
      'name', v_staff.name
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
END;
$$;
