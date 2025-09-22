import { supabase } from '@/lib/supabase';
import { NotificationService } from '@/lib/services/notifications';

export interface BenefitApplication {
  id: string;
  senior_citizen_id: string;
  benefit_type:
    | 'social_pension'
    | 'health_assistance'
    | 'food_assistance'
    | 'transportation'
    | 'utility_subsidy'
    | 'other';
  application_date: string;
  status:
    | 'pending'
    | 'approved'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'rejected';
  amount_requested?: number;
  amount_approved?: number;
  purpose: string;
  notes?: string;
  priority_level?: 'low' | 'medium' | 'high' | 'urgent';
  required_by_date?: string;
  requirements?: string[];
  follow_up_required?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;

  // Joined senior citizen data
  senior_name?: string;
  senior_age?: number;
  senior_phone?: string;
  senior_barangay?: string;
  senior_gender?: string;

  // Benefit schedule data
  scheduled_date?: string;
  scheduled_time?: string;
  scheduled_location?: string;
  scheduled_notes?: string;

  // Attachments
  attachments?: BenefitAttachment[];
}

export interface BenefitAttachment {
  id: string;
  benefit_application_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface BenefitFormData {
  senior_citizen_id: string;
  benefit_type:
    | 'social_pension'
    | 'health_assistance'
    | 'food_assistance'
    | 'transportation'
    | 'utility_subsidy'
    | 'other';
  amount_requested?: number;
  purpose: string;
  notes?: string;
  priority_level?: 'low' | 'medium' | 'high' | 'urgent';
  required_by_date?: string;
  requirements?: string[];
  follow_up_required?: boolean;
  scheduled_date?: string;
  scheduled_time?: string;
  scheduled_location?: string;
  scheduled_notes?: string;
}

export interface BenefitFilters {
  status?: string;
  type?: string;
  date_range?: string;
  barangay?: string;
  search?: string;
  priority?: string;
}

export interface BenefitStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  cancelled: number;
  rejected: number;
  total_amount_requested: number;
  total_amount_approved: number;
  this_month: number;
  urgent: number;
}

export interface BenefitSchedule {
  id: string;
  benefit_application_id: string;
  scheduled_date: string;
  scheduled_time: string;
  location: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  created_at: string;
  updated_at: string;
}

export class BenefitsAPI {
  // Get all benefit applications with filters
  static async getBenefitApplications(
    filters?: BenefitFilters
  ): Promise<BenefitApplication[]> {
    try {
      // Check if tables exist first
      const { data: tableCheck, error: tableError } = await supabase
        .from('benefit_applications')
        .select('id')
        .limit(1);

      if (tableError && tableError.code === 'PGRST200') {
        console.warn('Benefits tables not yet created. Returning empty array.');
        return [];
      }

      let query = supabase
        .from('benefit_applications')
        .select(
          `
          *,
          senior_citizens!inner (
            id,
            barangay,
            date_of_birth,
            gender,
            users!senior_citizens_user_id_fkey (
              first_name,
              last_name,
              phone
            )
          ),
          benefit_attachments (
            id,
            file_name,
            file_url,
            file_type,
            file_size,
            uploaded_at
          )
        `
        )
        .order('application_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('benefit_type', filters.type);
      }

      if (filters?.barangay && filters.barangay !== 'all') {
        query = query.eq('senior_citizens.barangay', filters.barangay);
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority_level', filters.priority);
      }

      if (filters?.date_range) {
        const today = new Date();
        switch (filters.date_range) {
          case 'today':
            const todayStr = today.toISOString().split('T')[0];
            query = query.eq('application_date', todayStr);
            break;
          case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - 7);
            query = query
              .gte('application_date', weekStart.toISOString().split('T')[0])
              .lte('application_date', today.toISOString().split('T')[0]);
            break;
          case 'month':
            const monthStart = new Date(today);
            monthStart.setMonth(monthStart.getMonth() - 1);
            query = query
              .gte('application_date', monthStart.toISOString().split('T')[0])
              .lte('application_date', today.toISOString().split('T')[0]);
            break;
        }
      }

      const { data: allData, error } = await query;

      if (error) throw error;

      let filteredData: any[] = allData || [];

      // Apply client-side search filtering
      if (filters?.search) {
        const searchTerm = filters.search.trim().toLowerCase();
        filteredData = filteredData.filter(application => {
          const senior = application.senior_citizens;
          const user = Array.isArray(senior?.users)
            ? senior.users[0]
            : senior?.users;

          const firstName = user?.first_name?.toLowerCase() || '';
          const lastName = user?.last_name?.toLowerCase() || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const purpose = application.purpose?.toLowerCase() || '';
          const notes = application.notes?.toLowerCase() || '';
          const benefitType = application.benefit_type?.toLowerCase() || '';

          return (
            firstName.includes(searchTerm) ||
            lastName.includes(searchTerm) ||
            fullName.includes(searchTerm) ||
            purpose.includes(searchTerm) ||
            notes.includes(searchTerm) ||
            benefitType.includes(searchTerm)
          );
        });
      }

      return (
        filteredData?.map(application => {
          const senior = application.senior_citizens;
          const user = senior.users;

          return {
            ...application,
            senior_name: `${user.first_name} ${user.last_name}`,
            senior_age:
              new Date().getFullYear() -
              new Date(senior.date_of_birth).getFullYear(),
            senior_phone: user.phone,
            senior_barangay: senior.barangay,
            senior_gender: senior.gender,
            attachments: application.benefit_attachments || []
          };
        }) || []
      );
    } catch (error) {
      console.error('Error fetching benefit applications:', error);
      throw new Error('Failed to fetch benefit applications');
    }
  }

  // Get benefit application by ID
  static async getBenefitApplicationById(
    id: string
  ): Promise<BenefitApplication> {
    try {
      const { data, error } = await supabase
        .from('benefit_applications')
        .select(
          `
          *,
          senior_citizens!inner (
            id,
            barangay,
            date_of_birth,
            gender,
            users!senior_citizens_user_id_fkey (
              first_name,
              last_name,
              phone
            )
          ),
          benefit_attachments (
            id,
            file_name,
            file_url,
            file_type,
            file_size,
            uploaded_at
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;

      const senior = data.senior_citizens;
      const user = senior.users;

      return {
        ...data,
        senior_name: `${user.first_name} ${user.last_name}`,
        senior_age:
          new Date().getFullYear() -
          new Date(senior.date_of_birth).getFullYear(),
        senior_phone: user.phone,
        senior_barangay: senior.barangay,
        senior_gender: senior.gender,
        attachments: data.benefit_attachments || []
      };
    } catch (error) {
      console.error('Error fetching benefit application:', error);
      throw new Error('Failed to fetch benefit application');
    }
  }

  // Create new benefit application
  static async createBenefitApplication(
    applicationData: BenefitFormData
  ): Promise<BenefitApplication> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('benefit_applications')
        .insert([
          {
            senior_citizen_id: applicationData.senior_citizen_id,
            benefit_type: applicationData.benefit_type,
            application_date: new Date().toISOString().split('T')[0],
            status: 'pending',
            amount_requested: applicationData.amount_requested || null,
            purpose: applicationData.purpose,
            notes: applicationData.notes || null,
            priority_level: applicationData.priority_level || 'medium',
            required_by_date: applicationData.required_by_date || null,
            requirements: applicationData.requirements || [],
            follow_up_required: applicationData.follow_up_required || false,
            scheduled_date: applicationData.scheduled_date || null,
            scheduled_time: applicationData.scheduled_time || null,
            scheduled_location: applicationData.scheduled_location || null,
            scheduled_notes: applicationData.scheduled_notes || null,
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Fetch the complete application with senior citizen details
      const applications = await this.getBenefitApplications();
      const newApplication = applications.find(app => app.id === data.id);

      if (!newApplication)
        throw new Error('Failed to retrieve created benefit application');

      return newApplication;
    } catch (error) {
      console.error('Error creating benefit application:', error);
      throw new Error('Failed to create benefit application');
    }
  }

  // Update benefit application
  static async updateBenefitApplication(
    id: string,
    updates: Partial<BenefitFormData>
  ): Promise<BenefitApplication> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('benefit_applications')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Fetch the complete application with senior citizen details
      const applications = await this.getBenefitApplications();
      const updatedApplication = applications.find(app => app.id === id);

      if (!updatedApplication)
        throw new Error('Failed to retrieve updated benefit application');

      return updatedApplication;
    } catch (error) {
      console.error('Error updating benefit application:', error);
      throw new Error('Failed to update benefit application');
    }
  }

  // Update benefit application status
  static async updateBenefitApplicationStatus(
    id: string,
    status: string,
    amountApproved?: number
  ): Promise<void> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };

      if (amountApproved !== undefined) {
        updateData.amount_approved = amountApproved;
      }

      const { error } = await supabase
        .from('benefit_applications')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      // Send notification if status changed
      try {
        const application = await this.getBenefitApplicationById(id);
        await NotificationService.sendStatusUpdateNotification({
          seniorName: application.senior_name || 'Senior Citizen',
          seniorPhone: application.senior_phone || '',
          seniorEmail: '', // Add email if available
          applicationType: 'benefit',
          applicationId: id,
          currentStatus: status,
          applicationDetails: {
            benefitType: application.benefit_type,
            amountRequested: application.amount_requested,
            amountApproved: application.amount_approved
          }
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't throw error for notification failures
      }
    } catch (error) {
      console.error('Error updating benefit application status:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Database error (${error.code}): ${error.message}`);
      }
      throw new Error('Failed to update benefit application status');
    }
  }

  // Delete benefit application
  static async deleteBenefitApplication(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('benefit_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting benefit application:', error);
      throw new Error('Failed to delete benefit application');
    }
  }

  // Get benefit application statistics
  static async getBenefitApplicationStats(): Promise<BenefitStats> {
    try {
      // Check if tables exist first
      const { data: tableCheck, error: tableError } = await supabase
        .from('benefit_applications')
        .select('id')
        .limit(1);

      if (tableError && tableError.code === 'PGRST200') {
        console.warn(
          'Benefits tables not yet created. Returning default stats.'
        );
        return {
          total: 0,
          pending: 0,
          approved: 0,
          completed: 0,
          cancelled: 0,
          rejected: 0,
          total_amount_requested: 0,
          total_amount_approved: 0,
          this_month: 0,
          urgent: 0
        };
      }

      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const [
        totalResult,
        pendingResult,
        approvedResult,
        completedResult,
        cancelledResult,
        rejectedResult,
        monthResult,
        urgentResult,
        amountRequestedResult,
        amountApprovedResult
      ] = await Promise.all([
        supabase
          .from('benefit_applications')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('benefit_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('benefit_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('benefit_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed'),
        supabase
          .from('benefit_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'cancelled'),
        supabase
          .from('benefit_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected'),
        supabase
          .from('benefit_applications')
          .select('*', { count: 'exact', head: true })
          .gte('application_date', monthStartStr),
        supabase
          .from('benefit_applications')
          .select('*', { count: 'exact', head: true })
          .eq('priority_level', 'urgent'),
        supabase
          .from('benefit_applications')
          .select('amount_requested')
          .not('amount_requested', 'is', null),
        supabase
          .from('benefit_applications')
          .select('amount_approved')
          .not('amount_approved', 'is', null)
      ]);

      const totalAmountRequested =
        amountRequestedResult.data?.reduce(
          (sum, app) => sum + (app.amount_requested || 0),
          0
        ) || 0;

      const totalAmountApproved =
        amountApprovedResult.data?.reduce(
          (sum, app) => sum + (app.amount_approved || 0),
          0
        ) || 0;

      return {
        total: totalResult.count || 0,
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        completed: completedResult.count || 0,
        cancelled: cancelledResult.count || 0,
        rejected: rejectedResult.count || 0,
        total_amount_requested: totalAmountRequested,
        total_amount_approved: totalAmountApproved,
        this_month: monthResult.count || 0,
        urgent: urgentResult.count || 0
      };
    } catch (error) {
      console.error('Error fetching benefit application stats:', error);
      throw new Error('Failed to fetch benefit application statistics');
    }
  }

  // Upload benefit application attachment
  static async uploadBenefitAttachment(
    benefitApplicationId: string,
    file: File
  ): Promise<BenefitAttachment> {
    try {
      // Check if tables exist first
      const { data: tableCheck, error: tableError } = await supabase
        .from('benefit_applications')
        .select('id')
        .limit(1);

      if (tableError && tableError.code === 'PGRST200') {
        throw new Error(
          'Database tables not yet created. Please run the migration first.'
        );
      }

      // Get current user
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${benefitApplicationId}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('benefit-attachments')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);

        // Check if it's a policy error
        if (
          uploadError.message.includes('row-level security policy') ||
          uploadError.message.includes('permission denied')
        ) {
          throw new Error(
            'File upload permission denied. Please contact your administrator to fix storage permissions.'
          );
        }

        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl }
      } = supabase.storage.from('benefit-attachments').getPublicUrl(fileName);

      // Save attachment record
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('benefit_attachments')
        .insert([
          {
            benefit_application_id: benefitApplicationId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user.id
          }
        ])
        .select()
        .single();

      if (attachmentError) {
        console.error('Error saving attachment record:', attachmentError);
        throw new Error(
          `Failed to save attachment record: ${attachmentError.message}`
        );
      }

      return attachmentData;
    } catch (error) {
      console.error('Error in uploadBenefitAttachment:', error);
      throw error;
    }
  }

  // Delete benefit application attachment
  static async deleteBenefitAttachment(attachmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('benefit_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting benefit attachment:', error);
      throw new Error('Failed to delete benefit attachment');
    }
  }

  // Get benefit schedules
  static async getBenefitSchedules(): Promise<BenefitSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('benefit_schedules')
        .select('*')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching benefit schedules:', error);
      throw new Error('Failed to fetch benefit schedules');
    }
  }

  // Create benefit schedule
  static async createBenefitSchedule(
    scheduleData: Omit<BenefitSchedule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BenefitSchedule> {
    try {
      const { data, error } = await supabase
        .from('benefit_schedules')
        .insert([scheduleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating benefit schedule:', error);
      throw new Error('Failed to create benefit schedule');
    }
  }

  // Update benefit schedule
  static async updateBenefitSchedule(
    id: string,
    updates: Partial<BenefitSchedule>
  ): Promise<BenefitSchedule> {
    try {
      const { data, error } = await supabase
        .from('benefit_schedules')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating benefit schedule:', error);
      throw new Error('Failed to update benefit schedule');
    }
  }

  // Delete benefit schedule
  static async deleteBenefitSchedule(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('benefit_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting benefit schedule:', error);
      throw new Error('Failed to delete benefit schedule');
    }
  }
}







