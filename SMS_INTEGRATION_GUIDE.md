# 📱 Semaphore SMS Integration Guide

## Overview
This guide explains how to integrate Semaphore SMS API into your OSCA system for sending announcements, reminders, and notifications to senior citizens.

---

## 🚀 Step 1: Get Semaphore API Credentials

### Sign Up for Semaphore
1. Go to https://semaphore.co/
2. Click "Sign Up" or "Get Started"
3. Create your account
4. Verify your email

### Get Your API Key
1. Log in to your Semaphore dashboard
2. Go to **Account** → **API**
3. Copy your **API Key** (it looks like: `abc123def456...`)
4. Note your **Sender Name** (default is your company name, max 11 characters)

### Load Credits
1. Go to **Account** → **Credits**
2. Choose a package (e.g., ₱500 = ~500 SMS)
3. Pay via GCash, PayMaya, or Bank Transfer
4. Credits will be added to your account

**Pricing**: ~₱1.00 per SMS (may vary)

---

## 🔧 Step 2: Configure Environment Variables

### Create/Update `.env.local` file

In your project root (`client` folder), create or update `.env.local`:

```env
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Semaphore SMS Configuration
NEXT_PUBLIC_SEMAPHORE_API_KEY=your_semaphore_api_key_here
NEXT_PUBLIC_SEMAPHORE_SENDER_NAME=OSCA
```

**Important Notes**:
- Replace `your_semaphore_api_key_here` with your actual API key
- Sender Name must be 11 characters or less
- Sender Name will appear as the sender on recipients' phones

### Restart Your Development Server

After adding the environment variables:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

---

## 📋 Step 3: Files Created

The following files have been created for SMS integration:

### 1. **Configuration** (`lib/config.ts`)
- Added Semaphore API configuration
- Stores API key, sender name, and API URL

### 2. **SMS API Service** (`lib/api/sms.ts`)
- Core SMS sending functionality
- Phone number formatting
- Balance checking
- Error handling

### 3. **SMS Templates** (`lib/utils/sms-templates.ts`)
- Pre-built message templates for:
  - Announcements
  - Appointment reminders
  - Benefit approvals
  - Document notifications
  - Birthday greetings
  - Emergency alerts

### 4. **API Route** (`app/api/sms/send/route.ts`)
- Secure server-side SMS sending
- Protects API key from client exposure
- Validates requests

### 5. **SMS Service** (`lib/services/sms-service.ts`)
- Client-side SMS service
- Fetches senior phone numbers
- Sends SMS via API route

---

## 🎯 Step 4: How to Use in Announcements

### Option A: Add SMS Button to Existing Announcement Modal

Open `components/shared-components/announcements/page.tsx` and add an SMS sending feature.

Here's a simple example of what to add:

```typescript
import { SMSService } from '@/lib/services/sms-service';
import { SMSTemplates } from '@/lib/utils/sms-templates';

// Inside your component, add a function to send SMS
const sendAnnouncementSMS = async (announcement: any) => {
  try {
    // Show loading state
    toast.loading('Sending SMS notifications...');

    // Get phone numbers of seniors in the barangay
    const recipients = await SMSService.getSeniorsPhoneNumbers(
      announcement.barangay
    );

    if (recipients.length === 0) {
      toast.error('No phone numbers found for this barangay');
      return;
    }

    // Prepare announcement data
    const announcementData = {
      title: announcement.title,
      description: announcement.description,
      date: announcement.event_date,
      time: announcement.event_time,
      location: announcement.location,
      barangay: announcement.barangay
    };

    // Send SMS
    const result = await SMSService.sendAnnouncementSMS(
      recipients,
      announcementData
    );

    if (result.success) {
      toast.success(`SMS sent to ${recipients.length} seniors!`);
    } else {
      toast.error('Failed to send SMS: ' + result.message);
    }
  } catch (error) {
    console.error('SMS Error:', error);
    toast.error('Failed to send SMS');
  }
};
```

### Option B: Add SMS Checkbox in Create Announcement Modal

Add a checkbox to send SMS when creating an announcement:

```typescript
// Add to your form state
const [sendSMS, setSendSMS] = useState(false);

// In your form JSX
<div className="flex items-center space-x-2">
  <input
    type="checkbox"
    id="sendSMS"
    checked={sendSMS}
    onChange={(e) => setSendSMS(e.target.checked)}
    className="rounded border-gray-300"
  />
  <label htmlFor="sendSMS" className="text-sm">
    📱 Send SMS notification to seniors
  </label>
</div>

// In your submit handler, after creating announcement
if (sendSMS) {
  await sendAnnouncementSMS(newAnnouncement);
}
```

---

## 📱 Step 5: Testing SMS Integration

### Test with a Single Number First

```typescript
import { SMSService } from '@/lib/services/sms-service';

// Test function
const testSMS = async () => {
  const result = await SMSService.sendSMS(
    [{ number: '09171234567' }], // Your test number
    'Hello! This is a test message from OSCA.'
  );

  console.log('SMS Result:', result);
};
```

### Check Your Semaphore Dashboard
1. Go to https://semaphore.co/
2. Log in to your account
3. Check **Messages** → **Sent Messages**
4. Verify the message was sent
5. Check your **Credits** balance

---

## 💡 Usage Examples

### Example 1: Send Announcement SMS

```typescript
import { SMSService } from '@/lib/services/sms-service';

const recipients = await SMSService.getSeniorsPhoneNumbers('Barangay 1');

const result = await SMSService.sendAnnouncementSMS(recipients, {
  title: 'Community Meeting',
  description: 'Monthly senior citizens meeting',
  date: 'January 15, 2025',
  time: '2:00 PM',
  location: 'Barangay Hall',
  barangay: 'Barangay 1'
});
```

### Example 2: Send Custom Message

```typescript
import { SMSService } from '@/lib/services/sms-service';

const result = await SMSService.sendSMS(
  [
    { number: '09171234567', name: 'Juan Dela Cruz' },
    { number: '09181234567', name: 'Maria Santos' }
  ],
  'Reminder: Please bring your OSCA ID for the event tomorrow.'
);
```

### Example 3: Birthday Greetings

```typescript
import { SMSTemplates } from '@/lib/utils/sms-templates';
import { SMSService } from '@/lib/services/sms-service';

const message = SMSTemplates.birthdayGreeting('Juan Dela Cruz');

await SMSService.sendSMS(
  [{ number: '09171234567' }],
  message
);
```

---

## 🔍 Troubleshooting

### Issue: "SMS service not configured"
**Solution**: Make sure you added `NEXT_PUBLIC_SEMAPHORE_API_KEY` to `.env.local` and restarted the server.

### Issue: "No valid phone numbers provided"
**Solution**: Check that phone numbers are in correct format:
- ✅ 09171234567
- ✅ 639171234567
- ✅ +639171234567
- ❌ 917-123-4567 (will be auto-formatted)

### Issue: SMS not received
**Possible causes**:
1. Invalid phone number
2. Insufficient credits in Semaphore account
3. Network issues
4. Phone is off or out of coverage

**Check**:
- Semaphore dashboard for delivery status
- Your credits balance
- Phone number format

### Issue: "API key not found"
**Solution**: 
1. Check `.env.local` file exists in `client` folder
2. Verify variable name is exactly `NEXT_PUBLIC_SEMAPHORE_API_KEY`
3. Restart development server

---

## 📊 Monitoring & Analytics

### Check SMS Credits Balance

```typescript
import { SemaphoreSMSAPI } from '@/lib/api/sms';

const checkBalance = async () => {
  const result = await SemaphoreSMSAPI.checkBalance();
  
  if (result.success) {
    console.log('Credits remaining:', result.balance);
  }
};
```

### Track SMS Delivery

Check your Semaphore dashboard:
- **Messages** → **Sent Messages**: View all sent SMS
- **Reports**: See delivery rates and statistics
- **Credits**: Monitor usage and balance

---

## 💰 Cost Estimation

### SMS Pricing (Approximate)
- **1 SMS** (160 characters): ₱1.00
- **2 SMS** (161-320 characters): ₱2.00
- **3 SMS** (321-480 characters): ₱3.00

### Example Costs
- **100 seniors** × 1 SMS = ₱100
- **500 seniors** × 1 SMS = ₱500
- **1000 seniors** × 1 SMS = ₱1,000

### Recommended Package
- Start with **₱500 credits** (~500 SMS)
- Monitor usage for first month
- Adjust based on announcement frequency

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env.local`** to Git
2. ✅ **Use API routes** for SMS sending (not client-side)
3. ✅ **Validate phone numbers** before sending
4. ✅ **Rate limit** SMS sending to prevent abuse
5. ✅ **Log SMS activity** for auditing

---

## 📞 Support

### Semaphore Support
- Website: https://semaphore.co/
- Email: support@semaphore.co
- Phone: (02) 8395-2639

### Documentation
- API Docs: https://semaphore.co/docs
- FAQs: https://semaphore.co/faqs

---

## ✅ Next Steps

1. ✅ Get Semaphore API key
2. ✅ Add to `.env.local`
3. ✅ Restart server
4. ✅ Test with your phone number
5. ✅ Integrate with announcements
6. ✅ Monitor usage and credits

**Your SMS integration is ready to use!** 🎉
