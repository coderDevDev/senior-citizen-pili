// Activity Logs API
// API functions for activity logs and audit trail

import { ActivityLogger } from '@/lib/services/activity-logger';
import type {
  ActivityLog,
  ActivityLogFilters,
  ActivityLogStats,
  CreateActivityLogData
} from '@/types/activity-logs';

export class ActivityLogsAPI {
  /**
   * Create a new activity log
   */
  static async createLog(data: CreateActivityLogData): Promise<ActivityLog | null> {
    return ActivityLogger.log(data);
  }

  /**
   * Get activity logs with filters
   */
  static async getActivityLogs(
    filters: ActivityLogFilters = {}
  ): Promise<{ logs: ActivityLog[]; total: number; pages: number }> {
    const result = await ActivityLogger.getActivityLogs(filters);
    const limit = filters.limit || 20;
    const pages = Math.ceil(result.total / limit);

    return {
      ...result,
      pages
    };
  }

  /**
   * Get activity history for a specific entity
   */
  static async getEntityHistory(
    entityType: string,
    entityId: string
  ): Promise<ActivityLog[]> {
    return ActivityLogger.getEntityHistory(entityType, entityId);
  }

  /**
   * Get activity statistics
   */
  static async getStats(filters: ActivityLogFilters = {}): Promise<ActivityLogStats> {
    return ActivityLogger.getStats(filters);
  }

  /**
   * Export activity logs to CSV
   */
  static async exportToCSV(filters: ActivityLogFilters = {}): Promise<string> {
    const { logs } = await ActivityLogger.getActivityLogs({
      ...filters,
      limit: 10000 // Get all logs for export
    });

    // CSV headers
    const headers = [
      'Date',
      'Time',
      'User',
      'Role',
      'Action',
      'Entity Type',
      'Entity Name',
      'Description',
      'Barangay'
    ];

    // CSV rows
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleDateString(),
      new Date(log.created_at).toLocaleTimeString(),
      log.user_name,
      log.user_role,
      log.action,
      log.entity_type,
      log.entity_name,
      log.description,
      log.barangay || 'N/A'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Export activity logs to JSON
   */
  static async exportToJSON(filters: ActivityLogFilters = {}): Promise<string> {
    const { logs } = await ActivityLogger.getActivityLogs({
      ...filters,
      limit: 10000 // Get all logs for export
    });

    return JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        filters,
        total: logs.length,
        logs
      },
      null,
      2
    );
  }

  /**
   * Get recent activity (last 24 hours)
   */
  static async getRecentActivity(
    filters: ActivityLogFilters = {}
  ): Promise<ActivityLog[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { logs } = await ActivityLogger.getActivityLogs({
      ...filters,
      start_date: yesterday.toISOString(),
      limit: 50
    });

    return logs;
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(
    userId: string
  ): Promise<{
    total: number;
    recent: number;
    by_action: Record<string, number>;
    by_entity: Record<string, number>;
  }> {
    const stats = await ActivityLogger.getStats({ user_id: userId });

    return {
      total: stats.total,
      recent: stats.recent_activities,
      by_action: stats.by_action,
      by_entity: stats.by_entity
    };
  }
}
