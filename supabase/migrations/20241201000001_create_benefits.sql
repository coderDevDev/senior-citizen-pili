-- Create benefits tables
-- This migration creates the benefits management system tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create benefit_applications table
CREATE TABLE IF NOT EXISTS benefit_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    senior_citizen_id UUID NOT NULL REFERENCES senior_citizens(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL CHECK (benefit_type IN (
        'social_pension',
        'health_assistance', 
        'food_assistance',
        'transportation',
        'utility_subsidy',
        'other'
    )),
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'approved',
        'in_progress',
        'completed',
        'cancelled',
        'rejected'
    )),
    amount_requested DECIMAL(10,2),
    amount_approved DECIMAL(10,2),
    purpose TEXT NOT NULL,
    notes TEXT,
    priority_level VARCHAR(10) DEFAULT 'medium' CHECK (priority_level IN (
        'low',
        'medium',
        'high',
        'urgent'
    )),
    required_by_date DATE,
    requirements TEXT[],
    follow_up_required BOOLEAN DEFAULT FALSE,
    scheduled_date DATE,
    scheduled_time TIME,
    scheduled_location TEXT,
    scheduled_notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create benefit_attachments table
CREATE TABLE IF NOT EXISTS benefit_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benefit_application_id UUID NOT NULL REFERENCES benefit_applications(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create benefit_schedules table
CREATE TABLE IF NOT EXISTS benefit_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benefit_application_id UUID NOT NULL REFERENCES benefit_applications(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    location TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',
        'completed',
        'cancelled',
        'rescheduled'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_benefit_applications_senior_citizen_id ON benefit_applications(senior_citizen_id);
CREATE INDEX IF NOT EXISTS idx_benefit_applications_status ON benefit_applications(status);
CREATE INDEX IF NOT EXISTS idx_benefit_applications_benefit_type ON benefit_applications(benefit_type);
CREATE INDEX IF NOT EXISTS idx_benefit_applications_application_date ON benefit_applications(application_date);
CREATE INDEX IF NOT EXISTS idx_benefit_applications_priority_level ON benefit_applications(priority_level);
CREATE INDEX IF NOT EXISTS idx_benefit_applications_created_by ON benefit_applications(created_by);

CREATE INDEX IF NOT EXISTS idx_benefit_attachments_application_id ON benefit_attachments(benefit_application_id);
CREATE INDEX IF NOT EXISTS idx_benefit_attachments_uploaded_by ON benefit_attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_benefit_schedules_application_id ON benefit_schedules(benefit_application_id);
CREATE INDEX IF NOT EXISTS idx_benefit_schedules_date ON benefit_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_benefit_schedules_status ON benefit_schedules(status);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_benefit_applications_updated_at 
    BEFORE UPDATE ON benefit_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benefit_schedules_updated_at 
    BEFORE UPDATE ON benefit_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE benefit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for benefit_applications
CREATE POLICY "Users can view benefit applications" ON benefit_applications
    FOR SELECT USING (true);

CREATE POLICY "Users can create benefit applications" ON benefit_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update benefit applications" ON benefit_applications
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete benefit applications" ON benefit_applications
    FOR DELETE USING (true);

-- Create RLS policies for benefit_attachments
CREATE POLICY "Users can view benefit attachments" ON benefit_attachments
    FOR SELECT USING (true);

CREATE POLICY "Users can create benefit attachments" ON benefit_attachments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update benefit attachments" ON benefit_attachments
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete benefit attachments" ON benefit_attachments
    FOR DELETE USING (true);

-- Create RLS policies for benefit_schedules
CREATE POLICY "Users can view benefit schedules" ON benefit_schedules
    FOR SELECT USING (true);

CREATE POLICY "Users can create benefit schedules" ON benefit_schedules
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update benefit schedules" ON benefit_schedules
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete benefit schedules" ON benefit_schedules
    FOR DELETE USING (true);

-- Create storage bucket for benefit attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('benefit-attachments', 'benefit-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for benefit-attachments bucket
CREATE POLICY "Users can upload benefit attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'benefit-attachments'
    );

CREATE POLICY "Users can view benefit attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'benefit-attachments'
    );

CREATE POLICY "Users can delete benefit attachments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'benefit-attachments'
    );

-- Create views for reporting
CREATE OR REPLACE VIEW benefit_applications_summary AS
SELECT 
    ba.id,
    ba.application_date,
    ba.benefit_type,
    ba.status,
    ba.amount_requested,
    ba.amount_approved,
    ba.priority_level,
    sc.barangay,
    u.first_name || ' ' || u.last_name AS senior_name,
    u.phone AS senior_phone,
    ba.created_at,
    ba.updated_at
FROM benefit_applications ba
JOIN senior_citizens sc ON ba.senior_citizen_id = sc.id
JOIN auth.users u ON sc.user_id = u.id;

-- Create view for monthly benefit statistics
CREATE OR REPLACE VIEW monthly_benefit_stats AS
SELECT 
    DATE_TRUNC('month', application_date) as month,
    benefit_type,
    status,
    COUNT(*) as count,
    SUM(amount_requested) as total_requested,
    SUM(amount_approved) as total_approved
FROM benefit_applications
GROUP BY DATE_TRUNC('month', application_date), benefit_type, status
ORDER BY month DESC, benefit_type, status;

-- Create view for barangay benefit distribution
CREATE OR REPLACE VIEW barangay_benefit_distribution AS
SELECT 
    sc.barangay,
    ba.benefit_type,
    COUNT(*) as application_count,
    SUM(ba.amount_requested) as total_requested,
    SUM(ba.amount_approved) as total_approved,
    COUNT(CASE WHEN ba.status = 'completed' THEN 1 END) as completed_count
FROM benefit_applications ba
JOIN senior_citizens sc ON ba.senior_citizen_id = sc.id
GROUP BY sc.barangay, ba.benefit_type
ORDER BY sc.barangay, ba.benefit_type;

-- Add comments for documentation
COMMENT ON TABLE benefit_applications IS 'Stores benefit applications from senior citizens';
COMMENT ON TABLE benefit_attachments IS 'Stores file attachments for benefit applications';
COMMENT ON TABLE benefit_schedules IS 'Stores scheduled benefit distributions or appointments';

COMMENT ON COLUMN benefit_applications.benefit_type IS 'Type of benefit being applied for';
COMMENT ON COLUMN benefit_applications.status IS 'Current status of the benefit application';
COMMENT ON COLUMN benefit_applications.priority_level IS 'Priority level of the application';
COMMENT ON COLUMN benefit_applications.amount_requested IS 'Amount requested by the senior citizen';
COMMENT ON COLUMN benefit_applications.amount_approved IS 'Amount approved by OSCA staff';
COMMENT ON COLUMN benefit_applications.requirements IS 'Array of required documents or actions';
COMMENT ON COLUMN benefit_applications.follow_up_required IS 'Whether follow-up is needed';
COMMENT ON COLUMN benefit_applications.scheduled_date IS 'Scheduled date for benefit distribution';
COMMENT ON COLUMN benefit_applications.scheduled_time IS 'Scheduled time for benefit distribution';
COMMENT ON COLUMN benefit_applications.scheduled_location IS 'Location for benefit distribution';