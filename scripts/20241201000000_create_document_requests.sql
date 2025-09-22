-- Create document_requests table
CREATE TABLE IF NOT EXISTS document_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_citizen_id UUID NOT NULL REFERENCES senior_citizens(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('osca_id', 'medical_certificate', 'endorsement_letter', 'birth_certificate', 'barangay_clearance')),
  purpose TEXT NOT NULL,
  notes TEXT,
  priority_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled', 'ready_for_pickup')),
  required_by_date DATE,
  requirements TEXT[] DEFAULT '{}',
  follow_up_required BOOLEAN DEFAULT FALSE,
  assigned_staff UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create document_attachments table
CREATE TABLE IF NOT EXISTS document_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_request_id UUID NOT NULL REFERENCES document_requests(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_requests_senior_citizen_id ON document_requests(senior_citizen_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(status);
CREATE INDEX IF NOT EXISTS idx_document_requests_document_type ON document_requests(document_type);
CREATE INDEX IF NOT EXISTS idx_document_requests_priority_level ON document_requests(priority_level);
CREATE INDEX IF NOT EXISTS idx_document_requests_created_by ON document_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_document_requests_assigned_staff ON document_requests(assigned_staff);
CREATE INDEX IF NOT EXISTS idx_document_requests_created_at ON document_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_document_requests_required_by_date ON document_requests(required_by_date);

CREATE INDEX IF NOT EXISTS idx_document_attachments_document_request_id ON document_attachments(document_request_id);
CREATE INDEX IF NOT EXISTS idx_document_attachments_uploaded_by ON document_attachments(uploaded_by);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for document_requests
CREATE TRIGGER update_document_requests_updated_at 
  BEFORE UPDATE ON document_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for document attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('document-attachments', 'document-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for document_requests
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all document requests (staff and admins)
CREATE POLICY "Users can view all document requests" ON document_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- Policy: Users can create document requests
CREATE POLICY "Users can create document requests" ON document_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- Policy: Users can update document requests
CREATE POLICY "Users can update document requests" ON document_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- Policy: Users can delete document requests
CREATE POLICY "Users can delete document requests" ON document_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- Create RLS policies for document_attachments
ALTER TABLE document_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all document attachments
CREATE POLICY "Users can view all document attachments" ON document_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- Policy: Users can create document attachments
CREATE POLICY "Users can create document attachments" ON document_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- Policy: Users can delete document attachments
CREATE POLICY "Users can delete document attachments" ON document_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- Create storage policies for document-attachments bucket
CREATE POLICY "Users can upload document attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'document-attachments' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can view document attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'document-attachments' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can delete document attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'document-attachments' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- Add some sample data for testing (optional)
INSERT INTO document_requests (
  senior_citizen_id, 
  document_type, 
  purpose, 
  priority_level, 
  status, 
  created_by
) VALUES 
  (
    (SELECT id FROM senior_citizens LIMIT 1),
    'osca_id',
    'Need OSCA ID for senior citizen benefits and discounts',
    'high',
    'pending',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
  ),
  (
    (SELECT id FROM senior_citizens LIMIT 1 OFFSET 1),
    'medical_certificate',
    'Medical certificate for disability benefits application',
    'medium',
    'approved',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
  )
ON CONFLICT DO NOTHING;
