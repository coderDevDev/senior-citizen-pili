-- Fix Storage Bucket Policies for Document Attachments
-- This script fixes the Row Level Security policies for the document-attachments storage bucket

-- First, make sure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('document-attachments', 'document-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload document attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view document attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete document attachments" ON storage.objects;

-- Create new, simpler policies that allow authenticated users to access the bucket
CREATE POLICY "Allow authenticated users to upload document attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'document-attachments' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to view document attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'document-attachments' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to delete document attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'document-attachments' AND
    auth.role() = 'authenticated'
  );

-- Alternative: Make the bucket completely public for testing (remove in production)
-- UPDATE storage.buckets SET public = true WHERE id = 'document-attachments';

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
