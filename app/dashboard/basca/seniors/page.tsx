'use client';

import { useAuth } from '@/hooks/useAuth';
import SharedSeniorsPage from '@/components/shared-components/seniors/page';

export default function BASCASeniorsPage() {
  const { authState } = useAuth();
  const userBarangay = authState.user?.barangay;

  return (
    <SharedSeniorsPage
      role="basca"
      primaryColor="#ffd416"
      userBarangay={userBarangay}
      title="Senior Citizens"
      description={`Manage senior citizens in ${
        userBarangay || 'your barangay'
      }`}
    />
  );
}
