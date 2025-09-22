export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'osca' | 'basca' | 'senior';
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  // OSCA specific fields
  department?: string;
  position?: string;
  employeeId?: string;
  // BASCA specific fields
  barangay?: string;
  barangayCode?: string;
  // Senior specific fields
  dateOfBirth?: string;
  address?: string;
  oscaId?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: 'osca' | 'basca' | 'senior';
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'osca' | 'basca' | 'senior';
  // OSCA specific
  department?: string;
  position?: string;
  employeeId?: string;
  // BASCA specific
  barangay?: string;
  barangayCode?: string;
  // Senior specific
  dateOfBirth?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

export interface ForgotPasswordData {
  email: string;
  role: 'osca' | 'basca' | 'senior';
}
