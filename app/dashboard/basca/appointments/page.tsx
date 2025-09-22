'use client';

import { useAuth } from '@/hooks/useAuth';
import SharedAppointmentsPage from '@/components/shared-components/appointments/page';

export default function BASCAAppointmentsPage() {
  const { authState } = useAuth();
  const userBarangay = authState.user?.barangay;

  return (
    <SharedAppointmentsPage
      role="basca"
      primaryColor="#ffd416"
      userBarangay={userBarangay}
      title="Barangay Appointments"
      description={`Manage medical appointments for seniors in ${
        userBarangay || 'your barangay'
      }`}
    />
  );
}
