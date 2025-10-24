import { SMSTemplates, AnnouncementData } from '@/lib/utils/sms-templates';
import { config } from '@/lib/config';

export interface SMSRecipient {
  number: string;
  name?: string;
}

export interface SMSResponse {
  success: boolean;
  message: string;
  messageId?: string;
  credits?: number;
  error?: string;
}

export class SMSService {
  /**
   * Get current SMS provider
   */
  static getProvider(): 'iprogtech' | 'semaphore' {
    return config.sms.provider;
  }

  /**
   * Check if SMS service is configured
   */
  static isConfigured(): boolean {
    const provider = this.getProvider();
    
    if (provider === 'iprogtech') {
      return !!config.sms.iprogtech.apiToken;
    } else {
      return !!config.sms.semaphore.apiKey;
    }
  }

  /**
   * Send SMS via API route (supports both providers)
   */
  static async sendSMS(
    recipients: SMSRecipient[],
    message: string
  ): Promise<SMSResponse> {
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipients,
          message,
          provider: this.getProvider()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message,
          messageId: data.messageId,
          credits: data.credits
        };
      } else {
        return {
          success: false,
          message: data.error || 'Failed to send SMS',
          error: data.error
        };
      }
    } catch (error: any) {
      console.error('SMS Service Error:', error);
      return {
        success: false,
        message: 'Network error: ' + error.message,
        error: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Send announcement SMS to seniors
   */
  static async sendAnnouncementSMS(
    recipients: SMSRecipient[],
    announcementData: AnnouncementData
  ): Promise<SMSResponse> {
    const message = SMSTemplates.announcement(announcementData);
    return this.sendSMS(recipients, message);
  }

  /**
   * Get seniors' phone numbers from Supabase
   */
  static async getSeniorsPhoneNumbers(
    barangay?: string
  ): Promise<SMSRecipient[]> {
    try {
      const { supabase } = await import('@/lib/supabase');


      let query = supabase
        .from('senior_citizens')
        .select('id, first_name, last_name, emergency_contact_phone, contact_phone')
        .eq('status', 'active');

      // Filter by barangay if specified
      if (barangay && barangay !== 'all') {
        query = query.eq('barangay', barangay);
      }

      const { data: seniors, error } = await query;

      if (error) {
        console.error('Error fetching seniors:', error);
        return [];
      }

      // Extract phone numbers (prefer emergency contact, fallback to contact phone)
      const recipients: SMSRecipient[] = [];

      seniors?.forEach(senior => {
        const phoneNumber =
          senior.emergency_contact_phone || senior.contact_phone;

        if (phoneNumber) {
          recipients.push({
            number: phoneNumber,
            name: `${senior.first_name} ${senior.last_name}`
          });
        }
      });

      return recipients;
    } catch (error) {
      console.error('Error getting phone numbers:', error);
      return [];
    }
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check if it matches Philippine mobile number formats
    return (
      (cleaned.startsWith('639') && cleaned.length === 12) ||
      (cleaned.startsWith('09') && cleaned.length === 11) ||
      (cleaned.startsWith('9') && cleaned.length === 10)
    );
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumberDisplay(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.startsWith('639') && cleaned.length === 12) {
      // Format: 639171234567 -> +63 917 123 4567
      return `+63 ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
    } else if (cleaned.startsWith('09') && cleaned.length === 11) {
      // Format: 09171234567 -> 0917 123 4567
      return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    }

    return phoneNumber;
  }

  /**
   * Get message info (character count, SMS count)
   */
  static getMessageInfo(message: string): {
    length: number;
    smsCount: number;
    isValid: boolean;
  } {
    return SMSTemplates.getMessageInfo(message);
  }
}
