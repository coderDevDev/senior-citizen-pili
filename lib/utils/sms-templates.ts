/**
 * SMS Templates for OSCA System
 * These templates are used to generate SMS messages for various notifications
 */

export interface AnnouncementData {
  title: string;
  description: string;
  date?: string;
  time?: string;
  location?: string;
  barangay?: string;
}

export interface AppointmentData {
  seniorName: string;
  date: string;
  time: string;
  purpose: string;
  location?: string;
}

export interface BenefitData {
  seniorName: string;
  benefitType: string;
  status: string;
  claimDate?: string;
  location?: string;
}

export interface DocumentData {
  seniorName: string;
  documentType: string;
  status: string;
  claimDate?: string;
  location?: string;
}

export class SMSTemplates {
  /**
   * Generate SMS for announcement notification
   */
  static announcement(data: AnnouncementData): string {
    let message = `OSCA ANNOUNCEMENT\n\n`;
    message += `${data.title}\n\n`;
    message += `${data.description}\n`;

    if (data.date) {
      message += `\n Date: ${data.date}`;
    }

    if (data.time) {
      message += `\n Time: ${data.time}`;
    }

    if (data.location) {
      message += `\n Location: ${data.location}`;
    }

    if (data.barangay) {
      message += `\n Barangay: ${data.barangay}`;
    }

    message += `\n\n- OSCA Management`;

    return this.truncateMessage(message);
  }

  /**
   * Generate SMS for appointment reminder
   */
  static appointmentReminder(data: AppointmentData): string {
    let message = ` APPOINTMENT REMINDER\n\n`;
    message += `Dear ${data.seniorName},\n\n`;
    message += `You have an appointment:\n`;
    message += ` ${data.date}\n`;
    message += ` ${data.time}\n`;
    message += ` Purpose: ${data.purpose}\n`;

    if (data.location) {
      message += ` ${data.location}\n`;
    }

    message += `\nPlease arrive 10 minutes early.\n`;
    message += `\n- OSCA`;

    return this.truncateMessage(message);
  }

  /**
   * Generate SMS for appointment confirmation
   */
  static appointmentConfirmation(data: AppointmentData): string {
    let message = ` APPOINTMENT CONFIRMED\n\n`;
    message += `Dear ${data.seniorName},\n\n`;
    message += `Your appointment has been confirmed:\n`;
    message += ` ${data.date}\n`;
    message += ` ${data.time}\n`;
    message += ` ${data.purpose}\n`;

    if (data.location) {
      message += ` ${data.location}\n`;
    }

    message += `\n- OSCA`;

    return this.truncateMessage(message);
  }

  /**
   * Generate SMS for benefit approval
   */
  static benefitApproval(data: BenefitData): string {
    let message = ` BENEFIT APPROVED\n\n`;
    message += `Dear ${data.seniorName},\n\n`;
    message += `Your ${data.benefitType} application has been APPROVED!\n`;

    if (data.claimDate) {
      message += `\n Claim Date: ${data.claimDate}`;
    }

    if (data.location) {
      message += `\n Location: ${data.location}`;
    }

    message += `\n\nPlease bring a valid ID.\n`;
    message += `\n- OSCA`;

    return this.truncateMessage(message);
  }

  /**
   * Generate SMS for benefit rejection
   */
  static benefitRejection(data: BenefitData): string {
    let message = ` BENEFIT UPDATE\n\n`;
    message += `Dear ${data.seniorName},\n\n`;
    message += `Your ${data.benefitType} application requires review.\n`;
    message += `\nPlease visit the OSCA office for more information.\n`;
    message += `\n- OSCA`;

    return this.truncateMessage(message);
  }

  /**
   * Generate SMS for document ready notification
   */
  static documentReady(data: DocumentData): string {
    let message = ` DOCUMENT READY\n\n`;
    message += `Dear ${data.seniorName},\n\n`;
    message += `Your ${data.documentType} is ready for pickup!\n`;

    if (data.claimDate) {
      message += `\n Available: ${data.claimDate}`;
    }

    if (data.location) {
      message += `\n Location: ${data.location}`;
    }

    message += `\n\nPlease bring a valid ID.\n`;
    message += `\n- OSCA`;

    return this.truncateMessage(message);
  }

  /**
   * Generate SMS for document rejection
   */
  static documentRejection(data: DocumentData): string {
    let message = ` DOCUMENT UPDATE\n\n`;
    message += `Dear ${data.seniorName},\n\n`;
    message += `Your ${data.documentType} request requires additional information.\n`;
    message += `\nPlease visit the OSCA office.\n`;
    message += `\n- OSCA`;

    return this.truncateMessage(message);
  }

  /**
   * Generate SMS for birthday greeting
   */
  static birthdayGreeting(seniorName: string): string {
    let message = ` HAPPY BIRTHDAY!\n\n`;
    message += `Dear ${seniorName},\n\n`;
    message += `The OSCA family wishes you a wonderful birthday filled with joy and blessings!\n`;
    message += `\nMay you have many more healthy and happy years ahead.\n`;
    message += `\n- OSCA Management`;

    return this.truncateMessage(message);
  }

  /**
   * Generate SMS for emergency alert
   */
  static emergencyAlert(message: string, location?: string): string {
    let sms = ` EMERGENCY ALERT\n\n`;
    sms += `${message}\n`;

    if (location) {
      sms += `\n ${location}`;
    }

    sms += `\n\nPlease stay safe and follow instructions.\n`;
    sms += `\n- OSCA`;

    return this.truncateMessage(sms);
  }

  /**
   * Truncate message to 160 characters (standard SMS length)
   * or 1600 characters (concatenated SMS limit)
   */
  private static truncateMessage(
    message: string,
    maxLength: number = 1600
  ): string {
    if (message.length <= maxLength) {
      return message;
    }

    // Truncate and add ellipsis
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get character count and SMS count
   */
  static getMessageInfo(message: string): {
    length: number;
    smsCount: number;
    isValid: boolean;
  } {
    const length = message.length;
    const smsCount = Math.ceil(length / 160);
    const isValid = length > 0 && length <= 1600;

    return {
      length,
      smsCount,
      isValid
    };
  }
}
