'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { SeniorCitizen } from '@/types/property';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Activity,
  Shield,
  Home,
  Users,
  Heart,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Edit,
  Camera
} from 'lucide-react';

function formatDate(dateString?: string) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function calcAge(dob?: string) {
  if (!dob) return '—';
  const d = new Date(dob);
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return `${age} yrs`;
}

function statusClasses(status?: string) {
  switch ((status || 'active').toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
}

export default function SeniorProfilePage() {
  const { authState } = useAuth();
  const { user } = authState;

  const [data, setData] = useState<SeniorCitizen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fullAddress = useMemo(() => {
    if (!data) return '—';
    const parts = [data.barangay, 'Pili', 'Camarines Sur', 'Region V - Bicol'].filter(Boolean);
    return parts.join(', ');
  }, [data]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      if (!user?.id) throw new Error('User not authenticated');

      const { SeniorCitizensAPI } = await import('@/lib/api/senior-citizens');
      const result = await SeniorCitizensAPI.getAllSeniorCitizens();
      if (!result.success || !result.data) throw new Error('Failed to fetch profile');

      const match = result.data.find((s: any) => s.user_id === user.id);
      if (!match) throw new Error('Your senior profile is not yet registered.');

      const transformed: SeniorCitizen = {
        id: match.id,
        userId: match.user_id,
        firstName: match.first_name,
        lastName: match.last_name,
        barangay: match.barangay,
        barangayCode: match.barangay_code,
        addressData: {
          region: match.region_code
            ? { region_code: match.region_code, region_name: 'Region V - Bicol' }
            : undefined,
          province: match.province_code
            ? { province_code: match.province_code, province_name: 'Camarines Sur' }
            : undefined,
          city: match.city_code
            ? { city_code: match.city_code, city_name: 'Pili' }
            : undefined,
          barangay: match.barangay_code
            ? { brgy_code: match.barangay_code, brgy_name: match.barangay }
            : undefined
        },
        dateOfBirth: match.date_of_birth,
        gender: match.gender,
        address: match.address,
        contactPerson: match.contact_person,
        contactPhone: match.contact_phone,
        contactRelationship: match.contact_relationship,
        medicalConditions: match.medical_conditions || [],
        medications: match.medications || [],
        emergencyContactName: match.emergency_contact_name,
        emergencyContactPhone: match.emergency_contact_phone,
        emergencyContactRelationship: match.emergency_contact_relationship,
        oscaId: match.osca_id,
        seniorIdPhoto: match.senior_id_photo,
        profilePicture: match.profile_picture,
        documents: match.documents || [],
        status: match.status,
        registrationDate: match.registration_date,
        lastMedicalCheckup: match.last_medical_checkup,
        notes: match.notes,
        housingCondition: match.housing_condition,
        physicalHealthCondition: match.physical_health_condition,
        monthlyIncome: match.monthly_income,
        monthlyPension: match.monthly_pension,
        livingCondition: match.living_condition,
        beneficiaries: match.beneficiaries || [],
        createdAt: match.created_at,
        updatedAt: match.updated_at,
        createdBy: match.created_by,
        updatedBy: match.updated_by,
        email: match.users?.email || user.email,
        phone: match.users?.phone || user.phone
      };

      setData(transformed);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || 'Failed to load profile';
      setError(msg);
      toast.error(msg);
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto mb-4"></div>
          <p className="text-[#666666]">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-[#333333]">Profile Not Found</h3>
          <p className="text-[#666666]">{error}</p>
          <Button variant="outline" onClick={() => { setRefreshing(true); load(); }} className="border-[#00af8f] text-[#00af8f] hover:bg-[#00af8f]/10">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#333333]">My Profile</h1>
          <p className="text-sm sm:text-base text-[#666666] mt-1 sm:mt-2">Complete overview of your senior citizen information</p>
          {error && <p className="text-xs sm:text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => { setRefreshing(true); load(); }} disabled={refreshing} className="border-[#00af8f] text-[#00af8f] hover:bg-[#00af8f]/10 text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10">
            <RefreshCw className={`w-3 sm:w-4 h-3 sm:h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Profile Summary - Mobile Responsive */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserIcon className="w-4 sm:w-5 h-4 sm:h-5 text-[#00af8f]" />
            <span>Profile Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-[#E0DDD8]/30 shadow-lg">
                <AvatarImage src={data.profilePicture || ''} alt={`${data.firstName} ${data.lastName}`} />
                <AvatarFallback className="text-xl sm:text-2xl font-bold bg-[#00af8f]/10 text-[#00af8f]">
                  {data.firstName?.[0]}{data.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#333333] truncate">{data.firstName} {data.lastName}</h2>
                <p className="text-sm sm:text-lg text-[#666666]">{calcAge(data.dateOfBirth)}</p>
              </div>
              <div className="flex flex-col gap-2 text-xs sm:text-sm">
                <span className="flex items-center gap-2 flex-wrap"><Shield className="w-3 sm:w-4 h-3 sm:h-4 text-[#00af8f]" /> <span className="truncate">OSCA ID: {data.oscaId || 'Pending'}</span></span>
                <span className="flex items-center gap-2 flex-wrap"><MapPin className="w-3 sm:w-4 h-3 sm:h-4 text-[#00af8f]" /> <span className="truncate">{fullAddress}</span></span>
                <span className="flex items-center gap-2 flex-wrap"><Calendar className="w-3 sm:w-4 h-3 sm:h-4 text-[#00af8f]" /> <span className="truncate">Registered: {formatDate(data.registrationDate)}</span></span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Badge className={`${statusClasses(data.status)} border text-xs sm:text-sm`}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {data.status || 'Active'}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 text-xs sm:text-sm">{(data.physicalHealthCondition || 'Good')} Health</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Personal & Contact - Mobile Responsive */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-[#333333] text-base sm:text-lg">
                <UserIcon className="w-4 sm:w-5 h-4 sm:h-5 text-[#00af8f]" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <div className="text-xs sm:text-sm text-[#666666] mb-1">Full Name</div>
                <div className="font-semibold text-[#333333] text-sm sm:text-base truncate">{data.firstName} {data.lastName}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-[#666666] mb-1">Date of Birth</div>
                <div className="text-[#333333] text-sm sm:text-base">{formatDate(data.dateOfBirth)}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-[#666666] mb-1">Gender</div>
                <div className="text-[#333333] capitalize text-sm sm:text-base">{data.gender}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-[#666666] mb-1">Status</div>
                <Badge className={`${statusClasses(data.status)} border mt-1 text-xs sm:text-sm w-fit`}>{data.status || 'Active'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-600/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-[#333333] text-base sm:text-lg">
                <Phone className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3 sm:w-4 h-3 sm:h-4 text-[#666666] flex-shrink-0" />
                <span className="text-[#333333] text-xs sm:text-sm truncate">{data.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="w-3 sm:w-4 h-3 sm:h-4 text-[#666666] flex-shrink-0" />
                <span className="text-[#333333] text-xs sm:text-sm truncate">{data.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-3 sm:w-4 h-3 sm:h-4 text-[#666666] flex-shrink-0" />
                <span className="text-[#333333] text-xs sm:text-sm truncate">Contact Person: {data.contactPerson || '—'}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="w-3 sm:w-4 h-3 sm:h-4 text-[#666666] flex-shrink-0" />
                <span className="text-[#333333] text-xs sm:text-sm truncate">Contact Phone: {data.contactPhone || '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Address & Health - Mobile Responsive */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-600/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-[#333333] text-base sm:text-lg">
                <Home className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" /> Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              <div className="text-[#333333] text-sm sm:text-base leading-relaxed">{fullAddress}</div>
              <Separator className="bg-[#E0DDD8]/30" />
              <div className="text-xs sm:text-sm text-[#666666]">Additional Details</div>
              <div className="text-[#333333] text-xs sm:text-sm">{data.address || '—'}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-600/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-[#333333] text-base sm:text-lg">
                <Activity className="w-4 sm:w-5 h-4 sm:h-5 text-purple-500" /> Health & Living
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3 text-[#333333]">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm">Physical Health</span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs sm:text-sm">{data.physicalHealthCondition || 'Good'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm">Housing</span>
                  <Badge variant="secondary" className="text-xs sm:text-sm">{data.housingCondition || 'Owned'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm">Living Condition</span>
                  <Badge variant="secondary" className="text-xs sm:text-sm">{data.livingCondition || 'Independent'}</Badge>
                </div>
              </div>
              {data.medicalConditions?.length ? (
                <div>
                  <div className="text-xs sm:text-sm text-[#666666] mb-2">Medical Conditions</div>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {data.medicalConditions.map((m, i) => (
                      <Badge key={i} variant="outline" className="bg-white text-[#666666] border-[#E0DDD8] text-xs">{m}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {data.medications?.length ? (
                <div>
                  <div className="text-xs sm:text-sm text-[#666666] mb-2">Medications</div>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {data.medications.map((m, i) => (
                      <Badge key={i} variant="outline" className="bg-white text-[#666666] border-[#E0DDD8] text-xs">{m}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Beneficiaries - Mobile Responsive */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-500/5 to-amber-600/5 border-b border-[#E0DDD8]/30 pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-[#333333] text-base sm:text-lg">
            <Users className="w-4 sm:w-5 h-4 sm:h-5 text-amber-500" /> Beneficiaries
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {data.beneficiaries && data.beneficiaries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {data.beneficiaries.map((b: any, idx: number) => (
                <div key={idx} className="p-3 sm:p-4 rounded-lg border border-[#E0DDD8]/30 bg-white">
                  <div className="font-semibold text-[#333333] text-sm sm:text-base truncate">{b.name}</div>
                  <div className="text-xs sm:text-sm text-[#666666]">{b.relationship}</div>
                  {b.phone ? (
                    <div className="text-xs sm:text-sm text-[#666666] mt-1 flex items-center gap-2">
                      <Phone className="w-3 sm:w-4 h-3 sm:h-4" />
                      <span className="truncate">{b.phone}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[#666666] text-sm sm:text-base">No beneficiaries listed.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
