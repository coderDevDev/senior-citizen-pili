import { config } from '@/lib/config';

export interface SMSRecipient {
  number: string;
  name?: string;
}

export interface SMSMessage {
  message: string;
  recipients: SMSRecipient[];
}

export interface SMSResponse {
  success: boolean;
  message: string;
  messageId?: string;
  credits?: number;
  error?: string;
}

export class SemaphoreSMSAPI {
  private static apiKey = config.semaphore.apiKey;
  private static senderName = config.semaphore.senderName;
  private static apiUrl = config.semaphore.apiUrl;

  /**
   * Send SMS to single recipient
   */
  static async sendSMS(
    phoneNumber: string,
    message: string
  ): Promise<SMSResponse> {
    return this.sendBulkSMS([{ number: phoneNumber }], message);
  }

  /**
   * Send SMS to multiple recipients
   */
  static async sendBulkSMS(
    recipients: SMSRecipient[],
    message: string
  ): Promise<SMSResponse> {
    try {
      // Validate API key
      if (!this.apiKey) {
        console.error('❌ Semaphore API key not configured');
        return {
          success: false,
          message: 'SMS service not configured. Please add SEMAPHORE_API_KEY to environment variables.',
          error: 'API_KEY_MISSING'
        };
      }

      // Format phone numbers (remove spaces, dashes, and ensure proper format)
      const formattedNumbers = recipients.map(r => this.formatPhoneNumber(r.number));

      // Filter out invalid numbers
      const validNumbers = formattedNumbers.filter(num => num !== null);

      if (validNumbers.length === 0) {
        return {
          success: false,
          message: 'No valid phone numbers provided',
          error: 'INVALID_NUMBERS'
        };
      }

      console.log('📱 Sending SMS to', validNumbers.length, 'recipients');

      // Prepare request body
      const requestBody = {
        apikey: this.apiKey,
        number: validNumbers.join(','),
        message: message,
        sendername: this.senderName
      };

      // Send request to Semaphore API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok && data.message_id) {
        console.log('✅ SMS sent successfully:', data);
        return {
          success: true,
          message: `SMS sent to ${validNumbers.length} recipient(s)`,
          messageId: data.message_id,
          credits: data.credits
        };
      } else {
        console.error('❌ SMS sending failed:', data);
        return {
          success: false,
          message: data.message || 'Failed to send SMS',
          error: data.error || 'UNKNOWN_ERROR'
        };
      }
    } catch (error: any) {
      console.error('❌ SMS API error:', error);
      return {
        success: false,
        message: 'Failed to send SMS: ' + error.message,
        error: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Format phone number to Philippine format
   * Accepts: 09171234567, +639171234567, 9171234567
   * Returns: 639171234567 (format required by Semaphore)
   */
  private static formatPhoneNumber(phoneNumber: string): string | null {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('639') && cleaned.length === 12) {
      // Already in correct format: 639171234567
      return cleaned;
    } else if (cleaned.startsWith('09') && cleaned.length === 11) {
      // Format: 09171234567 -> 639171234567
      return '63' + cleaned.substring(1);
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
      // Format: 9171234567 -> 639171234567
      return '63' + cleaned;
    } else {
      console.warn('⚠️ Invalid phone number format:', phoneNumber);
      return null;
    }
  }

  /**
   * Check SMS credits balance
   */
  static async checkBalance(): Promise<{
    success: boolean;
    balance?: number;
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'API key not configured'
        };
      }

      const response = await fetch(
        `https://api.semaphore.co/api/v4/account?apikey=${this.apiKey}`
      );

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          balance: data.credit_balance
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to check balance'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate if SMS service is configured
   */
  static isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }
}
