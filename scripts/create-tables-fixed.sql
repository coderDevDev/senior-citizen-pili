-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('osca', 'basca', 'senior');
CREATE TYPE senior_status AS ENUM ('active', 'deceased', 'inactive');
CREATE TYPE appointment_status AS ENUM ('pending', 'approved', 'completed', 'cancelled');
CREATE TYPE document_request_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE benefit_status AS ENUM ('active', 'expired', 'suspended');
CREATE TYPE announcement_type AS ENUM ('general', 'emergency', 'benefit', 'birthday');
CREATE TYPE housing_condition AS ENUM ('owned', 'rented', 'with_family', 'institution', 'other');
CREATE TYPE physical_health_condition AS ENUM ('excellent', 'good', 'fair', 'poor', 'critical');
CREATE TYPE living_condition AS ENUM ('independent', 'with_family', 'with_caregiver', 'institution', 'other');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role user_role NOT NULL,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  -- OSCA specific fields
  department TEXT,
  position TEXT,
  employee_id TEXT,
  -- BASCA specific fields
  barangay TEXT,
  barangay_code TEXT,
  -- Senior specific fields
  date_of_birth DATE,
  address TEXT,
  osca_id TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT
);

-- Create senior_citizens table
CREATE TABLE public.senior_citizens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  barangay TEXT NOT NULL,
  barangay_code TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  address TEXT NOT NULL,
  contact_person TEXT,
  contact_phone TEXT,
  contact_relationship TEXT,
  medical_conditions TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  osca_id TEXT UNIQUE,
  senior_id_photo TEXT,
  documents TEXT[] DEFAULT '{}',
  status senior_status DEFAULT 'active',
  registration_date DATE DEFAULT CURRENT_DATE,
  last_medical_checkup DATE,
  notes TEXT,
  -- New fields
  housing_condition housing_condition DEFAULT 'owned',
  physical_health_condition physical_health_condition DEFAULT 'good',
  monthly_income DECIMAL(10,2) DEFAULT 0,
  monthly_pension DECIMAL(10,2) DEFAULT 0,
  living_condition living_condition DEFAULT 'independent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Create beneficiaries table
CREATE TABLE public.beneficiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_citizen_id UUID REFERENCES public.senior_citizens(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  contact_phone TEXT,
  occupation TEXT,
  monthly_income DECIMAL(10,2) DEFAULT 0,
  is_dependent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type announcement_type DEFAULT 'general',
  target_barangay TEXT, -- NULL for system-wide announcements
  is_urgent BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  sms_sent BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_citizen_id UUID REFERENCES public.senior_citizens(id) ON DELETE CASCADE NOT NULL,
  appointment_type TEXT NOT NULL, -- 'bhw', 'basca', 'medical'
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  purpose TEXT NOT NULL,
  status appointment_status DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_requests table
CREATE TABLE public.document_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_citizen_id UUID REFERENCES public.senior_citizens(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL, -- 'osca_id', 'medical_certificate', 'endorsement'
  purpose TEXT NOT NULL,
  status document_request_status DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create benefits table
CREATE TABLE public.benefits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_citizen_id UUID REFERENCES public.senior_citizens(id) ON DELETE CASCADE NOT NULL,
  benefit_type TEXT NOT NULL, -- 'medical', 'social', 'financial', 'transportation'
  benefit_name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2),
  status benefit_status DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create census_records table
CREATE TABLE public.census_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barangay TEXT NOT NULL,
  barangay_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_seniors INTEGER DEFAULT 0,
  active_seniors INTEGER DEFAULT 0,
  deceased_seniors INTEGER DEFAULT 0,
  new_registrations INTEGER DEFAULT 0,
  male_count INTEGER DEFAULT 0,
  female_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barangay, year, month)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_barangay ON public.users(barangay);
CREATE INDEX idx_senior_citizens_user_id ON public.senior_citizens(user_id);
CREATE INDEX idx_senior_citizens_barangay ON public.senior_citizens(barangay);
CREATE INDEX idx_senior_citizens_status ON public.senior_citizens(status);
CREATE INDEX idx_senior_citizens_osca_id ON public.senior_citizens(osca_id);
CREATE INDEX idx_announcements_type ON public.announcements(type);
CREATE INDEX idx_announcements_target_barangay ON public.announcements(target_barangay);
CREATE INDEX idx_announcements_created_at ON public.announcements(created_at);
CREATE INDEX idx_appointments_senior_citizen_id ON public.appointments(senior_citizen_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_document_requests_senior_citizen_id ON public.document_requests(senior_citizen_id);
CREATE INDEX idx_document_requests_status ON public.document_requests(status);
CREATE INDEX idx_benefits_senior_citizen_id ON public.benefits(senior_citizen_id);
CREATE INDEX idx_benefits_status ON public.benefits(status);
CREATE INDEX idx_census_records_barangay ON public.census_records(barangay);
CREATE INDEX idx_census_records_year_month ON public.census_records(year, month);
CREATE INDEX idx_beneficiaries_senior_citizen_id ON public.beneficiaries(senior_citizen_id);
CREATE INDEX idx_senior_citizens_housing_condition ON public.senior_citizens(housing_condition);
CREATE INDEX idx_senior_citizens_physical_health_condition ON public.senior_citizens(physical_health_condition);
CREATE INDEX idx_senior_citizens_living_condition ON public.senior_citizens(living_condition);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senior_citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.census_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (for the trigger)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage all users (for admin operations)
CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- OSCA can view all users (simplified policy)
CREATE POLICY "OSCA can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'osca'
    )
  );

-- BASCA can view users in their barangay (simplified policy)
CREATE POLICY "BASCA can view users in their barangay" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'basca' AND barangay = users.barangay
    )
  );

-- RLS Policies for senior_citizens table
CREATE POLICY "Senior citizens can view own record" ON public.senior_citizens
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to manage all senior citizens (for admin operations)
CREATE POLICY "Service role can manage all senior citizens" ON public.senior_citizens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "OSCA can manage all senior citizens" ON public.senior_citizens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'osca'
    )
  );

CREATE POLICY "BASCA can manage senior citizens in their barangay" ON public.senior_citizens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'basca' AND barangay = senior_citizens.barangay
    )
  );

-- RLS Policies for announcements table
CREATE POLICY "All authenticated users can view announcements" ON public.announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow service role to manage all announcements (for admin operations)
CREATE POLICY "Service role can manage all announcements" ON public.announcements
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "OSCA can manage all announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'osca'
    )
  );

CREATE POLICY "BASCA can manage announcements for their barangay" ON public.announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'basca' AND barangay = announcements.target_barangay
    )
  );

-- RLS Policies for appointments table
CREATE POLICY "Senior citizens can view own appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.senior_citizens 
      WHERE user_id = auth.uid() AND id = senior_citizen_id
    )
  );

-- Allow service role to manage all appointments (for admin operations)
CREATE POLICY "Service role can manage all appointments" ON public.appointments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "OSCA can manage all appointments" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'osca'
    )
  );

CREATE POLICY "BASCA can manage appointments in their barangay" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'basca' AND barangay IN (
        SELECT barangay FROM public.senior_citizens WHERE id = senior_citizen_id
      )
    )
  );

-- RLS Policies for document_requests table
CREATE POLICY "Senior citizens can view own document requests" ON public.document_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.senior_citizens 
      WHERE user_id = auth.uid() AND id = senior_citizen_id
    )
  );

-- Allow service role to manage all document requests (for admin operations)
CREATE POLICY "Service role can manage all document requests" ON public.document_requests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "OSCA can manage all document requests" ON public.document_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'osca'
    )
  );

CREATE POLICY "BASCA can manage document requests in their barangay" ON public.document_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'basca' AND barangay IN (
        SELECT barangay FROM public.senior_citizens WHERE id = senior_citizen_id
      )
    )
  );

-- RLS Policies for benefits table
CREATE POLICY "Senior citizens can view own benefits" ON public.benefits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.senior_citizens 
      WHERE user_id = auth.uid() AND id = senior_citizen_id
    )
  );

-- Allow service role to manage all benefits (for admin operations)
CREATE POLICY "Service role can manage all benefits" ON public.benefits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "OSCA can manage all benefits" ON public.benefits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'osca'
    )
  );

CREATE POLICY "BASCA can manage benefits in their barangay" ON public.benefits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'basca' AND barangay IN (
        SELECT barangay FROM public.senior_citizens WHERE id = senior_citizen_id
      )
    )
  );

-- RLS Policies for census_records table
-- Allow service role to manage all census records (for admin operations)
CREATE POLICY "Service role can manage all census records" ON public.census_records
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "OSCA can view all census records" ON public.census_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'osca'
    )
  );

CREATE POLICY "BASCA can view census records for their barangay" ON public.census_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'basca' AND barangay = census_records.barangay
    )
  );

-- RLS Policies for beneficiaries table
-- Allow service role to manage all beneficiaries (for admin operations)
CREATE POLICY "Service role can manage all beneficiaries" ON public.beneficiaries
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "OSCA can manage all beneficiaries" ON public.beneficiaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'osca'
    )
  );

CREATE POLICY "BASCA can manage beneficiaries in their barangay" ON public.beneficiaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'basca' AND barangay IN (
        SELECT barangay FROM public.senior_citizens WHERE id = senior_citizen_id
      )
    )
  );

CREATE POLICY "Senior citizens can view own beneficiaries" ON public.beneficiaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.senior_citizens 
      WHERE user_id = auth.uid() AND id = senior_citizen_id
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_senior_citizens_updated_at BEFORE UPDATE ON public.senior_citizens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_requests_updated_at BEFORE UPDATE ON public.document_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benefits_updated_at BEFORE UPDATE ON public.benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_census_records_updated_at BEFORE UPDATE ON public.census_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create improved function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
  phone_val TEXT;
  role_val TEXT;
  department_val TEXT;
  position_val TEXT;
  employee_id_val TEXT;
  barangay_val TEXT;
  barangay_code_val TEXT;
  date_of_birth_val DATE;
  address_val TEXT;
  emergency_contact_name_val TEXT;
  emergency_contact_phone_val TEXT;
  emergency_contact_relationship_val TEXT;
BEGIN
  -- Safely extract values from metadata with defaults
  first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  phone_val := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'senior');
  
  -- Extract role-specific fields
  department_val := NEW.raw_user_meta_data->>'department';
  position_val := NEW.raw_user_meta_data->>'position';
  employee_id_val := NEW.raw_user_meta_data->>'employee_id';
  barangay_val := NEW.raw_user_meta_data->>'barangay';
  barangay_code_val := NEW.raw_user_meta_data->>'barangay_code';
  date_of_birth_val := (NEW.raw_user_meta_data->>'date_of_birth')::DATE;
  address_val := NEW.raw_user_meta_data->>'address';
  emergency_contact_name_val := NEW.raw_user_meta_data->>'emergency_contact_name';
  emergency_contact_phone_val := NEW.raw_user_meta_data->>'emergency_contact_phone';
  emergency_contact_relationship_val := NEW.raw_user_meta_data->>'emergency_contact_relationship';
  
  -- Insert user record with safe defaults
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    phone, 
    role,
    department,
    position,
    employee_id,
    barangay,
    barangay_code,
    date_of_birth,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
    is_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    first_name_val,
    last_name_val,
    phone_val,
    role_val::user_role,
    department_val,
    position_val,
    employee_id_val,
    barangay_val,
    barangay_code_val,
    date_of_birth_val,
    address_val,
    emergency_contact_name_val,
    emergency_contact_phone_val,
    emergency_contact_relationship_val,
    FALSE,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the registration
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 