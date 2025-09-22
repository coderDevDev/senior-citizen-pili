import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export interface DashboardStats {
  totalSeniors: number;
  activeSeniors: number;
  inactiveSeniors: number;
  deceasedSeniors: number;
  newThisMonth: number;
  pendingRequests: number;
  pendingAppointments: number;
  totalBarangays: number;
  recentRegistrations: Array<{
    id: string;
    name: string;
    barangay: string;
    age: number;
    registrationDate: string;
  }>;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    isUrgent: boolean;
    createdAt: string;
    targetBarangay: string | null;
  }>;
  barangayStats: Array<{
    barangay: string;
    totalSeniors: number;
    activeSeniors: number;
    newThisMonth: number;
  }>;
  monthlyRegistrations: Array<{
    month: string;
    count: number;
  }>;
  healthConditionStats: Array<{
    condition: string;
    count: number;
    percentage: number;
  }>;
  ageGroupStats: Array<{
    ageGroup: string;
    count: number;
    percentage: number;
  }>;
}

export class DashboardAPI {
  // Lightweight version for sidebar stats only
  static async getSidebarStats(): Promise<{
    totalSeniors: number;
    pendingAnnouncements: number;
    pendingAppointments: number;
    pendingDocuments: number;
  }> {
    try {
      const [
        totalResult,
        urgentAnnouncementsResult,
        pendingAppointmentsResult,
        pendingDocumentsResult
      ] = await Promise.all([
        supabase
          .from('senior_citizens')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('announcements')
          .select('*', { count: 'exact', head: true })
          .eq('is_urgent', true),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('document_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      ]);

      return {
        totalSeniors: totalResult.count || 0,
        pendingAnnouncements: urgentAnnouncementsResult.count || 0,
        pendingAppointments: pendingAppointmentsResult.count || 0,
        pendingDocuments: pendingDocumentsResult.count || 0
      };
    } catch (error) {
      console.error('Error fetching sidebar stats:', error);
      // Return fallback data
      return {
        totalSeniors: 0,
        pendingAnnouncements: 0,
        pendingAppointments: 0,
        pendingDocuments: 0
      };
    }
  }

  static async getBASCADashboardStats(
    barangay: string
  ): Promise<DashboardStats> {
    try {
      // Get current date for monthly calculations
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const firstDayOfMonth = new Date(
        currentYear,
        currentMonth,
        1
      ).toISOString();

      // Get barangay-specific senior citizens
      const { data: seniors, error: seniorsError } = await supabase
        .from('senior_citizens')
        .select('*')
        .eq('barangay', barangay);

      if (seniorsError) {
        console.error('Error fetching barangay seniors:', seniorsError);
        throw new Error('Failed to fetch barangay senior citizens');
      }

      // Calculate barangay-specific stats
      const totalSeniors = seniors?.length || 0;
      const activeSeniors =
        seniors?.filter(s => s.status === 'active').length || 0;
      const inactiveSeniors =
        seniors?.filter(s => s.status === 'inactive').length || 0;
      const deceasedSeniors =
        seniors?.filter(s => s.status === 'deceased').length || 0;

      // New registrations this month (barangay-specific)
      const newThisMonth =
        seniors?.filter(s => {
          const regDate = new Date(s.registration_date || s.created_at);
          return (
            regDate.getMonth() === currentMonth &&
            regDate.getFullYear() === currentYear
          );
        }).length || 0;

      // Get barangay-specific appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .in('senior_citizen_id', seniors?.map(s => s.id) || [])
        .eq('status', 'pending');

      const pendingAppointments = appointments?.length || 0;

      // Get barangay-specific document requests
      const { data: documents } = await supabase
        .from('document_requests')
        .select('*')
        .in('senior_citizen_id', seniors?.map(s => s.id) || [])
        .in('status', ['pending', 'in_progress']);

      const pendingRequests = documents?.length || 0;

      // Get recent registrations (barangay-specific)
      const recentRegistrations =
        seniors
          ?.sort(
            (a, b) =>
              new Date(b.registration_date || b.created_at).getTime() -
              new Date(a.registration_date || a.created_at).getTime()
          )
          .slice(0, 5)
          .map(senior => ({
            id: senior.id,
            name: `${senior.first_name} ${senior.last_name}`,
            barangay: senior.barangay,
            age: senior.date_of_birth
              ? Math.floor(
                  (Date.now() - new Date(senior.date_of_birth).getTime()) /
                    (365.25 * 24 * 60 * 60 * 1000)
                )
              : 0,
            registrationDate: senior.registration_date || senior.created_at
          })) || [];

      // Get barangay-specific announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .or(`target_barangay.eq.${barangay},target_barangay.is.null`)
        .order('created_at', { ascending: false })
        .limit(5);

      const recentAnnouncements =
        announcements?.map(announcement => ({
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          type: announcement.type,
          isUrgent: announcement.is_urgent || false,
          createdAt: announcement.created_at,
          targetBarangay: announcement.target_barangay
        })) || [];

      return {
        totalSeniors,
        activeSeniors,
        inactiveSeniors,
        deceasedSeniors,
        newThisMonth,
        pendingRequests,
        pendingAppointments,
        totalBarangays: 1, // BASCA users only see their barangay
        recentRegistrations,
        recentAnnouncements,
        barangayStats: [
          {
            barangay,
            totalSeniors,
            activeSeniors,
            newThisMonth
          }
        ],
        monthlyRegistrations: [], // Can be implemented later if needed
        healthConditionStats: [], // Can be implemented later if needed
        ageGroupStats: [] // Can be implemented later if needed
      };
    } catch (error) {
      console.error('Error fetching BASCA dashboard stats:', error);
      throw error;
    }
  }

  static async getOSCADashboardStats(): Promise<DashboardStats> {
    try {
      // Get current date for monthly calculations
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const firstDayOfMonth = new Date(
        currentYear,
        currentMonth,
        1
      ).toISOString();

      // Use Promise.all for parallel execution to improve performance
      const [
        totalSeniorsResult,
        activeSeniorsResult,
        inactiveSeniorsResult,
        deceasedSeniorsResult,
        newThisMonthResult,
        pendingDocRequestsResult,
        pendingAppointmentsResult,
        announcementsResult,
        recentSeniorsResult
      ] = await Promise.all([
        // Count queries for better performance
        supabase
          .from('senior_citizens')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('senior_citizens')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('senior_citizens')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'inactive'),
        supabase
          .from('senior_citizens')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'deceased'),
        supabase
          .from('senior_citizens')
          .select('*', { count: 'exact', head: true })
          .gte('registration_date', firstDayOfMonth),
        supabase
          .from('document_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('senior_citizens')
          .select(
            'id, first_name, last_name, barangay, date_of_birth, registration_date, created_at'
          )
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Check for errors
      if (totalSeniorsResult.error)
        throw new Error(
          `Failed to fetch total seniors: ${totalSeniorsResult.error.message}`
        );
      if (activeSeniorsResult.error)
        throw new Error(
          `Failed to fetch active seniors: ${activeSeniorsResult.error.message}`
        );
      if (inactiveSeniorsResult.error)
        throw new Error(
          `Failed to fetch inactive seniors: ${inactiveSeniorsResult.error.message}`
        );
      if (deceasedSeniorsResult.error)
        throw new Error(
          `Failed to fetch deceased seniors: ${deceasedSeniorsResult.error.message}`
        );
      if (newThisMonthResult.error)
        throw new Error(
          `Failed to fetch new seniors: ${newThisMonthResult.error.message}`
        );
      if (pendingDocRequestsResult.error)
        throw new Error(
          `Failed to fetch pending documents: ${pendingDocRequestsResult.error.message}`
        );
      if (pendingAppointmentsResult.error)
        throw new Error(
          `Failed to fetch pending appointments: ${pendingAppointmentsResult.error.message}`
        );
      if (announcementsResult.error)
        throw new Error(
          `Failed to fetch announcements: ${announcementsResult.error.message}`
        );
      if (recentSeniorsResult.error)
        throw new Error(
          `Failed to fetch recent seniors: ${recentSeniorsResult.error.message}`
        );

      // Extract counts and data
      const totalSeniors = totalSeniorsResult.count || 0;
      const activeSeniors = activeSeniorsResult.count || 0;
      const inactiveSeniors = inactiveSeniorsResult.count || 0;
      const deceasedSeniors = deceasedSeniorsResult.count || 0;
      const newThisMonth = newThisMonthResult.count || 0;
      const pendingDocuments = pendingDocRequestsResult.count || 0;
      const pendingAppointments = pendingAppointmentsResult.count || 0;
      const announcements = announcementsResult.data || [];
      const recentSeniors = recentSeniorsResult.data || [];

      // Get unique barangays for additional stats
      const { data: barangaysData, error: barangaysError } = await supabase
        .from('senior_citizens')
        .select('barangay')
        .not('barangay', 'is', null);

      if (barangaysError) {
        console.warn('Failed to fetch barangays:', barangaysError.message);
      }

      const uniqueBarangays = Array.from(
        new Set(barangaysData?.map(s => s.barangay) || [])
      );
      const totalBarangays = uniqueBarangays.length;

      // Recent registrations (last 10)
      const recentRegistrations = recentSeniors.map(s => {
        const birthDate = new Date(s.date_of_birth);
        const age = currentDate.getFullYear() - birthDate.getFullYear();

        return {
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          barangay: s.barangay,
          age: age,
          registrationDate: s.registration_date || s.created_at
        };
      });

      // Recent announcements
      const recentAnnouncements = announcements.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        type: a.type || 'general',
        isUrgent: a.is_urgent || false,
        createdAt: a.created_at,
        targetBarangay: a.target_barangay
      }));

      // Simplified barangay stats - fetch only what's needed for display
      const barangayStats = uniqueBarangays
        .map(barangay => ({
          barangay,
          totalSeniors: 0, // Will be calculated if needed
          activeSeniors: 0, // Will be calculated if needed
          newThisMonth: 0 // Will be calculated if needed
        }))
        .slice(0, 10); // Limit to top 10 for performance

      // Simple monthly registrations (just last 6 months with mock data for now)
      const monthlyRegistrations = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentYear, currentMonth - i, 1);
        monthlyRegistrations.push({
          month: monthDate.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
          }),
          count: Math.floor(Math.random() * 20) + 5 // Mock data for now
        });
      }

      // Simplified health condition stats (mock data for performance)
      const healthConditionStats = [
        {
          condition: 'Good',
          count: Math.floor(totalSeniors * 0.4),
          percentage: 40
        },
        {
          condition: 'Fair',
          count: Math.floor(totalSeniors * 0.3),
          percentage: 30
        },
        {
          condition: 'Excellent',
          count: Math.floor(totalSeniors * 0.2),
          percentage: 20
        },
        {
          condition: 'Poor',
          count: Math.floor(totalSeniors * 0.1),
          percentage: 10
        }
      ];

      // Simplified age group stats (mock data for performance)
      const ageGroupStats = [
        {
          ageGroup: '65-69',
          count: Math.floor(totalSeniors * 0.25),
          percentage: 25
        },
        {
          ageGroup: '70-74',
          count: Math.floor(totalSeniors * 0.3),
          percentage: 30
        },
        {
          ageGroup: '75-79',
          count: Math.floor(totalSeniors * 0.25),
          percentage: 25
        },
        {
          ageGroup: '80-84',
          count: Math.floor(totalSeniors * 0.15),
          percentage: 15
        },
        {
          ageGroup: '85+',
          count: Math.floor(totalSeniors * 0.05),
          percentage: 5
        }
      ];

      return {
        totalSeniors,
        activeSeniors,
        inactiveSeniors,
        deceasedSeniors,
        newThisMonth,
        pendingRequests: pendingDocuments + pendingAppointments,
        pendingAppointments,
        totalBarangays,
        recentRegistrations,
        recentAnnouncements,
        barangayStats,
        monthlyRegistrations,
        healthConditionStats,
        ageGroupStats
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}
