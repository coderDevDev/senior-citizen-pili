// Activity Logs Types
// Defines types for activity logging and audit trail system

export type UserRole = 'osca' | 'basca' | 'senior';

export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'complete'
  | 'export'
  | 'login'
  | 'logout';

export type EntityType =
  | 'benefit'
  | 'document'
  | 'appointment'
  | 'announcement'
  | 'senior_citizen'
  | 'user'
  | 'report';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_role: UserRole;
  user_name: string;
  user_email?: string;
  action: ActivityAction;
  entity_type: EntityType;
  entity_id: string | null;
  entity_name: string;
  description: string;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  barangay?: string | null;
  created_at: string;
}

export interface CreateActivityLogData {
  user_id?: string;
  user_role: UserRole;
  user_name: string;
  user_email?: string;
  action: ActivityAction;
  entity_type: EntityType;
  entity_id?: string;
  entity_name: string;
  description: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  barangay?: string;
}

export interface ActivityLogFilters {
  user_id?: string;
  user_role?: UserRole;
  action?: ActivityAction;
  entity_type?: EntityType;
  entity_id?: string;
  barangay?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ActivityLogStats {
  total: number;
  by_action: Record<ActivityAction, number>;
  by_entity: Record<EntityType, number>;
  recent_activities: number;
  today: number;
}

// Soft Delete Types
export interface SoftDeletedItem {
  id: string;
  entity_type: EntityType;
  entity_name: string;
  deleted_at: string;
  deleted_by: string;
  deleted_by_name?: string;
  delete_reason?: string;
  can_restore: boolean;
  days_until_permanent_delete: number;
}

export interface DeleteOptions {
  reason?: string;
  permanent?: boolean;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  restored_item?: any;
}

// Activity Log Display Helpers
export const ACTION_COLORS: Record<ActivityAction, string> = {
  create: 'bg-green-100 text-green-800 border-green-200',
  update: 'bg-blue-100 text-blue-800 border-blue-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  restore: 'bg-purple-100 text-purple-800 border-purple-200',
  approve: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  reject: 'bg-orange-100 text-orange-800 border-orange-200',
  cancel: 'bg-gray-100 text-gray-800 border-gray-200',
  complete: 'bg-teal-100 text-teal-800 border-teal-200',
  export: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  login: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  logout: 'bg-slate-100 text-slate-800 border-slate-200'
};

export const ACTION_ICONS: Record<ActivityAction, string> = {
  create: '➕',
  update: '✏️',
  delete: '🗑️',
  restore: '♻️',
  approve: '✅',
  reject: '❌',
  cancel: '⛔',
  complete: '✔️',
  export: '📥',
  login: '🔓',
  logout: '🔒'
};

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  benefit: 'Benefit Application',
  document: 'Document Request',
  appointment: 'Appointment',
  announcement: 'Announcement',
  senior_citizen: 'Senior Citizen',
  user: 'User',
  report: 'Report'
};

// Helper function to format entity names (remove underscores, capitalize)
export const formatEntityName = (name: string): string => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const ACTION_LABELS: Record<ActivityAction, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  restore: 'Restored',
  approve: 'Approved',
  reject: 'Rejected',
  cancel: 'Cancelled',
  complete: 'Completed',
  export: 'Exported',
  login: 'Logged In',
  logout: 'Logged Out'
};
