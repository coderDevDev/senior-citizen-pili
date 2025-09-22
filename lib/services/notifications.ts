import { DocumentsAPI } from '@/lib/api/documents';

export interface NotificationConfig {
  enabled: boolean;
  sms: {
    enabled: boolean;
    apiKey?: string;
    senderId?: string;
  };
  email: {
    enabled: boolean;
    smtpHost?: string;
    smtpPort?: number;
    username?: string;
    password?: string;
  };
}

export interface NotificationData {
  seniorName: string;
  seniorPhone?: string;
  seniorEmail?: string;
  documentType: string;
  status: string;
  requestId: string;
}

export class NotificationService {
  private static config: NotificationConfig = {
    enabled: true,
    sms: {
      enabled: process.env.NEXT_PUBLIC_SMS_ENABLED === 'true',
      apiKey: process.env.SMS_API_KEY,
      senderId: process.env.SMS_SENDER_ID
    },
    email: {
      enabled: process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD
    }
  };

  static async sendStatusUpdateNotification(
    data: NotificationData
  ): Promise<void> {
    if (!this.config.enabled) {
      console.log('Notifications disabled, skipping notification');
      return;
    }

    const promises: Promise<void>[] = [];

    // Send SMS if enabled
    if (this.config.sms.enabled && data.seniorPhone) {
      promises.push(this.sendSMS(data));
    }

    // Send Email if enabled
    if (this.config.email.enabled && data.seniorEmail) {
      promises.push(this.sendEmail(data));
    }

    try {
      await Promise.allSettled(promises);
      console.log('Notifications sent successfully');
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  private static async sendSMS(data: NotificationData): Promise<void> {
    if (!this.config.sms.apiKey || !data.seniorPhone) {
      throw new Error('SMS configuration incomplete');
    }

    const message = this.getSMSMessage(data);

    // Example SMS API call (replace with your SMS provider)
    const response = await fetch('https://api.sms-provider.com/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.sms.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: data.seniorPhone,
        message: message,
        sender_id: this.config.sms.senderId
      })
    });

    if (!response.ok) {
      throw new Error(`SMS API error: ${response.statusText}`);
    }

    console.log('SMS sent successfully');
  }

  private static async sendEmail(data: NotificationData): Promise<void> {
    if (!data.seniorEmail) {
      throw new Error('No email address provided');
    }

    const subject = `Document Request Status Update - ${data.documentType}`;
    const htmlContent = this.getEmailHTML(data);

    // Example email sending (replace with your email service)
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: data.seniorEmail,
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`);
    }

    console.log('Email sent successfully');
  }

  private static getSMSMessage(data: NotificationData): string {
    const statusMessages = {
      pending:
        'Your document request has been submitted and is pending approval.',
      approved:
        'Great news! Your document request has been approved and will be processed soon.',
      in_progress:
        'Your document request is currently being processed by our staff.',
      completed:
        'Your document request has been completed and is ready for pickup.',
      ready_for_pickup: 'Your document is ready for pickup at the OSCA office.',
      cancelled:
        'Your document request has been cancelled. Please contact OSCA for more information.'
    };

    const statusMessage =
      statusMessages[data.status as keyof typeof statusMessages] ||
      `Your document request status has been updated to: ${data.status}`;

    return `Hello ${data.seniorName}, ${statusMessage} Request ID: ${data.requestId}. - OSCA Pili`;
  }

  private static getEmailHTML(data: NotificationData): string {
    const statusColors = {
      pending: '#f59e0b',
      approved: '#3b82f6',
      in_progress: '#6366f1',
      completed: '#10b981',
      ready_for_pickup: '#8b5cf6',
      cancelled: '#ef4444'
    };

    const statusColor =
      statusColors[data.status as keyof typeof statusColors] || '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document Request Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00af8f; margin: 0; font-size: 24px;">OSCA Pili</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Office of Senior Citizens Affairs</p>
            </div>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Document Request Status Update</h2>
              
              <p style="margin: 0 0 15px 0;">Dear <strong>${
                data.seniorName
              }</strong>,</p>
              
              <p style="margin: 0 0 20px 0;">We are writing to inform you about the status of your document request.</p>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="width: 12px; height: 12px; background-color: ${statusColor}; border-radius: 50%; margin-right: 10px;"></div>
                  <span style="font-weight: 600; color: #374151;">Status: ${data.status.toUpperCase()}</span>
                </div>
                <div style="margin-bottom: 10px;">
                  <strong>Document Type:</strong> ${data.documentType}
                </div>
                <div>
                  <strong>Request ID:</strong> ${data.requestId}
                </div>
              </div>
              
              <p style="margin: 20px 0;">${this.getStatusMessage(
                data.status
              )}</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  If you have any questions or concerns, please don't hesitate to contact our office.
                </p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                  <strong>OSCA Pili Office</strong><br>
                  Phone: (054) 123-4567<br>
                  Email: osca@pili.gov.ph<br>
                  Address: Municipal Hall, Pili, Camarines Sur
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static getStatusMessage(status: string): string {
    const messages = {
      pending:
        'Your document request has been received and is currently being reviewed by our staff. We will notify you once it has been approved.',
      approved:
        "Great news! Your document request has been approved and is now being processed. You will receive another notification when it's ready.",
      in_progress:
        'Your document request is currently being processed by our team. We are working to complete it as soon as possible.',
      completed:
        'Your document request has been completed successfully! You can now visit our office to pick up your document.',
      ready_for_pickup:
        'Your document is ready for pickup at the OSCA office. Please bring a valid ID when you come to collect it.',
      cancelled:
        'Your document request has been cancelled. If you have any questions about this decision, please contact our office directly.'
    };

    return (
      messages[status as keyof typeof messages] ||
      `Your document request status has been updated to: ${status}. Please contact our office for more information.`
    );
  }

  // Helper method to get notification data from document request
  static async getNotificationDataFromRequest(
    requestId: string
  ): Promise<NotificationData | null> {
    try {
      const document = await DocumentsAPI.getDocumentRequestById(requestId);

      return {
        seniorName: document.senior_name || '',
        seniorPhone: document.senior_phone,
        seniorEmail: document.senior_email, // You may need to add this field to your API
        documentType: document.document_type,
        status: document.status,
        requestId: document.id
      };
    } catch (error) {
      console.error('Error getting notification data:', error);
      return null;
    }
  }
}
