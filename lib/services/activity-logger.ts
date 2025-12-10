// Activity Logger Service
// Centralized service for logging all user activities and system events

import { supabase } from '@/lib/supabase';
import type {
  ActivityLog,
  CreateActivityLogData,
  ActivityLogFilters,
  ActivityLogStats
} from '@/types/activity-logs';
import { formatEntityName } from '@/types/activity-logs';

export class ActivityLogger {
  /**
   * Log a user activity
   */
  static async log(data: CreateActivityLogData): Promise<ActivityLog | null> {
    try {
      // Get current user if not provided
      let userId = data.user_id;
      let userName = data.user_name;
      let userEmail = data.user_email;
      let userRole = data.user_role;
      let barangay = data.barangay;

      if (!userId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          userId = authData.user.id;
          userEmail = authData.user.email;

          // Fetch user details
          const { data: userData } = await supabase
            .from('users')
            .select('first_name, last_name, role, barangay')
            .eq('id', authData.user.id)
            .single();

          if (userData) {
            userName = `${userData.first_name} ${userData.last_name}`;
            userRole = userData.role;
            barangay = userData.barangay;
          }
        }
      }

      // Get IP address and user agent from browser
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;

      const logData = {
        user_id: userId,
        user_role: userRole,
        user_name: userName,
        user_email: userEmail,
        action: data.action,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        entity_name: data.entity_name,
        description: data.description,
        old_values: data.old_values || null,
        new_values: data.new_values || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        barangay: barangay
      };

      console.log('📝 Inserting activity log:', logData);

      // Insert activity log
      const { data: log, error } = await supabase
        .from('activity_logs')
        .insert(logData)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to insert activity log:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        return null;
      }

      console.log('✅ Activity log inserted successfully:', log);
      return log;
    } catch (error) {
      console.error('Activity logging error:', error);
      return null;
    }
  }

  /**
   * Get activity logs with filters and pagination
   */
  static async getActivityLogs(
    filters: ActivityLogFilters = {}
  ): Promise<{ logs: ActivityLog[]; total: number }> {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.user_role) {
        query = query.eq('user_role', filters.user_role);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }

      if (filters.entity_id) {
        query = query.eq('entity_id', filters.entity_id);
      }

      if (filters.barangay) {
        query = query.eq('barangay', filters.barangay);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (filters.search) {
        query = query.or(
          `user_name.ilike.%${filters.search}%,entity_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Get activity history for a specific entity
   */
  static async getEntityHistory(
    entityType: string,
    entityId: string
  ): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch entity history:', error);
      return [];
    }
  }

  /**
   * Get activity statistics
   */
  static async getStats(filters: ActivityLogFilters = {}): Promise<ActivityLogStats> {
    try {
      let query = supabase.from('activity_logs').select('action, entity_type, created_at');

      // Apply filters
      if (filters.user_id) query = query.eq('user_id', filters.user_id);
      if (filters.user_role) query = query.eq('user_role', filters.user_role);
      if (filters.barangay) query = query.eq('barangay', filters.barangay);
      if (filters.start_date) query = query.gte('created_at', filters.start_date);
      if (filters.end_date) query = query.lte('created_at', filters.end_date);

      const { data, error } = await query;

      if (error) throw error;

      const logs = data || [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Calculate stats
      const stats: ActivityLogStats = {
        total: logs.length,
        by_action: {} as any,
        by_entity: {} as any,
        recent_activities: logs.filter(
          log => new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        today: logs.filter(log => new Date(log.created_at) >= today).length
      };

      // Count by action
      logs.forEach(log => {
        const action = log.action as keyof typeof stats.by_action;
        const entityType = log.entity_type as keyof typeof stats.by_entity;
        stats.by_action[action] = (stats.by_action[action] || 0) + 1;
        stats.by_entity[entityType] = (stats.by_entity[entityType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to fetch activity stats:', error);
      return {
        total: 0,
        by_action: {} as any,
        by_entity: {} as any,
        recent_activities: 0,
        today: 0
      };
    }
  }

  /**
   * Get client IP address (best effort)
   */
  private static async getClientIP(): Promise<string | null> {
    try {
      // In production, you'd get this from your server
      // For now, we'll return null and let the server handle it
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Helper: Log benefit application activity
   */
  static async logBenefitActivity(
    action: 'create' | 'update' | 'delete' | 'approve' | 'reject',
    benefitId: string,
    benefitType: string,
    seniorName: string,
    oldValues?: any,
    newValues?: any
  ) {
    const formattedBenefitType = formatEntityName(benefitType);
    
    const actionDescriptions = {
      create: `Applied for ${formattedBenefitType} benefit`,
      update: `Updated ${formattedBenefitType} benefit application`,
      delete: `Deleted ${formattedBenefitType} benefit application`,
      approve: `Approved ${formattedBenefitType} benefit for ${seniorName}`,
      reject: `Rejected ${formattedBenefitType} benefit for ${seniorName}`
    };

    return this.log({
      action,
      entity_type: 'benefit',
      entity_id: benefitId,
      entity_name: `${formattedBenefitType} - ${seniorName}`,
      description: actionDescriptions[action],
      old_values: oldValues,
      new_values: newValues
    } as CreateActivityLogData);
  }

  /**
   * Helper: Log document request activity
   */
  static async logDocumentActivity(
    action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'complete',
    documentId: string,
    documentType: string,
    seniorName: string,
    oldValues?: any,
    newValues?: any
  ) {
    const formattedDocumentType = formatEntityName(documentType);
    
    const actionDescriptions = {
      create: `Requested ${formattedDocumentType} document`,
      update: `Updated ${formattedDocumentType} document request`,
      delete: `Deleted ${formattedDocumentType} document request`,
      approve: `Approved ${formattedDocumentType} document for ${seniorName}`,
      reject: `Rejected ${formattedDocumentType} document for ${seniorName}`,
      complete: `Completed ${formattedDocumentType} document for ${seniorName}`
    };

    return this.log({
      action,
      entity_type: 'document',
      entity_id: documentId,
      entity_name: `${formattedDocumentType} - ${seniorName}`,
      description: actionDescriptions[action],
      old_values: oldValues,
      new_values: newValues
    } as CreateActivityLogData);
  }

  /**
   * Helper: Log appointment activity
   */
  static async logAppointmentActivity(
    action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'complete' | 'cancel',
    appointmentId: string,
    appointmentType: string,
    seniorName: string,
    appointmentDate: string,
    oldValues?: any,
    newValues?: any
  ) {
    const formattedAppointmentType = formatEntityName(appointmentType);
    
    const actionDescriptions = {
      create: `Scheduled ${formattedAppointmentType} appointment for ${appointmentDate}`,
      update: `Updated ${formattedAppointmentType} appointment`,
      delete: `Deleted ${formattedAppointmentType} appointment`,
      approve: `Approved ${formattedAppointmentType} appointment for ${seniorName}`,
      reject: `Rejected ${formattedAppointmentType} appointment for ${seniorName}`,
      complete: `Completed ${formattedAppointmentType} appointment for ${seniorName}`,
      cancel: `Cancelled ${formattedAppointmentType} appointment`
    };

    return this.log({
      action,
      entity_type: 'appointment',
      entity_id: appointmentId,
      entity_name: `${formattedAppointmentType} - ${seniorName}`,
      description: actionDescriptions[action],
      old_values: oldValues,
      new_values: newValues
    } as CreateActivityLogData);
  }

  /**
   * Helper: Log announcement activity
   */
  static async logAnnouncementActivity(
    action: 'create' | 'update' | 'delete' | 'restore',
    announcementId: string,
    title: string,
    oldValues?: any,
    newValues?: any
  ) {
    const actionDescriptions = {
      create: `Created announcement: ${title}`,
      update: `Updated announcement: ${title}`,
      delete: `Deleted announcement: ${title}`,
      restore: `Restored announcement: ${title}`
    };

    return this.log({
      action,
      entity_type: 'announcement',
      entity_id: announcementId,
      entity_name: title,
      description: actionDescriptions[action],
      old_values: oldValues,
      new_values: newValues
    } as CreateActivityLogData);
  }
}
