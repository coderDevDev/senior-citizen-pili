-- Migration: Activity Logs System
-- Description: Creates activity_logs table for tracking all user actions
-- Date: 2024-12-10

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Information
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('osca', 'basca', 'senior')),
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  
  -- Activity Details
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'create', 'update', 'delete', 'restore', 
    'approve', 'reject', 'cancel', 'complete',
    'export', 'login', 'logout'
  )),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
    'benefit', 'document', 'appointment', 'announcement', 
    'senior_citizen', 'user', 'report'
  )),
  entity_id UUID,
  entity_name VARCHAR(500),
  
  -- Change Details
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  barangay VARCHAR(100), -- For filtering by barangay
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT activity_logs_user_id_idx FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_role ON activity_logs(user_role);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_barangay ON activity_logs(barangay);

-- Create composite index for common queries
CREATE INDEX idx_activity_logs_user_entity ON activity_logs(user_id, entity_type, created_at DESC);
CREATE INDEX idx_activity_logs_entity_lookup ON activity_logs(entity_type, entity_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- OSCA can view all logs
CREATE POLICY "OSCA can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'osca'
    )
  );

-- BASCA can view logs for their barangay
CREATE POLICY "BASCA can view barangay activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'basca'
      AND users.barangay = activity_logs.barangay
    )
  );

-- Seniors can view their own activity logs
CREATE POLICY "Seniors can view own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only system can insert logs (via service role)
CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE activity_logs IS 'Stores all user activity and system events for audit trail';
COMMENT ON COLUMN activity_logs.user_role IS 'Role of user who performed the action';
COMMENT ON COLUMN activity_logs.action IS 'Type of action performed';
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity affected';
COMMENT ON COLUMN activity_logs.old_values IS 'Previous state before change (for updates)';
COMMENT ON COLUMN activity_logs.new_values IS 'New state after change (for creates/updates)';
