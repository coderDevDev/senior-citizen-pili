"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { ArrowLeft, Shield, Users, User, Loader2, Mail, CheckCircle } from "lucide-react"

interface ForgotPasswordScreenProps {
  onBack: () => void
  selectedRole: "osca" | "basca" | "senior"
}

export function ForgotPasswordScreen({ onBack, selectedRole }: ForgotPasswordScreenProps) {
  const { authState, forgotPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const result = await forgotPassword({ email, role: selectedRole })

    if (result.success) {
      setIsSubmitted(true)
      setMessage(result.message)
    } else {
      setError(result.message)
    }
  }

  const roleConfig = {
    osca: {
      icon: Shield,
      title: "OSCA Superadmin",
      color: "bg-[#00af8f]",
      description: "Reset your OSCA administrator account password",
    },
    basca: {
      icon: Users,
      title: "BASCA Admin",
      color: "bg-[#ffd416]",
      description: "Reset your BASCA administrator account password",
    },
    senior: {
      icon: User,
      title: "Senior Citizen",
      color: "bg-[#00af8f]",
      description: "Reset your senior citizen account password",
    },
  }

  const config = roleConfig[selectedRole]
  const Icon = config.icon

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-[#00af8f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#00af8f]" />
            </div>
            <h2 className="text-xl font-bold text-[#333333] mb-2">Check Your Email</h2>
            <p className="text-[#666666] text-sm mb-6">{message}</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-[#333333] font-medium text-sm mb-1">Email sent to:</p>
              <p className="text-[#666666] text-sm">{email}</p>
            </div>
            <Button onClick={onBack} className="w-full bg-[#00af8f] hover:bg-[#009b7f] text-white">
              Back to Sign In
            </Button>
            <p className="text-[#666666] text-xs mt-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2 hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <Badge className={`${config.color} text-white px-3 py-1`}>
                <Icon className="w-4 h-4 mr-2" />
                {config.title}
              </Badge>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#333333]">Reset Password</CardTitle>
          <p className="text-[#666666] text-sm">{config.description}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-[#00af8f]/5 border border-[#00af8f]/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#00af8f] mt-0.5" />
              <div>
                <h4 className="text-[#333333] font-medium text-sm mb-1">Password Reset Instructions</h4>
                <p className="text-[#666666] text-xs mb-2">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <p className="text-[#666666] text-xs">
                  Make sure to use the same email address associated with your {config.title} account.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#333333] font-medium">
                Email Address
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="pl-10 border-gray-300 focus:border-[#00af8f]"
                  disabled={authState.isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full ${config.color} hover:opacity-90 text-white font-medium`}
              disabled={authState.isLoading || !email}
            >
              {authState.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={onBack}
              className="text-[#666666] hover:text-[#333333] p-0 h-auto text-sm"
              disabled={authState.isLoading}
            >
              Back to Sign In
            </Button>
          </div>

          {/* Security Note */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[#666666] text-xs">
              <strong>Security Note:</strong> For your protection, password reset links expire after 1 hour and can only
              be used once.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
