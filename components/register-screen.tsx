'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Eye, EyeOff, Shield, Users, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BarangaySelect } from '@/components/shared-components';
import { supabase } from '@/lib/supabase';

interface RegisterScreenProps {
  selectedRole: 'osca' | 'basca' | 'senior';
  onBack: () => void;
  onLogin: () => void;
}

// Base schema for all roles
const baseSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
});

// Role-specific schemas
const oscaSchema = baseSchema.extend({
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  employeeId: z.string().min(1, 'Employee ID is required')
});

const bascaSchema = baseSchema.extend({
  barangay: z.string().min(1, 'Barangay is required')
});

const seniorSchema = baseSchema.extend({
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z
    .string()
    .min(10, 'Emergency contact phone is required'),
  emergencyContactRelationship: z.string().min(1, 'Relationship is required')
});

// Create the appropriate schema based on role
const createRegisterSchema = (role: 'osca' | 'basca' | 'senior') => {
  switch (role) {
    case 'osca':
      return oscaSchema;
    case 'basca':
      return bascaSchema;
    case 'senior':
      return seniorSchema;
    default:
      return baseSchema;
  }
};

type RegisterFormData =
  | z.infer<typeof oscaSchema>
  | z.infer<typeof bascaSchema>
  | z.infer<typeof seniorSchema>;

export function RegisterScreen({
  selectedRole,
  onBack,
  onLogin
}: RegisterScreenProps) {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);

  const schema = createRegisterSchema(selectedRole);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    setError: setFormError,
    clearErrors
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema)
  });

  const password = watch('password');
  const email = watch('email');
  const barangay = watch('barangay');

  // Check if email already exists
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setEmailCheckLoading(true);
    setEmailExists(false);
    setEmailChecked(false);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking email:', error);
        return;
      }
      
      setEmailExists(!!data);
      setEmailChecked(true);
      
      if (data) {
        setFormError('email', {
          type: 'manual',
          message: 'This email is already registered. Please use a different email or login.'
        });
      }
    } catch (err) {
      console.error('Email check error:', err);
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // Auto-generate barangay code from barangay name
  const getBarangayCode = (barangayName: string): string => {
    return barangayName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[()]/g, '')
      .replace(/__+/g, '_');
  };

  const roleConfig = {
    osca: {
      icon: Shield,
      title: 'OSCA Superadmin',
      subtitle: 'Office of Senior Citizens Affairs',
      description: 'System administration and management',
      color: 'text-[#00af8f]',
      bgColor: 'bg-[#00af8f]',
      borderColor: 'border-[#00af8f]',
      defaultEmail: 'admin@osca.gov.ph'
    },
    basca: {
      icon: Users,
      title: 'BASCA Admin',
      subtitle: 'Barangay Association of Senior Citizens Affairs',
      description: 'Local barangay management',
      color: 'text-[#ffd416]',
      bgColor: 'bg-[#ffd416]',
      borderColor: 'border-[#ffd416]',
      defaultEmail: 'admin@basca.gov.ph'
    },
    senior: {
      icon: User,
      title: 'Senior Citizen',
      subtitle: 'Self-Service Portal',
      description: 'Personal account access',
      color: 'text-[#00af8f]',
      bgColor: 'bg-[#00af8f]',
      borderColor: 'border-[#00af8f]',
      defaultEmail: 'senior@example.com'
    }
  };

  const config = roleConfig[selectedRole];
  const Icon = config.icon;

  const onSubmit = async (data: RegisterFormData) => {
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      setFormError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match'
      });
      return;
    }

    // Check if email exists
    if (emailExists) {
      setError('This email is already registered. Please login instead.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare data with auto-generated barangayCode for BASCA
      const submitData: any = {
        ...data,
        role: selectedRole
      };

      // Auto-generate barangayCode from barangay for BASCA role
      if (selectedRole === 'basca' && data.barangay) {
        submitData.barangayCode = getBarangayCode(data.barangay);
      }

      const result = await registerUser(submitData);
      
      // Check if registration failed
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Registration successful!
      setSuccess(true);
      setError(null);
    } catch (err) {
      // Parse error messages
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      
      console.error('Registration error:', errorMessage);
      
      if (errorMessage.includes('already registered') || errorMessage.includes('duplicate key')) {
        setError('This email is already registered. Please use a different email or try logging in.');
        setFormError('email', {
          type: 'manual',
          message: 'Email already exists'
        });
      } else if (errorMessage.includes('invalid') && errorMessage.includes('email')) {
        setError('Please enter a valid email address. Make sure it\'s a real email format.');
        setFormError('email', {
          type: 'manual',
          message: 'Invalid email format'
        });
      } else if (errorMessage.includes('password')) {
        setError('Password must be at least 6 characters long.');
        setFormError('password', {
          type: 'manual',
          message: 'Password too short'
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        // Display the actual error message from API
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}

        {/* Background Decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#00af8f]/20 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#ffd416]/20 rounded-full blur-2xl" />
          {/* Desktop decorations */}
          <div className="hidden lg:block absolute top-20 right-20 w-64 h-64 bg-[#00af8f]/15 rounded-full blur-3xl" />
          <div className="hidden lg:block absolute bottom-20 left-20 w-48 h-48 bg-[#ffd416]/15 rounded-full blur-3xl" />
        </div>
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="absolute top-4 left-4 text-[#666666] hover:text-[#333333]">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-center mb-6">
            <div
              className={`w-16 h-16 ${config.bgColor} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-[#333333] mb-2">
            {config.title}
          </h1>
          <p className="text-lg text-[#666666] mb-1">{config.subtitle}</p>
          <p className="text-sm text-[#666666]">{config.description}</p>
        </div>

        {/* Register Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-[#333333]">
              Create Account
            </CardTitle>
            <p className="text-[#666666]">Sign up to access the system</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <strong>Error:</strong> {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="ml-2 text-green-800">
                    <strong>Success!</strong> Your registration has been submitted.
                    <div className="mt-2 space-y-1 text-sm">
                      <p>✅ A confirmation email has been sent to <strong>{email}</strong></p>
                      {selectedRole === 'basca' && (
                        <p>⏳ Your account is pending approval from the OSCA administrator. You will be able to login once your account is approved.</p>
                      )}
                      {selectedRole === 'osca' && (
                        <p>✅ You can now login with your credentials.</p>
                      )}
                      {selectedRole === 'senior' && (
                        <p>✅ Please verify your email and you can login.</p>
                      )}
                    </div>
                    <Button
                      onClick={onLogin}
                      variant="outline"
                      className="mt-3 w-full border-green-600 text-green-700 hover:bg-green-100"
                    >
                      Go to Login Page
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-[#333333] font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                    {...register('firstName')}
                  />
                  {(errors as any).firstName && (
                    <p className="text-red-500 text-sm">
                      {(errors as any).firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-[#333333] font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                    {...register('lastName')}
                  />
                  {(errors as any).lastName && (
                    <p className="text-red-500 text-sm">
                      {(errors as any).lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#333333] font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder={config.defaultEmail}
                    className={`h-12 text-lg border-2 focus:ring-2 rounded-xl pr-10 ${
                      emailExists
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : emailChecked && !emailExists
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                        : 'border-[#E0DDD8] focus:border-[#00af8f] focus:ring-[#00af8f]/20'
                    }`}
                    {...register('email')}
                    onBlur={(e) => checkEmailExists(e.target.value)}
                  />
                  {emailCheckLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-[#00af8f] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!emailCheckLoading && emailChecked && !emailExists && email && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                  {!emailCheckLoading && emailExists && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                </div>
                {(errors as any).email && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {(errors as any).email.message}
                  </p>
                )}
                {!emailCheckLoading && emailChecked && !emailExists && email && !((errors as any).email) && (
                  <p className="text-green-600 text-sm flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Email is available
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#333333] font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+63 912 345 6789"
                  className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                  {...register('phone')}
                />
                {(errors as any).phone && (
                  <p className="text-red-500 text-sm">
                    {(errors as any).phone.message}
                  </p>
                )}
              </div>

              {/* Role-specific fields */}
              {selectedRole === 'osca' && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="department"
                      className="text-[#333333] font-medium">
                      Department
                    </Label>
                    <Input
                      id="department"
                      type="text"
                      placeholder="Office of Senior Citizens Affairs"
                      className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      {...register('department')}
                    />
                    {(errors as any).department && (
                      <p className="text-red-500 text-sm">
                        {(errors as any).department.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="position"
                        className="text-[#333333] font-medium">
                        Position
                      </Label>
                      <Input
                        id="position"
                        type="text"
                        placeholder="Superadmin"
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                        {...register('position')}
                      />
                      {(errors as any).position && (
                        <p className="text-red-500 text-sm">
                          {(errors as any).position.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="employeeId"
                        className="text-[#333333] font-medium">
                        Employee ID
                      </Label>
                      <Input
                        id="employeeId"
                        type="text"
                        placeholder="OSCA001"
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                        {...register('employeeId')}
                      />
                      {(errors as any).employeeId && (
                        <p className="text-red-500 text-sm">
                          {(errors as any).employeeId.message}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedRole === 'basca' && (
                <div className="space-y-2">
                  <Label htmlFor="barangay" className="text-[#333333] font-medium">
                    Barangay <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="barangay"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <BarangaySelect
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear error when value changes
                          if (value) {
                            clearErrors('barangay');
                          }
                        }}
                        id="barangay"
                        placeholder="Select your barangay"
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                        error={(errors as any).barangay?.message}
                      />
                    )}
                  />
                  {(errors as any).barangay && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {(errors as any).barangay.message}
                    </p>
                  )}
                  {barangay && !((errors as any).barangay) && (
                    <p className="text-xs text-gray-600">
                      Code: <span className="font-mono font-medium">{getBarangayCode(barangay)}</span>
                    </p>
                  )}
                </div>
              )}

              {selectedRole === 'senior' && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="dateOfBirth"
                      className="text-[#333333] font-medium">
                      Date of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      {...register('dateOfBirth')}
                    />
                    {(errors as any).dateOfBirth && (
                      <p className="text-red-500 text-sm">
                        {(errors as any).dateOfBirth.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="text-[#333333] font-medium">
                      Address
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Complete address"
                      className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      {...register('address')}
                    />
                    {(errors as any).address && (
                      <p className="text-red-500 text-sm">
                        {(errors as any).address.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContactName"
                      className="text-[#333333] font-medium">
                      Emergency Contact Name
                    </Label>
                    <Input
                      id="emergencyContactName"
                      type="text"
                      placeholder="Emergency contact name"
                      className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      {...register('emergencyContactName')}
                    />
                    {(errors as any).emergencyContactName && (
                      <p className="text-red-500 text-sm">
                        {(errors as any).emergencyContactName.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="emergencyContactPhone"
                        className="text-[#333333] font-medium">
                        Emergency Contact Phone
                      </Label>
                      <Input
                        id="emergencyContactPhone"
                        type="tel"
                        placeholder="+63 912 345 6789"
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                        {...register('emergencyContactPhone')}
                      />
                      {(errors as any).emergencyContactPhone && (
                        <p className="text-red-500 text-sm">
                          {(errors as any).emergencyContactPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="emergencyContactRelationship"
                        className="text-[#333333] font-medium">
                        Relationship
                      </Label>
                      <Input
                        id="emergencyContactRelationship"
                        type="text"
                        placeholder="Son/Daughter/Spouse"
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                        {...register('emergencyContactRelationship')}
                      />
                      {(errors as any).emergencyContactRelationship && (
                        <p className="text-red-500 text-sm">
                          {(errors as any).emergencyContactRelationship.message}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[#333333] font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl pr-12"
                    {...register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-[#333333]"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                {(errors as any).password && (
                  <p className="text-red-500 text-sm">
                    {(errors as any).password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[#333333] font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl pr-12"
                    {...register('confirmPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-[#333333]"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }>
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                {(errors as any).confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {(errors as any).confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || success}
                className={`w-full h-12 text-lg font-semibold text-white shadow-lg transition-all duration-300 rounded-xl ${
                  isLoading || success
                    ? 'bg-[#666666] cursor-not-allowed'
                    : `${config.bgColor} hover:shadow-xl hover:scale-105 active:scale-95`
                }`}>
                {isLoading ? 'Creating Account...' : success ? 'Registration Complete' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-[#666666]">
                Already have an account?{' '}
                <Button
                  variant="link"
                  onClick={onLogin}
                  className="text-[#00af8f] hover:text-[#00af90] font-medium p-0 h-auto">
                  Sign in here
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
