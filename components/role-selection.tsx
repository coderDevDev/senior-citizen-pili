'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Users,
  User,
  ArrowRight,
  Check,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';

interface RoleSelectionProps {
  onRoleSelect: (role: 'osca' | 'basca' | 'senior') => void;
  onBack: () => void;
}

export function RoleSelection({ onRoleSelect, onBack }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<
    'osca' | 'basca' | 'senior' | null
  >(null);

  const roles = [
    {
      id: 'osca' as const,
      title: 'OSCA Superadmin',
      subtitle: 'Office of Senior Citizens Affairs',
      description:
        'Full system control and management of senior citizen records across all barangays',
      icon: Shield,
      features: [
        'Manage all senior citizen records',
        'Generate comprehensive reports',
        'Post announcements and alerts',
        'Monitor census data',
        'System administration'
      ],
      gradient: 'from-[#00af8f] to-[#00af90]',
      bgGradient: 'from-[#feffff] to-[#ffffff]',
      iconColor: 'text-[#00af8f]',
      glowColor: 'shadow-[#00af8f]/25'
    },
    {
      id: 'basca' as const,
      title: 'BASCA Admin',
      subtitle: 'Barangay Association of Senior Citizens Affairs',
      description:
        'Manage senior citizen records and services within assigned barangay',
      icon: Users,
      features: [
        'Register senior citizens',
        'Manage local records',
        'Coordinate with BHW',
        'Process benefit requests',
        'Barangay-level reports'
      ],
      gradient: 'from-[#ffd416] to-[#ffd317]',
      bgGradient: 'from-[#feffff] to-[#ffffff]',
      iconColor: 'text-[#ffd416]',
      glowColor: 'shadow-[#ffd416]/25'
    },
    {
      id: 'senior' as const,
      title: 'Senior Citizen',
      subtitle: 'Self-Service Portal',
      description:
        'Access personal records, request documents, and schedule appointments',
      icon: User,
      features: [
        'View personal records',
        'Request official documents',
        'Schedule appointments',
        'Check announcements',
        'Apply for benefits'
      ],
      gradient: 'from-[#00af8f] to-[#00af90]',
      bgGradient: 'from-[#feffff] to-[#ffffff]',
      iconColor: 'text-[#00af8f]',
      glowColor: 'shadow-[#00af8f]/25'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff]">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#00af8f]/20 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#ffd416]/20 rounded-full blur-2xl" />
        {/* Desktop decorations */}
        <div className="hidden lg:block absolute top-20 right-20 w-64 h-64 bg-[#00af8f]/15 rounded-full blur-3xl" />
        <div className="hidden lg:block absolute bottom-20 left-20 w-48 h-48 bg-[#ffd416]/15 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col relative z-10 max-w-7xl mx-auto w-full">
        {/* Modern Navbar Header */}
        <nav className="flex items-center justify-between p-4 lg:p-6 mb-8 lg:mb-12">
          {/* <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-[#666666] hover:text-[#333333] hover:bg-white/50 rounded-xl p-3 transition-all duration-300">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </Button> */}
          <div className="flex items-center gap-3">
            <div
              className="bg-none rounded-xl flex items-center 
            justify-center">
              <Image
                src="https://mpqicxgtlmnwalwjmaov.supabase.co/storage/v1/object/sign/senior/f57b19189e96ff73ad61a12301a7ab147cdfe857.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzUzNjYxYi1hZjkzLTQ1MGUtYWZkOS00NDg2MzM4NmJiZDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzZW5pb3IvZjU3YjE5MTg5ZTk2ZmY3M2FkNjFhMTIzMDFhN2FiMTQ3Y2RmZTg1Ny5wbmciLCJpYXQiOjE3NTQ2NDM4NjMsImV4cCI6MTc4NjE3OTg2M30.iC2Ik1M4KZwvZuHiRHU1FeBNX0jRzHCkmqCow-i5Syw"
                alt="Logo"
                width={80}
                height={80}
              />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-[#333333]">
                Senior Citizen System
              </h2>
            </div>
          </div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl lg:text-5xl font-bold text-[#333333] mb-4">
            <span className="block bg-gradient-to-r from-[#00af8f] to-[#ffd416] bg-clip-text text-transparent">
              Choose Your Role
            </span>
          </h1>
        </div>

        {/* Role Cards - Mobile Layout */}
        <div className="flex-1 space-y-4 mb-8 lg:hidden">
          {roles.map(role => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                className={`group cursor-pointer transition-all duration-300 active:scale-95 ${
                  isSelected
                    ? `bg-gradient-to-r ${role.gradient} border-0 shadow-lg scale-[1.02]`
                    : 'bg-white border border-[#E0DDD8] hover:border-[#00af8f] hover:shadow-md'
                }`}
                onClick={() => setSelectedRole(role.id)}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          isSelected
                            ? 'bg-white/20 backdrop-blur-sm'
                            : 'bg-[#feffff]'
                        }`}>
                        <Icon
                          className={`w-7 h-7 transition-all duration-300 ${
                            isSelected ? 'text-white' : role.iconColor
                          }`}
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 text-[#00af8f]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-semibold transition-all duration-300 ${
                          isSelected ? 'text-white' : 'text-[#333333]'
                        }`}>
                        {role.title}
                      </h3>
                    </div>

                    <div className="flex-shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                          isSelected
                            ? 'border-white bg-white'
                            : 'border-[#E0DDD8]'
                        }`}>
                        {isSelected && (
                          <div className="w-full h-full rounded-full bg-[#00af8f] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Role Cards - Desktop Layout */}
        <div className="hidden lg:grid grid-cols-3 gap-8 mb-12">
          {roles.map(role => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                className={`group cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  isSelected
                    ? `bg-gradient-to-br ${role.bgGradient} border-2 border-transparent bg-clip-padding shadow-2xl ${role.glowColor} scale-105`
                    : 'bg-white/90 backdrop-blur-sm border border-[#E0DDD8] hover:border-[#00af8f] hover:shadow-xl'
                }`}
                onClick={() => setSelectedRole(role.id)}>
                <CardContent className="p-4 h-full flex flex-col">
                  {/* Icon and Title Section */}
                  <div className="text-center mb-8">
                    <div className="relative inline-block mb-6">
                      {isSelected && (
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${role.gradient} rounded-3xl blur-lg opacity-75 animate-pulse`}
                        />
                      )}
                      <div
                        className={`relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl transition-all duration-500 ${
                          isSelected
                            ? `bg-gradient-to-r ${role.gradient} scale-110`
                            : 'bg-[#feffff] group-hover:scale-105'
                        }`}>
                        <Icon
                          className={`w-12 h-12 transition-all duration-500 ${
                            isSelected ? 'text-white' : role.iconColor
                          }`}
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#00af8f] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-3xl font-bold text-[#333333] mb-3">
                      {role.title}
                    </h3>
                    {/* <p className="text-xl font-medium text-[#666666] mb-4">
                      {role.subtitle}
                    </p> */}
                    <p className="text-[#333333] leading-relaxed text-lg">
                      {role.description}
                    </p>
                  </div>

                  {/* Features Section */}
                  {/* <div className="flex-1 space-y-4">
                    <h4 className="text-lg font-semibold text-[#333333] mb-3">
                      Key Features
                    </h4>
                    <div className="space-y-3">
                      {role.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              isSelected
                                ? `bg-gradient-to-r ${role.gradient}`
                                : 'bg-[#ffd416]'
                            }`}
                          />
                          <span
                            className={`text-sm transition-all duration-300 ${
                              isSelected
                                ? 'text-[#333333] font-medium'
                                : 'text-[#666666]'
                            }`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div> */}

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="mt-8 text-center">
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#00af8f]/10 text-[#00af8f] rounded-full text-lg font-medium animate-pulse">
                        <Check className="w-5 h-5" />
                        Selected
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pb-safe lg:pb-8 lg:justify-center lg:gap-8">
          {/* <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 lg:flex-none lg:px-12 bg-white/80 backdrop-blur-sm border-[#00af8f] hover:bg-white hover:shadow-lg hover:border-[#00af90] transition-all duration-300 senior-button lg:h-20 lg:text-xl lg:font-semibold lg:rounded-2xl text-[#333333]">
            <ArrowLeft className="w-5 h-5 lg:w-7 lg:h-7 mr-3" />
            Back
          </Button> */}
          <Button
            onClick={() => {
              if (selectedRole) {
                // Check if we're on a specific route and navigate accordingly
                const currentPath = window.location.pathname;
                if (currentPath === '/register') {
                  onRoleSelect(selectedRole); // This will navigate to /register?role=...
                } else if (currentPath === '/forgot-password') {
                  onRoleSelect(selectedRole); // This will navigate to /forgot-password?role=...
                } else {
                  onRoleSelect(selectedRole); // Default to login
                }
              }
            }}
            disabled={!selectedRole}
            className={`flex-1 lg:flex-none lg:px-20 text-white font-medium shadow-lg transition-all duration-300 senior-button lg:h-20 lg:text-xl lg:font-semibold lg:rounded-2xl ${
              selectedRole
                ? `bg-gradient-to-r ${
                    roles.find(r => r.id === selectedRole)?.gradient
                  } hover:shadow-2xl hover:scale-105 active:scale-95 lg:hover:shadow-3xl`
                : 'bg-[#666666] lg:cursor-not-allowed'
            }`}>
            Continue
            <ArrowRight className="w-5 h-5 lg:w-7 lg:h-7 ml-3" />
          </Button>
        </div>

        {/* Help Text */}
        {/* <div className="text-center mt-6 pb-6 lg:pb-8">
          <p className="text-base lg:text-lg text-[#666666]">
            You can change your role later in settings
          </p>
        </div> */}
      </div>
    </div>
  );
}
