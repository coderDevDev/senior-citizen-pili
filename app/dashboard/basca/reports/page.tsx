'use client';

import { useAuth } from '@/hooks/useAuth';
import SharedReportsPage from '@/components/shared-components/reports/page';

export default function BASCAReportsPage() {
  const { authState } = useAuth();
  const userBarangay = authState.user?.barangay;

  return (
    <SharedReportsPage
      role="basca"
      primaryColor="#ffd416"
      userBarangay={userBarangay}
      title="Barangay Reports & Analytics"
      description={`Generate reports and analytics for ${
        userBarangay || 'your barangay'
      }`}
    />
  );
}
