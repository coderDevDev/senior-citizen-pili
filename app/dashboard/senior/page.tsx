'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Bell,
  Calendar,
  FileText,
  Gift,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AnnouncementsAPI, type Announcement } from '@/lib/api/announcements';
import { DocumentsAPI, type DocumentRequest } from '@/lib/api/documents';
import { BenefitsAPI, type BenefitApplication } from '@/lib/api/benefits';

export default function SeniorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [personalInfo, setPersonalInfo] = useState<{
    name: string;
    age: number;
    barangay: string;
    address?: string;
    phone?: string;
    email?: string;
    oscaId?: string | null;
  }>({ name: '', age: 0, barangay: '' });

  const [recentAnnouncements, setRecentAnnouncements] = useState<
    Announcement[]
  >([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Array<{
      id: string;
      type: string;
      date: string;
      time: string;
      location?: string | null;
      status: string;
    }>
  >([]);
  const [documentRequests, setDocumentRequests] = useState<
    Array<{
      id: string;
      type: string;
      status: string;
      date: string;
      processedDate: string | null;
    }>
  >([]);
  const [benefits, setBenefits] = useState<
    Array<{
      id: string;
      name: string;
      amount?: string;
      status: string;
      nextPayment: string | null;
    }>
  >([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) throw new Error('Not authenticated');

        // Senior profile with joined user
        const { data: senior, error: seniorErr } = await supabase
          .from('senior_citizens')
          .select(
            `
            id,
            first_name,
            last_name,
            barangay,
            address,
            osca_id,
            date_of_birth,
            contact_phone,
            users!senior_citizens_user_id_fkey (
              first_name,
              last_name,
              email,
              phone
            )
          `
          )
          .eq('user_id', userId)
          .single();

        if (seniorErr || !senior) throw new Error('Senior profile not found');

        const firstName = Array.isArray(senior.users)
          ? senior.users[0]?.first_name
          : senior.users?.first_name;
        const lastName = Array.isArray(senior.users)
          ? senior.users[0]?.last_name
          : senior.users?.last_name;
        const email = Array.isArray(senior.users)
          ? senior.users[0]?.email
          : senior.users?.email;
        const contact_phone = Array.isArray(senior.users)
          ? senior.contact_phone
          : senior.contact_phone;

        console.log({ senior });

        const age = senior.date_of_birth
          ? new Date().getFullYear() -
            new Date(senior.date_of_birth).getFullYear()
          : 0;

        setPersonalInfo({
          name: `${firstName || senior.first_name} ${
            lastName || senior.last_name
          }`.trim(),
          age,
          barangay: senior.barangay,
          address: senior.address || undefined,
          phone: contact_phone || undefined,
          email: email || undefined,
          oscaId: senior.osca_id || null
        });

        // Announcements (recent, barangay or global)
        const { announcements } = await AnnouncementsAPI.getAnnouncements(
          1,
          5,
          {
            status: 'published',
            targetBarangay: senior.barangay
          }
        );
        setRecentAnnouncements(announcements);

        // Appointments (upcoming for this senior)
        const { data: appointments } = await supabase
          .from('appointments')
          .select(
            'id, appointment_type, appointment_date, appointment_time, location, status'
          )
          .eq('senior_citizen_id', senior.id)
          .gte('appointment_date', new Date().toISOString().split('T')[0])
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true })
          .limit(5);

        setUpcomingAppointments(
          (appointments || []).map(a => ({
            id: a.id,
            type: a.appointment_type,
            date: a.appointment_date,
            time: a.appointment_time,
            location: a.location,
            status: a.status
          }))
        );

        // Documents (recent for this senior)
        const docs = await DocumentsAPI.getDocumentRequests({});
        const myDocs = docs
          .filter(
            d =>
              d.senior_citizens?.id === senior.id ||
              d.senior_citizen_id === senior.id
          )
          .slice(0, 5)
          .map(d => ({
            id: d.id,
            type: d.document_type,
            status: d.status,
            date: d.created_at,
            processedDate: d.updated_at || null
          }));
        setDocumentRequests(myDocs);

        // Benefits (recent for this senior)
        const bens = await BenefitsAPI.getBenefitApplications({});
        const myBens = bens
          .filter(
            b =>
              b.senior_citizens?.id === senior.id ||
              b.senior_citizen_id === senior.id
          )
          .slice(0, 5)
          .map(b => ({
            id: b.id,
            name: b.benefit_type.replace('_', ' '),
            amount:
              typeof b.amount_approved === 'number'
                ? `₱${b.amount_approved.toLocaleString()}`
                : undefined,
            status: b.status,
            nextPayment: b.scheduled_date || null
          }));
        setBenefits(myBens);
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto mb-4"></div>
          <p className="text-[#666666]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#333333]">
            Welcome, {personalInfo.name}!
          </h1>
          <p className="text-sm sm:text-base text-[#666666] mt-1 sm:mt-2">
            Your Senior Citizen Self-Service Portal
          </p>
          {error && <p className="text-xs sm:text-sm text-red-600 mt-2">{error}</p>}
        </div>
      </div>

      {/* Quick Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#666666] truncate">
                  Total Announcements
                </p>
                <p className="text-lg sm:text-2xl font-bold text-[#333333] truncate">
                  {recentAnnouncements.length}
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[#00af8f]/10 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <Bell className="w-4 sm:w-6 h-4 sm:h-6 text-[#00af8f]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#666666] truncate">
                  Upcoming Appointments
                </p>
                <p className="text-lg sm:text-2xl font-bold text-[#333333] truncate">
                  {upcomingAppointments.length}
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <Calendar className="w-4 sm:w-6 h-4 sm:h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#666666] truncate">
                  Document Requests
                </p>
                <p className="text-lg sm:text-2xl font-bold text-[#333333] truncate">
                  {documentRequests.length}
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <FileText className="w-4 sm:w-6 h-4 sm:h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#666666] truncate">
                  Active Benefits
                </p>
                <p className="text-lg sm:text-2xl font-bold text-[#333333] truncate">
                  {benefits.filter(b => b.status === 'active').length}
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <Gift className="w-4 sm:w-6 h-4 sm:h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Information Card - Mobile Responsive */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="w-4 sm:w-5 h-4 sm:h-5 text-[#00af8f]" />
            <span>Personal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-[#333333] mb-2 text-sm sm:text-base">
                  Basic Information
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-[#666666]">Name:</span>{' '}
                    <span className="font-medium">{personalInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-[#666666]">Age:</span>{' '}
                    <span className="font-medium">
                      {personalInfo.age} years old
                    </span>
                  </div>
                  <div>
                    <span className="text-[#666666]">OSCA ID:</span>{' '}
                    <span className="font-medium">
                      {personalInfo.oscaId || 'Not assigned'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-[#333333] mb-2 text-sm sm:text-base">
                  Contact Information
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 sm:w-4 h-3 sm:h-4 text-[#666666]" />
                    <span>{personalInfo.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 sm:w-4 h-3 sm:h-4 text-[#666666]" />
                    <span>{personalInfo.email || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-[#333333] mb-2 text-sm sm:text-base">
                  Address Information
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 sm:w-4 h-3 sm:h-4 text-[#666666]" />
                    <span>{personalInfo.address || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[#666666]">Barangay:</span>{' '}
                    <span className="font-medium">{personalInfo.barangay}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Announcements - Mobile Responsive */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bell className="w-4 sm:w-5 h-4 sm:h-5 text-[#00af8f]" />
                <span>Recent Announcements</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="border-[#00af8f] text-[#00af8f] hover:bg-[#00af8f]/10 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
                onClick={() => router.push('/dashboard/senior/announcements')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentAnnouncements.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-[#666666] text-sm sm:text-base">
                No announcements found.
              </div>
            ) : (
              <div className="divide-y max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                {recentAnnouncements.map(announcement => (
                  <div
                    key={announcement.id}
                    className="p-3 sm:p-4 hover:bg-gray-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-[#333333] text-xs sm:text-sm line-clamp-2 flex-1 mr-2">
                        {announcement.title}
                      </h4>
                      {announcement.isUrgent && (
                        <Badge className="bg-red-500 text-white text-xs flex-shrink-0">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-[#666666] text-xs sm:text-sm mb-2 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="text-xs text-[#888888]">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments - Mobile Responsive */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-600/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
                <span>Upcoming Appointments</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-500 hover:bg-blue-500/10 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
                onClick={() => router.push('/dashboard/senior/appointments')}>
                Schedule New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingAppointments.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-[#666666] text-sm sm:text-base">
                No upcoming appointments.
              </div>
            ) : (
              <div className="divide-y max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                {upcomingAppointments.map(appointment => (
                  <div key={appointment.id} className="p-3 sm:p-4 hover:bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-[#333333] text-xs sm:text-sm line-clamp-1 flex-1 mr-2">
                        {appointment.type}
                      </h4>
                      <Badge
                        className={
                          appointment.status === 'approved'
                            ? 'bg-green-500 text-white'
                            : 'bg-yellow-500 text-white'
                        }>
                        {appointment.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm text-[#666666]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
                        <span>{appointment.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                        <span>{appointment.time}</span>
                      </div>
                      {appointment.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span className="truncate">{appointment.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Requests and Benefits - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Document Requests - Mobile Responsive */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-600/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-purple-500" />
                <span>Document Requests</span>
                <Badge className="ml-2 bg-purple-500/10 text-purple-500 text-xs">
                  {documentRequests.length} items
                </Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500 text-purple-500 hover:bg-purple-500/10 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
                onClick={() => router.push('/dashboard/senior/documents')}>
                New Request
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {documentRequests.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-[#666666] text-sm sm:text-base">
                No document requests found.
              </div>
            ) : (
              <div className="divide-y max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                {documentRequests.map(request => (
                  <div key={request.id} className="p-3 sm:p-4 hover:bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-[#333333] text-xs sm:text-sm capitalize line-clamp-1 flex-1 mr-2">
                        {request.type.replace('_', ' ')}
                      </h4>
                      <Badge
                        className={
                          request.status === 'approved'
                            ? 'bg-green-500 text-white'
                            : 'bg-yellow-500 text-white'
                        }>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#888888]">
                      Requested: {new Date(request.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits - Mobile Responsive */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-600/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Gift className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" />
                <span>My Benefits</span>
                <Badge className="ml-2 bg-green-500/10 text-green-500 text-xs">
                  {benefits.length} items
                </Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-500 hover:bg-green-500/10 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
                onClick={() => router.push('/dashboard/senior/benefits')}>
                Apply Now
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {benefits.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-[#666666] text-sm sm:text-base">
                No benefits found.
              </div>
            ) : (
              <div className="divide-y max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                {benefits.map(benefit => (
                  <div key={benefit.id} className="p-3 sm:p-4 hover:bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-[#333333] text-xs sm:text-sm capitalize line-clamp-1 flex-1 mr-2">
                        {benefit.name}
                      </h4>
                      <Badge
                        className={
                          benefit.status === 'active'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-500 text-white'
                        }>
                        {benefit.status}
                      </Badge>
                    </div>
                    {benefit.amount && (
                      <div className="text-sm sm:text-lg font-semibold text-green-600 mb-1">
                        {benefit.amount}
                      </div>
                    )}
                    {benefit.nextPayment && (
                      <div className="text-xs text-[#888888]">
                        Next payment: {benefit.nextPayment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Mobile Responsive */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="w-4 sm:w-5 h-4 sm:h-5 text-[#00af8f]" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Button
              className="bg-[#00af8f] hover:bg-[#009b7f] text-white h-12 sm:h-16 text-xs sm:text-base font-medium flex flex-col sm:flex-row items-center gap-1 sm:gap-2"
              onClick={() => router.push('/dashboard/senior/documents')}>
              <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-center">Request Document</span>
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white h-12 sm:h-16 text-xs sm:text-base font-medium flex flex-col sm:flex-row items-center gap-1 sm:gap-2"
              onClick={() => router.push('/dashboard/senior/appointments')}>
              <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-center">Schedule Appointment</span>
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600 text-white h-12 sm:h-16 text-xs sm:text-base font-medium flex flex-col sm:flex-row items-center gap-1 sm:gap-2"
              onClick={() => router.push('/dashboard/senior/announcements')}>
              <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-center">View Announcements</span>
            </Button>
            <Button
              className="bg-gray-600 hover:bg-gray-700 text-white h-12 sm:h-16 text-xs sm:text-base font-medium flex flex-col sm:flex-row items-center gap-1 sm:gap-2"
              onClick={() => router.push('/dashboard/senior/profile')}>
              <User className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-center">Update Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
