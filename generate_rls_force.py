import re

with open('supabase_full_setup.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any sequence of whitespace (including newlines) with a single space to make regex easier
content_collapsed = re.sub(r'\s+', ' ', content)

# Now find all CREATE POLICY statements
# Syntax might be ON public.categories or ON "public"."categories"
policies = re.findall(r'CREATE POLICY "([^"]+)" ON (?:public\.|"public"\.")([^"\s]+)"?([^;]+);', content_collapsed, re.IGNORECASE)

alter_statements = []
alter_statements.append("-- Script to drop permissive RLS policies and recreate them securely")

for policy_name, table_name, policy_body in policies:
    # If the policy has USING (true) or WITH CHECK (true), we need to replace it.
    if 'true' in policy_body.lower():
        # Replace true with auth.uid() IS NOT NULL
        new_body = re.sub(r'USING\s*\(\s*true\s*\)', 'USING (auth.uid() IS NOT NULL)', policy_body, flags=re.IGNORECASE)
        new_body = re.sub(r'WITH\s+CHECK\s*\(\s*true\s*\)', 'WITH CHECK (auth.uid() IS NOT NULL)', new_body, flags=re.IGNORECASE)
        
        alter_statements.append(f'\nDROP POLICY IF EXISTS "{policy_name}" ON public.{table_name};')
        alter_statements.append(f'CREATE POLICY "{policy_name}" ON public.{table_name} {new_body};')

with open('supabase_rls_force_fix.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(alter_statements))

print(f"Generated {len(alter_statements)//2} policy fixes.")
