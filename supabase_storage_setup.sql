-- Supabase Storage Setup for KNSDC

-- 1. Insert bucket definition into the storage.buckets table
INSERT INTO storage.buckets (id, name, public)
VALUES ('knsdc-registration', 'knsdc-registration', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Policy: Public access to view files
-- This ensures anyone with the URL can view/download the files
CREATE POLICY "Public Access to Files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'knsdc-registration');

-- 3. Create Policy: Public upload access
-- This allows participants to upload photos/audio files during registration without logging in
CREATE POLICY "Public Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'knsdc-registration');

-- 4. Create Policy: Update/Delete access
-- This allows the system to overwrite/delete files if a user re-uploads
CREATE POLICY "Public Update Access"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'knsdc-registration');

CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'knsdc-registration');
