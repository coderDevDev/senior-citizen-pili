-- =====================================================
-- BASCA APPROVAL SYSTEM - DATABASE MIGRATION
-- =====================================================
-- Purpose: Add approval workflow columns to users table
-- Date: Current Session
-- =====================================================

-- Add approval-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved);
CREATE INDEX IF NOT EXISTS idx_users_role_approved ON users(role, is_approved);

-- Add comments for documentation
COMMENT ON COLUMN users.is_approved IS 'Whether the BASCA account has been approved by OSCA';
COMMENT ON COLUMN users.approved_at IS 'Timestamp when the account was approved';
COMMENT ON COLUMN users.approved_by IS 'User ID of the OSCA admin who approved/rejected';
COMMENT ON COLUMN users.rejection_reason IS 'Reason for rejection if account was not approved';
COMMENT ON COLUMN users.rejected_at IS 'Timestamp when the account was rejected';

-- Set existing OSCA and senior accounts as auto-approved
UPDATE users 
SET is_approved = TRUE, 
    approved_at = created_at
WHERE role IN ('osca', 'senior') 
  AND (is_approved IS NULL OR is_approved = FALSE);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check the new columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('is_approved', 'approved_at', 'approved_by', 'rejection_reason', 'rejected_at');

-- Count pending BASCA approvals
SELECT COUNT(*) as pending_basca_accounts
FROM users
WHERE role = 'basca' 
  AND (is_approved IS NULL OR is_approved = FALSE);

-- View pending accounts details
SELECT id, first_name, last_name, email, barangay, created_at
FROM users
WHERE role = 'basca' 
  AND (is_approved IS NULL OR is_approved = FALSE)
ORDER BY created_at DESC;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- Uncomment to remove the columns
/*
ALTER TABLE users 
DROP COLUMN IF EXISTS is_approved,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS rejected_at;

DROP INDEX IF EXISTS idx_users_is_approved;
DROP INDEX IF EXISTS idx_users_role_approved;
*/
