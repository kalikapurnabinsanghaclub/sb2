-- 1. Manually copy any existing users from Supabase Auth into staff_credentials so they appear in the Admin Dashboard
INSERT INTO public.staff_credentials (email, name, role, password_hash)
SELECT 
    email, 
    'Staff Member' as name, 
    'monitor' as role,
    'managed_by_supabase_auth' as password_hash
FROM auth.users
ON CONFLICT (email) DO NOTHING;

-- 2. Create a secure function that automatically deletes a user from Supabase Auth when they are deleted from the Admin Dashboard
CREATE OR REPLACE FUNCTION public.delete_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    -- This securely deletes the user from the hidden auth.users table
    DELETE FROM auth.users WHERE email = OLD.email;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. DROP the delete trigger because direct SQL deletes on auth.users are restricted in Supabase (causing permission denied errors)
DROP TRIGGER IF EXISTS trg_delete_auth_user ON public.staff_credentials;

-- 4. Create a function to automatically add users to staff_credentials when you create them in the Supabase Dashboard
CREATE OR REPLACE FUNCTION public.insert_staff_from_auth()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.staff_credentials (email, name, role, password_hash)
    VALUES (NEW.email, 'Staff Member', 'monitor', 'managed_by_supabase_auth')
    ON CONFLICT (email) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 5. Attach the trigger to auth.users
DROP TRIGGER IF EXISTS trg_insert_staff_from_auth ON auth.users;
CREATE TRIGGER trg_insert_staff_from_auth
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.insert_staff_from_auth();
