'use client';

import { useAuth } from '@/hooks/useAuth';
import SharedUsersPage from '@/components/shared-components/users/page';

export default function BASCAUsersPage() {
  const { authState } = useAuth();
  const userBarangay = authState.user?.barangay;

  return (
    <SharedUsersPage
      role="basca"
      primaryColor="#ffd416"
      userBarangay={userBarangay}
      title="BASCA Accounts"
      description={`Manage BASCA member accounts in ${
        userBarangay || 'your barangay'
      }`}
    />
  );
}
