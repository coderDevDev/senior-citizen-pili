'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthAPI } from '@/lib/api/auth';

export default function TestResetPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleTestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await AuthAPI.resetPassword(email);
      if (result.success) {
        setMessage(`✅ ${result.message}`);
        setMessage(prev => prev + '\n\n📧 Check your email and click the link IMMEDIATELY (within 1 hour)');
        setMessage(prev => prev + '\n\n🔗 The reset link should redirect to: ' + window.location.origin + '/reset-password');
      } else {
        setError(`❌ ${result.message}`);
      }
    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#333333]">🧪 Test Password Reset</CardTitle>
          <p className="text-[#666666] text-sm">Debug the password reset functionality</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <pre className="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <pre className="text-green-700 text-sm whitespace-pre-wrap">{message}</pre>
            </div>
          )}

          <form onSubmit={handleTestReset} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#333333] font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="border-gray-300 focus:border-[#00af8f]"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#00af8f] hover:bg-[#009b7f] text-white font-medium"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending...' : '🚀 Send Test Reset Email'}
            </Button>
          </form>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-blue-900 font-medium text-sm mb-2">🔍 Debugging Tips:</h4>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• Use a real email address you can access</li>
              <li>• Check spam/junk folder if no email arrives</li>
              <li>• Click the reset link within 1 hour</li>
              <li>• Each link can only be used once</li>
              <li>• Open browser dev tools to see console logs</li>
            </ul>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => window.location.href = '/forgot-password'}
              className="text-[#666666] hover:text-[#333333] p-0 h-auto text-sm"
            >
              ← Back to Forgot Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
