import re

with open('supabase_full_setup.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all CREATE POLICY statements
# Example: CREATE POLICY "Allow all" ON "public"."categories" FOR ALL USING (true);
policies = re.findall(r'CREATE POLICY "([^"]+)" ON "public"."([^"]+)"([^;]+);', content, re.IGNORECASE)

alter_statements = []
for policy_name, table_name, policy_body in policies:
    # If the policy has USING (true) or WITH CHECK (true), we need to replace it.
    if 'true' in policy_body.lower():
        # Let's just generate DROP and CREATE to be safe, because ALTER POLICY syntax can be tricky if we want to change both USING and WITH CHECK
        # Actually, DROP POLICY IF EXISTS followed by the new CREATE POLICY is the safest.
        
        # Replace true with auth.uid() IS NOT NULL
        new_body = re.sub(r'USING\s*\(\s*true\s*\)', 'USING (auth.uid() IS NOT NULL)', policy_body, flags=re.IGNORECASE)
        new_body = re.sub(r'WITH\s+CHECK\s*\(\s*true\s*\)', 'WITH CHECK (auth.uid() IS NOT NULL)', new_body, flags=re.IGNORECASE)
        
        alter_statements.append(f'DROP POLICY IF EXISTS "{policy_name}" ON "public"."{table_name}";')
        alter_statements.append(f'CREATE POLICY "{policy_name}" ON "public"."{table_name}" {new_body};')

with open('supabase_fix_rls_policies.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(alter_statements))

print(f"Generated {len(alter_statements)//2} policy fixes.")
