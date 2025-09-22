'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ForgotPasswordScreen } from '@/components/forgot-password-screen';
import { RoleSelection } from '@/components/role-selection';

function ForgotPasswordPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'osca' | 'basca' | 'senior' | null>(
    null
  );

  const role = searchParams.get('role') as 'osca' | 'basca' | 'senior' | null;

  useEffect(() => {
    if (role && (role === 'osca' || role === 'basca' || role === 'senior')) {
      setSelectedRole(role);
    }
  }, [role]);

  const handleRoleSelect = (role: 'osca' | 'basca' | 'senior') => {
    router.push(`/forgot-password?role=${role}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  // If no role is selected, show role selection
  if (!selectedRole) {
    return (
      <RoleSelection onRoleSelect={handleRoleSelect} onBack={handleBack} />
    );
  }

  // Show forgot password screen with selected role
  return (
    <ForgotPasswordScreen
      selectedRole={selectedRole}
      onBack={() => router.push(`/login?role=${selectedRole}`)}
    />
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto mb-4"></div>
            <p className="text-[#666666]">Loading...</p>
          </div>
        </div>
      }>
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
