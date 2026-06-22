-- Supabase Storage Setup for KNSDC

-- 1. Insert bucket definition into the storage.buckets table
INSERT INTO storage.buckets (id, name, public)
VALUES ('knsdc-registration', 'knsdc-registration', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Policy: Public access to view files
CREATE POLICY "knsdc_reg_public_access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'knsdc-registration');

-- 3. Create Policy: Public upload access
CREATE POLICY "knsdc_reg_public_insert" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'knsdc-registration');

-- 4. Create Policy: Update/Delete access
CREATE POLICY "knsdc_reg_public_update"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'knsdc-registration');

CREATE POLICY "knsdc_reg_public_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'knsdc-registration');
