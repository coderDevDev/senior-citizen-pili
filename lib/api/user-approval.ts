import { supabase } from '@/lib/supabase';

export interface UserApprovalData {
  userId: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export class UserApprovalAPI {
  /**
   * Approve a BASCA account
   */
  static async approveBascaAccount(
    userId: string,
    approvedByUserId: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: approvedByUserId,
          rejection_reason: null
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error approving account:', error);
        return {
          success: false,
          message: `Failed to approve account: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'BASCA account approved successfully',
        data
      };
    } catch (error) {
      console.error('Error in approveBascaAccount:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while approving the account'
      };
    }
  }

  /**
   * Reject a BASCA account
   */
  static async rejectBascaAccount(
    userId: string,
    reason: string,
    rejectedByUserId: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!reason || reason.trim() === '') {
        return {
          success: false,
          message: 'Rejection reason is required'
        };
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          is_approved: false,
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          approved_by: rejectedByUserId
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting account:', error);
        return {
          success: false,
          message: `Failed to reject account: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'BASCA account rejected',
        data
      };
    } catch (error) {
      console.error('Error in rejectBascaAccount:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while rejecting the account'
      };
    }
  }

  /**
   * Get pending BASCA accounts (not yet approved)
   */
  static async getPendingAccounts(): Promise<{
    success: boolean;
    message: string;
    data?: any[];
  }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'basca')
        .or('is_approved.is.null,is_approved.eq.false')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending accounts:', error);
        return {
          success: false,
          message: `Failed to fetch pending accounts: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Pending accounts retrieved successfully',
        data: data || []
      };
    } catch (error) {
      console.error('Error in getPendingAccounts:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while fetching pending accounts',
        data: []
      };
    }
  }

  /**
   * Check if a user account is approved
   */
  static async isAccountApproved(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_approved')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error checking approval status:', error);
        return false;
      }

      return data.is_approved === true;
    } catch (error) {
      console.error('Error in isAccountApproved:', error);
      return false;
    }
  }
}
