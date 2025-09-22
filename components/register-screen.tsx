'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Eye, EyeOff, Shield, Users, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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
  barangay: z.string().min(1, 'Barangay is required'),
  barangayCode: z.string().min(1, 'Barangay code is required')
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

  const schema = createRegisterSchema(selectedRole);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema)
  });

  const password = watch('password');

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
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await registerUser({
        ...data,
        role: selectedRole
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
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
                <Input
                  id="email"
                  type="email"
                  placeholder={config.defaultEmail}
                  className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                  {...register('email')}
                />
                {(errors as any).email && (
                  <p className="text-red-500 text-sm">
                    {(errors as any).email.message}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="barangay"
                      className="text-[#333333] font-medium">
                      Barangay
                    </Label>
                    <Input
                      id="barangay"
                      type="text"
                      placeholder="Barangay Name"
                      className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      {...register('barangay')}
                    />
                    {(errors as any).barangay && (
                      <p className="text-red-500 text-sm">
                        {(errors as any).barangay.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="barangayCode"
                      className="text-[#333333] font-medium">
                      Barangay Code
                    </Label>
                    <Input
                      id="barangayCode"
                      type="text"
                      placeholder="BRGY001"
                      className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      {...register('barangayCode')}
                    />
                    {(errors as any).barangayCode && (
                      <p className="text-red-500 text-sm">
                        {(errors as any).barangayCode.message}
                      </p>
                    )}
                  </div>
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
                disabled={isLoading}
                className={`w-full h-12 text-lg font-semibold text-white shadow-lg transition-all duration-300 rounded-xl ${
                  isLoading
                    ? 'bg-[#666666] cursor-not-allowed'
                    : `${config.bgColor} hover:shadow-xl hover:scale-105 active:scale-95`
                }`}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
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
