'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    const handleAuthStateChange = async () => {
      // Check if we have error parameters in the URL hash
      const hash = window.location.hash;
      if (hash.includes('error=')) {
        const urlParams = new URLSearchParams(hash.substring(1));
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        console.log('Auth error detected:', { error, errorDescription });
        
        if (error === 'access_denied') {
          setError('Access denied. The password reset link may have been used already or is invalid.');
        } else if (error === 'otp_expired') {
          setError('The password reset link has expired. Password reset links are valid for 1 hour only. Please request a new password reset.');
        } else {
          setError(`Authentication error: ${errorDescription || error}`);
        }
        setIsValidToken(false);
        return;
      }

      // Check if we have the required tokens from the URL (both query params and hash)
      let accessToken = searchParams.get('access_token');
      let refreshToken = searchParams.get('refresh_token');
      let type = searchParams.get('type');

      // If not in query params, check the hash fragment
      if (!accessToken && hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        accessToken = hashParams.get('access_token');
        refreshToken = hashParams.get('refresh_token');
        type = hashParams.get('type');
      }

      console.log('Reset password tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            setError('Invalid or expired reset link. Please request a new password reset.');
            setIsValidToken(false);
          } else if (data.session) {
            console.log('Session set successfully');
            setIsValidToken(true);
          } else {
            setError('Failed to establish session. Please request a new password reset.');
            setIsValidToken(false);
          }
        } catch (err) {
          console.error('Exception setting session:', err);
          setError('An error occurred. Please request a new password reset.');
          setIsValidToken(false);
        }
      } else {
        // Check if we're already authenticated
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error getting session:', error);
            setError('Invalid reset link. Please request a new password reset.');
            setIsValidToken(false);
          } else if (session) {
            // User is already authenticated, allow password reset
            console.log('User already authenticated');
            setIsValidToken(true);
          } else {
            setError('Invalid reset link. Please request a new password reset.');
            setIsValidToken(false);
          }
        } catch (err) {
          console.error('Exception getting session:', err);
          setError('An error occurred. Please request a new password reset.');
          setIsValidToken(false);
        }
      }
    };

    handleAuthStateChange();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidToken(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Additional password strength validation
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto mb-4"></div>
          <p className="text-[#666666]">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-[#333333] mb-2">Reset Link Issue</h2>
            <p className="text-[#666666] text-sm mb-6">{error}</p>
            
            {/* Additional help text for expired links */}
            {error.includes('expired') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                <h4 className="text-yellow-800 font-medium text-sm mb-2">Why did this happen?</h4>
                <ul className="text-yellow-700 text-xs space-y-1">
                  <li>• Password reset links expire after 1 hour for security</li>
                  <li>• Each link can only be used once</li>
                  <li>• The link may have been clicked already</li>
                </ul>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/forgot-password')} 
                className="w-full bg-[#00af8f] hover:bg-[#009b7f] text-white"
              >
                Request New Reset Link
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/login')} 
                className="w-full border-[#00af8f] text-[#00af8f] hover:bg-[#00af8f]/10"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-[#00af8f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#00af8f]" />
            </div>
            <h2 className="text-xl font-bold text-[#333333] mb-2">Password Reset Successful</h2>
            <p className="text-[#666666] text-sm mb-6">
              Your password has been successfully reset. You will be redirected to the login page shortly.
            </p>
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full bg-[#00af8f] hover:bg-[#009b7f] text-white"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-[#333333]">Reset Your Password</CardTitle>
          <p className="text-[#666666] text-sm">Enter your new password below</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-[#333333] font-medium">
                New Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  className="pl-10 pr-10 border-gray-300 focus:border-[#00af8f]"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-[#333333] font-medium">
                Confirm New Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  className="pl-10 pr-10 border-gray-300 focus:border-[#00af8f]"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#00af8f] hover:bg-[#009b7f] text-white font-medium"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push('/login')}
              className="text-[#666666] hover:text-[#333333] p-0 h-auto text-sm"
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[#666666] text-xs">
              <strong>Password Requirements:</strong> Minimum 6 characters with at least one uppercase letter, one lowercase letter, and one number.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto mb-4"></div>
            <p className="text-[#666666]">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
