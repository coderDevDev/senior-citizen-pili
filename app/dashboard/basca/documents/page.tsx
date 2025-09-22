'use client';

import { useAuth } from '@/hooks/useAuth';
import SharedDocumentsPage from '@/components/shared-components/documents/page';

export default function BASCADocumentsPage() {
  const { authState } = useAuth();
  const userBarangay = authState.user?.barangay;

  return (
    <SharedDocumentsPage
      role="basca"
      primaryColor="#ffd416"
      userBarangay={userBarangay}
      title="Document Requests"
      description={`Process document requests for seniors in ${
        userBarangay || 'your barangay'
      }`}
    />
  );
}
