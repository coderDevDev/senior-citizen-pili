// Environment configuration
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcWljeGd0bG1ud2Fsd2ptYW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYyOTgwMCwiZXhwIjoyMDcwMjA1ODAwfQ.RPw9Ee0rdHpRYMrzwWDUTqRrQ6KkdWSnr2gFdZ4o4pE'
  },
  sms: {
    // SMS Provider: 'iprogtech' or 'semaphore'
    provider: (process.env.NEXT_PUBLIC_SMS_PROVIDER || 'iprogtech') as 'iprogtech' | 'semaphore',
    
    // iProg Tech SMS Configuration (Default)
    iprogtech: {
      apiToken: process.env.NEXT_PUBLIC_IPROGTECH_API_TOKEN || '',
      apiUrl: 'https://sms.iprogtech.com/api/v1',
      smsProvider: 0 // 0 or 1 (iProg Tech provider option)
    },
    
    // Semaphore SMS Configuration (Alternative)
    semaphore: {
      apiKey: process.env.NEXT_PUBLIC_SEMAPHORE_API_KEY || '',
      senderName: process.env.NEXT_PUBLIC_SEMAPHORE_SENDER_NAME || 'OSCA',
      apiUrl: 'https://api.semaphore.co/api/v4/messages'
    }
  }
};

// Validate required environment variables
export function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingVars);
    console.warn('Please check your .env.local file');
  }

  return missingVars.length === 0;
}
