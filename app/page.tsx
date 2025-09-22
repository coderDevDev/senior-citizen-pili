'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/components/splash-screen';
import { RoleSelection } from '@/components/role-selection';

function AppContent() {
  const { authState } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Show splash for 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // If authenticated, redirect to dashboard
    if (authState.isAuthenticated && authState.user && !showSplash) {
      router.push('/dashboard');
    }
  }, [authState.isAuthenticated, authState.user, showSplash, router]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // If authenticated, show loading while redirecting
  if (authState.isAuthenticated && authState.user) {
    return (
      <div className="m bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100in-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show role selection for non-authenticated users
  return (
    <RoleSelection
      onRoleSelect={role => router.push(`/login?role=${role}`)}
      onBack={() => {}}
    />
  );
}

export default function HomePage() {
  return <AppContent />;
}
