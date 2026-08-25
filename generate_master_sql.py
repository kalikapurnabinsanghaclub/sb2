import re

with open('supabase_full_setup.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix RLS policies
content = re.sub(r'USING \(true\) WITH CHECK \(true\);', 'USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);', content)
content = re.sub(r'USING \(true\);', 'USING (auth.uid() IS NOT NULL);', content)
content = re.sub(r'WITH CHECK \(true\);', 'WITH CHECK (auth.uid() IS NOT NULL);', content)

extra_fixes = """

-- Security Fixes appended automatically

-- 1. Revoke public execution of rls_auto_enable
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- 2. Drop overly broad bucket listing policies
DROP POLICY IF EXISTS "Public Access to Files" ON storage.objects;
DROP POLICY IF EXISTS "knsdc_reg_public_access" ON storage.objects;

-- 3. Redefine prevent_hard_delete search_path explicitly
ALTER FUNCTION public.prevent_hard_delete() SET search_path = '';

-- 4. Redefine prune_old_logs search_path explicitly
ALTER FUNCTION public.prune_old_logs(INT) SET search_path = '';

-- 5. Redefine handle_updated_at search_path explicitly
ALTER FUNCTION public.handle_updated_at() SET search_path = '';
"""

with open('supabase_master_security_fix.sql', 'w', encoding='utf-8') as f:
    f.write(content + extra_fixes)

print("Done")
