'use client';

import { useAuth } from '@/hooks/useAuth';
import SharedBenefitsPage from '@/components/shared-components/benefits/page';

export default function BASCABenefitsPage() {
  const { authState } = useAuth();
  const userBarangay = authState.user?.barangay;

  return (
    <SharedBenefitsPage
      role="basca"
      primaryColor="#ffd416"
      userBarangay={userBarangay}
      title="Benefits Management"
      description={`Manage benefit applications for seniors in ${
        userBarangay || 'your barangay'
      }`}
    />
  );
}


