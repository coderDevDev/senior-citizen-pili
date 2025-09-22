'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SharedDocumentsPage from '@/components/shared-components/documents/page';

export default function SeniorDocumentsPage() {
  const [userBarangay, setUserBarangay] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserBarangay = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        if (userId) {
          const { data: senior } = await supabase
            .from('senior_citizens')
            .select('barangay')
            .eq('user_id', userId)
            .single();

          setUserBarangay(senior?.barangay || undefined);
        }
      } catch (error) {
        console.error('Error fetching user barangay:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserBarangay();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto mb-4"></div>
          <p className="text-[#666666]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SharedDocumentsPage
      role="senior"
      primaryColor="#00af8f"
      userBarangay={userBarangay}
      title="My Document Requests"
      description="Request and track your document applications"
    />
  );
}
