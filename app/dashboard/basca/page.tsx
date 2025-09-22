'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  AlertTriangle,
  Bell,
  TrendingUp,
  FileText,
  Calendar,
  MapPin,
  Activity,
  BarChart3
} from 'lucide-react';
import { DashboardAPI, type DashboardStats } from '@/lib/api/dashboard';
import { useAuth } from '@/hooks/useAuth';

export default function BASCADashboard() {
  const router = useRouter();
  const { authState } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's barangay from auth state
  const userBarangay = authState.user?.barangay || 'Unknown';
  const userName = `${authState.user?.firstName} ${authState.user?.lastName}`;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch barangay-specific data
        const data = await DashboardAPI.getBASCADashboardStats(userBarangay);
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching BASCA dashboard data:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load dashboard data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, [userBarangay]);

  const getStatsConfig = (data: DashboardStats) => [
    {
      title: 'Seniors in Your Barangay',
      value: data.totalSeniors.toLocaleString(),
      change: `+${data.newThisMonth} this month`,
      icon: Users,
      color: 'bg-[#ffd416]',
      textColor: 'text-[#ffd416]'
    },
    {
      title: 'Active Seniors',
      value: data.activeSeniors.toLocaleString(),
      change: `${Math.round(
        (data.activeSeniors / Math.max(data.totalSeniors, 1)) * 100
      )}% of total`,
      icon: UserPlus,
      color: 'bg-[#ffd416]',
      textColor: 'text-[#ffd416]'
    },
    {
      title: 'New This Month',
      value: data.newThisMonth.toLocaleString(),
      change: data.newThisMonth > 0 ? '+' + data.newThisMonth : '0',
      icon: TrendingUp,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'Pending Requests',
      value: data.pendingRequests.toLocaleString(),
      change: `${data.pendingAppointments} appointments`,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#333333] leading-tight">
            BASCA Dashboard
          </h1>
          <p className="text-sm sm:text-base text-[#666666] mt-1 sm:mt-2">
            Loading dashboard data...
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between min-h-[60px] sm:min-h-[80px]">
                  <div className="flex-1 min-w-0">
                    <div className="w-20 sm:w-24 lg:w-32 h-2 sm:h-3 lg:h-4 bg-gray-200 rounded mb-1 sm:mb-2"></div>
                    <div className="w-8 sm:w-12 lg:w-16 h-4 sm:h-6 lg:h-8 bg-gray-200 rounded mb-1"></div>
                    <div className="w-12 sm:w-16 lg:w-20 h-2 sm:h-3 lg:h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-lg sm:rounded-xl lg:rounded-2xl flex-shrink-0 ml-2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#333333] leading-tight">
            BASCA Dashboard
          </h1>
          <p className="text-sm sm:text-base text-red-600 mt-1 sm:mt-2">
            Error: {error || 'Failed to load data'}
          </p>
        </div>
        <Card className="p-4 sm:p-6 lg:p-8 text-center">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-red-500 mx-auto mb-2 sm:mb-3 lg:mb-4" />
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2">
            Dashboard Error
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 lg:mb-4">
            {error || 'Failed to load dashboard data'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#ffd416] hover:bg-[#ffd417] text-white h-8 sm:h-9 lg:h-10 text-xs sm:text-sm px-3 sm:px-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const stats = getStatsConfig(dashboardData);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#333333] mb-1 sm:mb-2 leading-tight">
            BASCA Dashboard
          </h1>
          <p className="text-sm sm:text-base text-[#666666] mb-2 sm:mb-3 leading-relaxed">
            Welcome back, {userName}! Managing senior citizens in {userBarangay}
            .
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge
              variant="outline"
              className="bg-[#ffd416]/10 text-[#ffd416] border-[#ffd416]/20 w-fit text-xs sm:text-sm px-2 py-1">
              {userBarangay} Coordinator
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 border-green-200 w-fit text-xs sm:text-sm px-2 py-1">
              Real-time Data
            </Badge>
            <span className="text-xs sm:text-sm text-[#666666] whitespace-nowrap">
              Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="border-[#ffd416] text-[#ffd416] hover:bg-[#ffd416]/10 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
            onClick={() => router.push('/dashboard/basca/reports')}>
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Reports
          </Button>
          <Button
            className="bg-[#ffd416] hover:bg-[#ffd317] text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
            onClick={() => router.push('/dashboard/basca/seniors/')}>
            <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Add Senior
          </Button>
        </div>
      </div>

      {/* Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-yellow-50/50 group cursor-pointer"
              onClick={() => {
                if (stat.title.includes('Seniors'))
                  router.push('/dashboard/basca/seniors/');
                else if (stat.title.includes('Pending'))
                  router.push('/dashboard/basca/appointments');
              }}>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between min-h-[60px] sm:min-h-[80px]">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-[#666666] uppercase tracking-wide mb-1 sm:mb-2 truncate">
                      {stat.title}
                    </p>
                    <p className="text-base sm:text-xl lg:text-2xl font-bold text-[#333333] mb-1 sm:mb-2 group-hover:text-[#ffd416] transition-colors truncate">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <p
                        className={`text-xs sm:text-sm font-medium ${stat.textColor} truncate`}>
                        {stat.change}
                      </p>
                      {index === 0 && (
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div
                    className={`p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl ${stat.color} bg-opacity-10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-200 flex-shrink-0 ml-2`}>
                    <Icon
                      className={`w-3 h-3 sm:w-5 sm:h-5 lg:w-7 lg:h-7 ${stat.textColor}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions - Mobile Responsive */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50/30">
        <CardHeader className="bg-gradient-to-r from-[#ffd416]/5 to-[#ffd317]/5 border-b border-yellow-200/30 pb-2 sm:pb-4 lg:pb-6">
          <CardTitle className="flex items-center gap-2 sm:gap-3">
            <div className="p-1 sm:p-2 bg-[#ffd416]/10 rounded-lg sm:rounded-xl">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#ffd416]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#333333] truncate">
                Quick Actions
              </h3>
              <p className="text-xs sm:text-sm text-[#666666] mt-0.5 sm:mt-1 truncate">
                Manage {userBarangay} senior citizens
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
            {[
              {
                icon: UserPlus,
                label: 'Add Senior',
                description: 'Register new senior',
                path: '/dashboard/basca/seniors/',
                color: 'from-[#ffd416] to-[#ffd317]'
              },
              {
                icon: Users,
                label: 'View Seniors',
                description: 'Manage seniors',
                path: '/dashboard/basca/seniors/',
                color: 'from-blue-500 to-blue-600'
              },
              {
                icon: Calendar,
                label: 'Appointments',
                description: 'Schedule meetings',
                path: '/dashboard/basca/appointments',
                color: 'from-green-500 to-green-600'
              },
              {
                icon: FileText,
                label: 'Documents',
                description: 'Process requests',
                path: '/dashboard/basca/documents',
                color: 'from-purple-500 to-purple-600'
              },
              {
                icon: Bell,
                label: 'Announcements',
                description: 'Create notifications',
                path: '/dashboard/basca/announcements',
                color: 'from-red-500 to-red-600'
              },
              {
                icon: BarChart3,
                label: 'Reports',
                description: 'Generate reports',
                path: '/dashboard/basca/reports',
                color: 'from-orange-500 to-orange-600'
              }
            ].map((action, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl border-2 border-yellow-200/50 hover:border-[#ffd416]/30 transition-all duration-300 cursor-pointer"
                onClick={() => router.push(action.path)}>
                <div className="p-3 sm:p-4 lg:p-6 bg-white hover:bg-yellow-50/50 transition-colors">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br ${action.color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                      <action.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#333333] group-hover:text-[#ffd416] transition-colors text-xs sm:text-sm lg:text-base leading-tight">
                        {action.label}
                      </h4>
                      <p className="text-xs text-[#666666] mt-1 leading-tight hidden sm:block">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Barangay Information - Mobile Responsive */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50/30">
        <CardHeader className="bg-gradient-to-r from-[#ffd416]/5 to-[#ffd317]/5 border-b border-yellow-200/30 pb-2 sm:pb-4 lg:pb-6">
          <CardTitle className="flex items-center gap-2 sm:gap-3">
            <div className="p-1 sm:p-2 bg-[#ffd416]/10 rounded-lg sm:rounded-xl">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#ffd416]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#333333] truncate">
                Your Barangay Coverage
              </h3>
              <p className="text-xs sm:text-sm text-[#666666] mt-0.5 sm:mt-1 truncate">
                Senior citizen management scope
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-[#ffd416]/20 to-[#ffd317]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#ffd416]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg lg:text-xl font-bold text-[#333333] mb-1 truncate">
                  {userBarangay}
                </h4>
                <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                  You are managing {dashboardData.totalSeniors} senior citizens
                  in this barangay
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2 sm:gap-3 flex-shrink-0">
              <Badge
                variant="outline"
                className="text-xs sm:text-sm bg-[#ffd416]/10 text-[#ffd416] border-[#ffd416]/20 px-2 py-1 whitespace-nowrap">
                BASCA Coordinator
              </Badge>
              <p className="text-xs text-[#666666] whitespace-nowrap">
                Limited to {userBarangay} only
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
