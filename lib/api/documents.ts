import { supabase } from '@/lib/supabase';
import { config, validateEnvironment } from '@/lib/config';
import { NotificationService } from '@/lib/services/notifications';

// Validate environment on module load
validateEnvironment();

// Create a service client for admin operations that bypass RLS
// const supabaseAdmin = createClient<Database>(
//   config.supabase.url,
//   config.supabase.serviceRoleKey
// );

export interface DocumentRequest {
  id: string;
  senior_citizen_id: string;
  document_type:
    | 'osca_id'
    | 'medical_certificate'
    | 'endorsement_letter'
    | 'birth_certificate'
    | 'barangay_clearance';
  purpose: string;
  notes?: string;
  priority_level: 'low' | 'medium' | 'high' | 'urgent';
  status:
    | 'pending'
    | 'approved'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'ready_for_pickup';
  required_by_date?: string;
  requirements: string[];
  follow_up_required: boolean;
  assigned_staff?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;

  // Joined senior citizen data
  senior_name?: string;
  senior_phone?: string;
  senior_barangay?: string;
  senior_age?: number;
  senior_gender?: string;

  // Document attachments
  attachments?: DocumentAttachment[];
}

export interface DocumentAttachment {
  id: string;
  document_request_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface DocumentFormData {
  senior_citizen_id: string;
  document_type:
    | 'osca_id'
    | 'medical_certificate'
    | 'endorsement_letter'
    | 'birth_certificate'
    | 'barangay_clearance';
  purpose: string;
  notes?: string;
  priority_level: 'low' | 'medium' | 'high' | 'urgent';
  required_by_date?: string;
  requirements: string[];
  follow_up_required: boolean;
}

export interface DocumentFilters {
  status?: string;
  type?: string;
  barangay?: string;
  priority?: string;
  search?: string;
  date_range?: string;
  assigned_staff?: string;
}

export interface DocumentStats {
  total: number;
  pending: number;
  approved: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  ready_for_pickup: number;
  urgent: number;
  overdue: number;
}

export class DocumentsAPI {
  // Get all document requests with optional filters
  static async getDocumentRequests(
    filters?: DocumentFilters
  ): Promise<DocumentRequest[]> {
    try {
      // Check if tables exist first
      const { data: tableCheck, error: tableError } = await supabase
        .from('document_requests')
        .select('id')
        .limit(1);

      if (tableError && tableError.code === 'PGRST200') {
        console.log(
          'Document requests table does not exist yet. Returning empty array.'
        );
        return [];
      }

      let query = supabase
        .from('document_requests')
        .select(
          `
          *,
          senior_citizens!inner(
            id,
            first_name,
            last_name,
            contact_phone,
            barangay,
            date_of_birth,
            gender
          ),
          document_attachments(
            id,
            file_name,
            file_url,
            file_type,
            file_size,
            uploaded_by,
            uploaded_at
          )
        `
        )
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('document_type', filters.type);
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority_level', filters.priority);
      }

      if (filters?.barangay && filters.barangay !== 'all') {
        query = query.eq('senior_citizens.barangay', filters.barangay);
      }

      if (filters?.assigned_staff && filters.assigned_staff !== 'all') {
        query = query.eq('assigned_staff', filters.assigned_staff);
      }

      if (filters?.search) {
        query = query.or(
          `purpose.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,senior_citizens.first_name.ilike.%${filters.search}%,senior_citizens.last_name.ilike.%${filters.search}%`
        );
      }

      // Date range filters
      if (filters?.date_range) {
        const now = new Date();
        switch (filters.date_range) {
          case 'today':
            const today = now.toISOString().split('T')[0];
            query = query.eq('created_at::date', today);
            break;
          case 'tomorrow':
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0];
            query = query.eq('created_at::date', tomorrow);
            break;
          case 'week':
            const weekAgo = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString();
            query = query.gte('created_at', weekAgo);
            break;
          case 'month':
            const monthAgo = new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString();
            query = query.gte('created_at', monthAgo);
            break;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching document requests:', error);
        throw new Error(`Failed to fetch document requests: ${error.message}`);
      }

      // Transform the data to include joined senior citizen information
      return (
        data?.map(request => ({
          ...request,
          senior_name: request.senior_citizens
            ? `${request.senior_citizens.first_name} ${request.senior_citizens.last_name}`
            : '',
          senior_phone: request.senior_citizens?.contact_phone || '',
          senior_barangay: request.senior_citizens?.barangay || '',
          senior_age: request.senior_citizens?.date_of_birth
            ? new Date().getFullYear() -
              new Date(request.senior_citizens.date_of_birth).getFullYear()
            : 0,
          senior_gender: request.senior_citizens?.gender || '',
          attachments: request.document_attachments || []
        })) || []
      );
    } catch (error) {
      console.error('Error in getDocumentRequests:', error);
      throw error;
    }
  }

  // Get document request by ID
  static async getDocumentRequestById(id: string): Promise<DocumentRequest> {
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .select(
          `
          *,
          senior_citizens!inner(
            id,
            first_name,
            last_name,
            contact_phone,
            barangay,
            date_of_birth,
            gender
          ),
          document_attachments(
            id,
            file_name,
            file_url,
            file_type,
            file_size,
            uploaded_by,
            uploaded_at
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching document request:', error);
        throw new Error(`Failed to fetch document request: ${error.message}`);
      }

      return {
        ...data,
        senior_name: data.senior_citizens
          ? `${data.senior_citizens.first_name} ${data.senior_citizens.last_name}`
          : '',
        senior_phone: data.senior_citizens?.contact_phone || '',
        senior_barangay: data.senior_citizens?.barangay || '',
        senior_age: data.senior_citizens?.date_of_birth
          ? new Date().getFullYear() -
            new Date(data.senior_citizens.date_of_birth).getFullYear()
          : 0,
        senior_gender: data.senior_citizens?.gender || '',
        attachments: data.document_attachments || []
      };
    } catch (error) {
      console.error('Error in getDocumentRequestById:', error);
      throw error;
    }
  }

  // Create new document request
  static async createDocumentRequest(
    data: DocumentFormData
  ): Promise<DocumentRequest> {
    try {
      // Check if tables exist first
      const { data: tableCheck, error: tableError } = await supabase
        .from('document_requests')
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

      const documentData = {
        senior_citizen_id: data.senior_citizen_id,
        document_type: data.document_type,
        purpose: data.purpose,
        notes: data.notes,
        priority_level: data.priority_level,
        required_by_date: data.required_by_date,
        requirements: data.requirements,
        follow_up_required: data.follow_up_required,
        status: 'pending' as const,
        created_by: user.id
      };

      const { data: newRequest, error } = await supabase
        .from('document_requests')
        .insert([documentData])
        .select(
          `
          *,
          senior_citizens!inner(
            id,
            first_name,
            last_name,
            contact_phone,
            barangay,
            date_of_birth,
            gender
          )
        `
        )
        .single();

      if (error) {
        console.error('Error creating document request:', error);
        throw new Error(`Failed to create document request: ${error.message}`);
      }

      return {
        ...newRequest,
        senior_name: newRequest.senior_citizens
          ? `${newRequest.senior_citizens.first_name} ${newRequest.senior_citizens.last_name}`
          : '',
        senior_phone: newRequest.senior_citizens?.contact_phone || '',
        senior_barangay: newRequest.senior_citizens?.barangay || '',
        senior_age: newRequest.senior_citizens?.date_of_birth
          ? new Date().getFullYear() -
            new Date(newRequest.senior_citizens.date_of_birth).getFullYear()
          : 0,
        senior_gender: newRequest.senior_citizens?.gender || '',
        attachments: []
      };
    } catch (error) {
      console.error('Error in createDocumentRequest:', error);
      throw error;
    }
  }

  // Update document request
  static async updateDocumentRequest(
    id: string,
    data: Partial<DocumentFormData>
  ): Promise<DocumentRequest> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: updatedRequest, error } = await supabase
        .from('document_requests')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          *,
          senior_citizens!inner(
            id,
            first_name,
            last_name,
            contact_phone,
            barangay,
            date_of_birth,
            gender
          ),
          document_attachments(
            id,
            file_name,
            file_url,
            file_type,
            file_size,
            uploaded_by,
            uploaded_at
          )
        `
        )
        .single();

      if (error) {
        console.error('Error updating document request:', error);
        throw new Error(`Failed to update document request: ${error.message}`);
      }

      return {
        ...updatedRequest,
        senior_name: updatedRequest.senior_citizens
          ? `${updatedRequest.senior_citizens.first_name} ${updatedRequest.senior_citizens.last_name}`
          : '',
        senior_phone: updatedRequest.senior_citizens?.contact_phone || '',
        senior_barangay: updatedRequest.senior_citizens?.barangay || '',
        senior_age: updatedRequest.senior_citizens?.date_of_birth
          ? new Date().getFullYear() -
            new Date(updatedRequest.senior_citizens.date_of_birth).getFullYear()
          : 0,
        senior_gender: updatedRequest.senior_citizens?.gender || '',
        attachments: updatedRequest.document_attachments || []
      };
    } catch (error) {
      console.error('Error in updateDocumentRequest:', error);
      throw error;
    }
  }

  // Update document request status
  static async updateDocumentRequestStatus(
    id: string,
    status: DocumentRequest['status'],
    assigned_staff?: string
  ): Promise<DocumentRequest> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (assigned_staff) {
        updateData.assigned_staff = assigned_staff;
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: updatedRequest, error } = await supabase
        .from('document_requests')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          *,
          senior_citizens!inner(
            id,
            first_name,
            last_name,
            contact_phone,
            barangay,
            date_of_birth,
            gender
          )
        `
        )
        .single();

      if (error) {
        console.error('Error updating document request status:', error);
        throw new Error(
          `Failed to update document request status: ${error.message}`
        );
      }

      const result = {
        ...updatedRequest,
        senior_name: updatedRequest.senior_citizens
          ? `${updatedRequest.senior_citizens.first_name} ${updatedRequest.senior_citizens.last_name}`
          : '',
        senior_phone: updatedRequest.senior_citizens?.contact_phone || '',
        senior_barangay: updatedRequest.senior_citizens?.barangay || '',
        senior_age: updatedRequest.senior_citizens?.date_of_birth
          ? new Date().getFullYear() -
            new Date(updatedRequest.senior_citizens.date_of_birth).getFullYear()
          : 0,
        senior_gender: updatedRequest.senior_citizens?.gender || '',
        attachments: []
      };

      // Send notification for status changes
      try {
        const notificationData = {
          seniorName: result.senior_name,
          seniorPhone: result.senior_phone,
          seniorEmail: undefined, // Add this field to your database if needed
          documentType: result.document_type,
          status: result.status,
          requestId: result.id
        };
        await NotificationService.sendStatusUpdateNotification(
          notificationData
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't throw here as the status update was successful
      }

      return result;
    } catch (error) {
      console.error('Error in updateDocumentRequestStatus:', error);
      throw error;
    }
  }

  // Delete document request
  static async deleteDocumentRequest(id: string): Promise<void> {
    try {
      // First delete associated attachments
      const { error: attachmentsError } = await supabase
        .from('document_attachments')
        .delete()
        .eq('document_request_id', id);

      if (attachmentsError) {
        console.error('Error deleting document attachments:', attachmentsError);
        throw new Error(
          `Failed to delete document attachments: ${attachmentsError.message}`
        );
      }

      // Then delete the document request
      const { error } = await supabase
        .from('document_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting document request:', error);
        throw new Error(`Failed to delete document request: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteDocumentRequest:', error);
      throw error;
    }
  }

  // Get document request statistics
  static async getDocumentRequestStats(): Promise<DocumentStats> {
    try {
      // Check if tables exist first
      const { data: tableCheck, error: tableError } = await supabase
        .from('document_requests')
        .select('id')
        .limit(1);

      if (tableError && tableError.code === 'PGRST200') {
        console.log(
          'Document requests table does not exist yet. Returning empty stats.'
        );
        return {
          total: 0,
          pending: 0,
          approved: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          ready_for_pickup: 0,
          urgent: 0,
          overdue: 0
        };
      }

      const { data, error } = await supabase
        .from('document_requests')
        .select('status, priority_level, required_by_date, created_at');

      if (error) {
        console.error('Error fetching document request stats:', error);
        throw new Error(
          `Failed to fetch document request stats: ${error.message}`
        );
      }

      const now = new Date();
      const stats: DocumentStats = {
        total: data?.length || 0,
        pending: 0,
        approved: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        ready_for_pickup: 0,
        urgent: 0,
        overdue: 0
      };

      data?.forEach(request => {
        // Count by status
        switch (request.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'approved':
            stats.approved++;
            break;
          case 'in_progress':
            stats.in_progress++;
            break;
          case 'completed':
            stats.completed++;
            break;
          case 'cancelled':
            stats.cancelled++;
            break;
          case 'ready_for_pickup':
            stats.ready_for_pickup++;
            break;
        }

        // Count urgent requests
        if (request.priority_level === 'urgent') {
          stats.urgent++;
        }

        // Count overdue requests
        if (
          request.required_by_date &&
          new Date(request.required_by_date) < now &&
          request.status !== 'completed'
        ) {
          stats.overdue++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getDocumentRequestStats:', error);
      throw error;
    }
  }

  // Upload document attachment
  static async uploadDocumentAttachment(
    documentRequestId: string,
    file: File
  ): Promise<DocumentAttachment> {
    try {
      // Check if tables exist first
      const { data: tableCheck, error: tableError } = await supabase
        .from('document_requests')
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
      const fileName = `${documentRequestId}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('document-attachments')
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
      } = supabase.storage.from('document-attachments').getPublicUrl(fileName);

      // Save attachment record
      const attachmentData = {
        document_request_id: documentRequestId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user.id
      };

      const { data: attachment, error: attachmentError } = await supabase
        .from('document_attachments')
        .insert([attachmentData])
        .select()
        .single();

      if (attachmentError) {
        console.error('Error saving attachment record:', attachmentError);
        throw new Error(
          `Failed to save attachment record: ${attachmentError.message}`
        );
      }

      return attachment;
    } catch (error) {
      console.error('Error in uploadDocumentAttachment:', error);
      throw error;
    }
  }

  // Delete document attachment
  static async deleteDocumentAttachment(attachmentId: string): Promise<void> {
    try {
      // Get attachment info first
      const { data: attachment, error: fetchError } = await supabase
        .from('document_attachments')
        .select('file_url')
        .eq('id', attachmentId)
        .single();

      if (fetchError) {
        console.error('Error fetching attachment:', fetchError);
        throw new Error(`Failed to fetch attachment: ${fetchError.message}`);
      }

      // Extract file path from URL
      const urlParts = attachment.file_url.split('/');
      const filePath = urlParts.slice(-2).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('document-attachments')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('document_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) {
        console.error('Error deleting attachment from database:', dbError);
        throw new Error(`Failed to delete attachment: ${dbError.message}`);
      }
    } catch (error) {
      console.error('Error in deleteDocumentAttachment:', error);
      throw error;
    }
  }
}
