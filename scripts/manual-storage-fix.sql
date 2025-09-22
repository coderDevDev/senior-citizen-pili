-- Manual Storage Fix for Document Attachments
-- Copy and paste this into your Supabase SQL Editor

-- Option 1: Make the bucket completely public (easiest fix)
UPDATE storage.buckets SET public = true WHERE id = 'document-attachments';

-- Option 2: Fix the policies (if you prefer RLS)
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can upload document attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view document attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete document attachments" ON storage.objects;

-- Create new, simpler policies
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'document-attachments' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated views" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'document-attachments' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'document-attachments' AND
    auth.role() = 'authenticated'
  );

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;






