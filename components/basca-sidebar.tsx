'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Search,
  Plus,
  Download,
  Database,
  MessageSquare,
  AlertTriangle,
  Calendar,
  MapPin,
  UserCheck,
  Activity,
  Stethoscope,
  ClipboardList,
  Heart,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardAPI } from '@/lib/api/dashboard';
import { usePWA } from '@/hooks/usePWA';
import { Wifi, WifiOff } from 'lucide-react';

interface BASCASidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BASCASidebar({ isOpen, onClose }: BASCASidebarProps) {
  const { authState, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isOnline, offlineQueue } = usePWA();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [sidebarStats, setSidebarStats] = useState({
    totalSeniors: 0,
    pendingAnnouncements: 0,
    pendingAppointments: 0,
    pendingDocuments: 0,
    pendingBenefits: 0
  });

  // Fetch sidebar stats for BASCA user's barangay
  useEffect(() => {
    const fetchSidebarStats = async () => {
      try {
        const userBarangay = authState.user?.barangay;
        if (userBarangay) {
          const data = await DashboardAPI.getBASCADashboardStats(userBarangay);
          setSidebarStats({
            totalSeniors: data.totalSeniors,
            pendingAnnouncements: 0, // BASCA doesn't have pending announcements
            pendingAppointments: data.pendingAppointments,
            pendingDocuments: data.pendingRequests,
            pendingBenefits: 0 // Will be implemented when benefits API is ready
          });
        }
      } catch (error) {
        console.error('Error fetching BASCA sidebar stats:', error);
        // Keep default values on error
      }
    };

    if (authState.user?.barangay) {
      fetchSidebarStats();
      // Refresh every 60 seconds
      const interval = setInterval(fetchSidebarStats, 60000);
      return () => clearInterval(interval);
    }
  }, [authState.user?.barangay]);

  // Update active item based on current pathname
  useEffect(() => {
    const currentItem = navigationItems.find(item => pathname === item.href);
    if (currentItem) {
      setActiveItem(currentItem.id);
    }
  }, [pathname]);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard/basca',
      section: 'main'
    },
    {
      id: 'seniors',
      label: 'Senior Citizens',
      icon: Users,
      href: '/dashboard/basca/seniors',
      description: 'Manage seniors in your barangay',
      section: 'management',
      badge:
        sidebarStats.totalSeniors > 0
          ? sidebarStats.totalSeniors.toLocaleString()
          : undefined
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: Bell,
      href: '/dashboard/basca/announcements',
      description: 'Barangay notifications',
      section: 'management'
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      href: '/dashboard/basca/reports',
      description: 'Generate barangay reports',
      section: 'management'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      href: '/dashboard/basca/appointments',
      description: 'Manage medical appointments',
      section: 'services',
      badge:
        sidebarStats.pendingAppointments > 0
          ? sidebarStats.pendingAppointments.toString()
          : undefined
    },
    {
      id: 'documents',
      label: 'Document Requests',
      icon: FileText,
      href: '/dashboard/basca/documents',
      description: 'Process ID & certificate requests',
      section: 'services',
      badge:
        sidebarStats.pendingDocuments > 0
          ? sidebarStats.pendingDocuments.toString()
          : undefined
    },
    {
      id: 'benefits',
      label: 'Benefits Management',
      icon: Heart,
      href: '/dashboard/basca/benefits',
      description: 'Track financial assistance',
      section: 'services',
      badge:
        sidebarStats.pendingBenefits > 0
          ? sidebarStats.pendingBenefits.toString()
          : undefined
    },
    {
      id: 'users',
      label: 'BASCA Accounts',
      icon: UserCheck,
      href: '/dashboard/basca/users',
      description: 'Manage BASCA accounts',
      section: 'management'
    }
  ];

  const handleNavigation = (item: any) => {
    setActiveItem(item.id);
    router.push(item.href);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  const renderNavigationItem = (item: any) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <Button
        key={item.id}
        variant={isActive ? 'default' : 'ghost'}
        className={`w-full justify-start transition-all duration-200 h-14 px-4 ${
          isActive
            ? 'bg-[#ffd416] text-white hover:bg-[#ffd317] shadow-md border-none'
            : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd416] border border-transparent hover:border-[#ffd416]/20'
        }`}
        onClick={() => handleNavigation(item)}>
        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm truncate">{item.label}</span>
            {item.badge && (
              <Badge
                variant="secondary"
                className={`ml-2 text-xs px-2 py-0.5 ${
                  isActive
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-[#ffd416]/10 text-[#ffd416] border-[#ffd416]/20'
                }`}>
                {item.badge}
              </Badge>
            )}
          </div>
          {item.description && (
            <p
              className={`text-xs mt-0.5 truncate ${
                isActive ? 'text-white/80' : 'text-gray-500'
              }`}>
              {item.description}
            </p>
          )}
        </div>
      </Button>
    );
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:border-r lg:border-gray-200`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#ffd416] to-[#ffd317] rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">BASCA</h2>
            <p className="text-xs text-[#ffd416] font-medium">
              Barangay Coordinator
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="lg:hidden h-8 w-8 p-0 hover:bg-gray-100">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#ffd416] to-[#ffd317] rounded-full flex items-center justify-center shadow-md">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {authState.user?.firstName} {authState.user?.lastName}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {authState.user?.email}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className="text-xs bg-[#ffd416]/10 text-[#ffd416] border-[#ffd416]/20">
                {authState.user?.barangay || 'Unknown Barangay'}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  isOnline
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
            {!isOnline &&
              offlineQueue &&
              Array.isArray(offlineQueue) &&
              offlineQueue.length > 0 && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-800">
                    {offlineQueue.length} pending sync
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="overflow-y-auto px-4 py-4 max-h-[calc(100vh-280px)]">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Main
            </h3>
            <div className="space-y-1">
              {groupedItems.main?.map(item => renderNavigationItem(item))}
            </div>
          </div>

          {/* Management Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Management
            </h3>
            <div className="space-y-1">
              {groupedItems.management?.map(item => renderNavigationItem(item))}
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Services
            </h3>
            <div className="space-y-1">
              {groupedItems.services?.map(item => renderNavigationItem(item))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {/* <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start h-11 border-[#ffd416]/30 hover:bg-[#ffd416]/10 hover:border-[#ffd416] transition-all duration-200"
            onClick={() => router.push('/dashboard/basca/seniors')}>
            <Plus className="w-4 h-4 mr-3 text-[#ffd416]" />
            <span className="text-sm font-medium">Add Senior Citizen</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start h-11 border-[#ffd416]/30 hover:bg-[#ffd416]/10 hover:border-[#ffd416] transition-all duration-200"
            onClick={() => router.push('/dashboard/basca/announcements')}>
            <Bell className="w-4 h-4 mr-3 text-[#ffd416]" />
            <span className="text-sm font-medium">Post Announcement</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start h-11 border-[#ffd416]/30 hover:bg-[#ffd416]/10 hover:border-[#ffd416] transition-all duration-200"
            onClick={() => router.push('/dashboard/basca/reports')}>
            <Download className="w-4 h-4 mr-3 text-[#ffd416]" />
            <span className="text-sm font-medium">Export Report</span>
          </Button>
        </div>
      </div> */}

      {/* Footer */}
      <div className="border-t border-gray-100 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 h-12 px-4"
          onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="font-medium">Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
