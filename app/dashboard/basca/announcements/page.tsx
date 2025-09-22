'use client';

import { useAuth } from '@/hooks/useAuth';
import SharedAnnouncementsPage from '@/components/shared-components/announcements/page';

export default function BASCAAnnouncementsPage() {
  const { authState } = useAuth();
  const userBarangay = authState.user?.barangay;

  return (
    <SharedAnnouncementsPage
      role="basca"
      primaryColor="#ffd416"
      userBarangay={userBarangay}
      title="Barangay Announcements"
      description={`Manage announcements for ${
        userBarangay || 'your barangay'
      }`}
    />
  );
}
