import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients, message, provider = 'iprogtech' } = body;

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipients are required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Format phone numbers
    const formattedNumbers = recipients
      .map((r: any) => formatPhoneNumber(r.number || r))
      .filter((num: string | null) => num !== null);

    if (formattedNumbers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid phone numbers provided' },
        { status: 400 }
      );
    }

    console.log(`📱 Sending SMS via ${provider} to ${formattedNumbers.length} recipients`);

    // Send SMS based on provider
    if (provider === 'iprogtech') {
      return await sendViaIProgTech(formattedNumbers, message);
    } else if (provider === 'semaphore') {
      return await sendViaSemaphore(formattedNumbers, message);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid SMS provider' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('❌ SMS API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error: ' + error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Send SMS via iProg Tech (Default Provider)
 */
async function sendViaIProgTech(phoneNumbers: string[], message: string) {
  const apiToken = config.sms.iprogtech.apiToken;
  
  if (!apiToken) {
    return NextResponse.json(
      {
        success: false,
        error: 'iProg Tech SMS not configured. Please add NEXT_PUBLIC_IPROGTECH_API_TOKEN to environment variables.'
      },
      { status: 500 }
    );
  }

  try {
    // iProg Tech uses bulk send endpoint for multiple recipients
    const endpoint = phoneNumbers.length > 1 
      ? `${config.sms.iprogtech.apiUrl}/sms_messages/send_bulk`
      : `${config.sms.iprogtech.apiUrl}/sms_messages`;

    const requestBody = {
      api_token: apiToken,
      phone_number: phoneNumbers.join(','),
      message: message,
      sms_provider: config.sms.iprogtech.smsProvider
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (response.ok && data.status === 200) {
      console.log('✅ iProg Tech SMS sent successfully:', data);
      
      // Get credits balance
      const creditsResponse = await fetch(
        `${config.sms.iprogtech.apiUrl}/account/sms_credits?api_token=${apiToken}`
      );
      const creditsData = await creditsResponse.json();
      const credits = creditsData?.data?.load_balance;

      return NextResponse.json({
        success: true,
        message: `SMS sent to ${phoneNumbers.length} recipient(s)`,
        messageId: data.message_id || data.message_ids,
        credits: credits
      });
    } else {
      console.error('❌ iProg Tech SMS failed:', data);
      return NextResponse.json(
        {
          success: false,
          error: data.message || 'Failed to send SMS'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ iProg Tech API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send SMS: ' + error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Send SMS via Semaphore (Alternative Provider)
 */
async function sendViaSemaphore(phoneNumbers: string[], message: string) {
  const apiKey = config.sms.semaphore.apiKey;
  
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'Semaphore SMS not configured. Please add NEXT_PUBLIC_SEMAPHORE_API_KEY to environment variables.'
      },
      { status: 500 }
    );
  }

  try {
    const requestBody = {
      apikey: apiKey,
      number: phoneNumbers.join(','),
      message: message,
      sendername: config.sms.semaphore.senderName
    };

    const response = await fetch(config.sms.semaphore.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (response.ok && data.message_id) {
      console.log('✅ Semaphore SMS sent successfully:', data);
      return NextResponse.json({
        success: true,
        message: `SMS sent to ${phoneNumbers.length} recipient(s)`,
        messageId: data.message_id,
        credits: data.credits
      });
    } else {
      console.error('❌ Semaphore SMS failed:', data);
      return NextResponse.json(
        {
          success: false,
          error: data.message || 'Failed to send SMS'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Semaphore API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send SMS: ' + error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Format phone number to Philippine format
 */
function formatPhoneNumber(phoneNumber: string): string | null {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // Handle different formats
  if (cleaned.startsWith('639') && cleaned.length === 12) {
    return cleaned;
  } else if (cleaned.startsWith('09') && cleaned.length === 11) {
    return '63' + cleaned.substring(1);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '63' + cleaned;
  } else {
    console.warn('⚠️ Invalid phone number format:', phoneNumber);
    return null;
  }
}
