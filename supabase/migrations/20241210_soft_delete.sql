-- Migration: Soft Delete System
-- Description: Adds soft delete columns to all major tables
-- Date: 2024-12-10

-- Add soft delete columns to announcements
ALTER TABLE announcements 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Add soft delete columns to appointments
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Add soft delete columns to document_requests
ALTER TABLE document_requests 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Add soft delete columns to benefit_applications
ALTER TABLE benefit_applications 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Add soft delete columns to senior_citizens
ALTER TABLE senior_citizens 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_announcements_deleted ON announcements(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_deleted ON appointments(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON document_requests(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_benefits_deleted ON benefit_applications(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seniors_deleted ON senior_citizens(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create indexes for active (non-deleted) records
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_active ON appointments(appointment_date, appointment_time) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_active ON document_requests(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_benefits_active ON benefit_applications(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_seniors_active ON senior_citizens(last_name, first_name) WHERE deleted_at IS NULL;

-- Update existing RLS policies to exclude soft-deleted records
-- Note: You may need to update your existing policies to add "AND deleted_at IS NULL"

-- Add comments
COMMENT ON COLUMN announcements.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN announcements.deleted_by IS 'User who deleted the record';
COMMENT ON COLUMN announcements.delete_reason IS 'Reason for deletion';

COMMENT ON COLUMN appointments.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN appointments.deleted_by IS 'User who deleted the record';
COMMENT ON COLUMN appointments.delete_reason IS 'Reason for deletion';

COMMENT ON COLUMN document_requests.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN document_requests.deleted_by IS 'User who deleted the record';
COMMENT ON COLUMN document_requests.delete_reason IS 'Reason for deletion';

COMMENT ON COLUMN benefit_applications.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN benefit_applications.deleted_by IS 'User who deleted the record';
COMMENT ON COLUMN benefit_applications.delete_reason IS 'Reason for deletion';

COMMENT ON COLUMN senior_citizens.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN senior_citizens.deleted_by IS 'User who deleted the record';
COMMENT ON COLUMN senior_citizens.delete_reason IS 'Reason for deletion';

-- Create function to auto-cleanup old deleted records (30 days)
CREATE OR REPLACE FUNCTION cleanup_old_deleted_records()
RETURNS void AS $$
BEGIN
  -- Delete announcements older than 30 days
  DELETE FROM announcements 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';
  
  -- Delete appointments older than 30 days
  DELETE FROM appointments 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';
  
  -- Delete documents older than 30 days
  DELETE FROM document_requests 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';
  
  -- Delete benefits older than 30 days
  DELETE FROM benefit_applications 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';
  
  -- Note: We don't auto-delete senior_citizens for data retention
  
  RAISE NOTICE 'Cleanup completed for records deleted more than 30 days ago';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION cleanup_old_deleted_records IS 'Permanently deletes soft-deleted records older than 30 days';
