# 📱 Dual SMS Provider Setup Guide

## Overview
Your OSCA system now supports **TWO SMS providers**:
1. **iProg Tech SMS** (Default) - https://sms.iprogtech.com
2. **Semaphore SMS** (Alternative) - https://semaphore.co

You can easily switch between providers by changing one environment variable!

---

## 🎯 Default Provider: iProg Tech SMS

### Why iProg Tech as Default?
- ✅ **₱1 per SMS** - Affordable pricing
- ✅ **Philippine-based** - Local support
- ✅ **Simple API** - Easy to use
- ✅ **Pay-as-you-go** - No monthly fees
- ✅ **Bulk SMS support** - Send to multiple recipients
- ✅ **Real-time credits** - Check balance anytime

---

## 🚀 Quick Setup

### Option 1: iProg Tech (Default - Recommended)

#### Step 1: Get iProg Tech Account
1. Go to https://sms.iprogtech.com
2. Sign up for an account
3. Verify your email
4. Log in to dashboard

#### Step 2: Get API Token
1. Go to **Settings** → **API Token**
2. Copy your API Token
3. Load credits (₱100 minimum)

#### Step 3: Add to `.env.local`

```env
# SMS Provider Selection (iprogtech or semaphore)
NEXT_PUBLIC_SMS_PROVIDER=iprogtech

# iProg Tech SMS Configuration (Default)
NEXT_PUBLIC_IPROGTECH_API_TOKEN=your_iprogtech_api_token_here
```

#### Step 4: Restart Server

```bash
npm run dev
```

**That's it! You're ready to send SMS!** ✅

---

### Option 2: Semaphore (Alternative)

#### Step 1: Get Semaphore Account
1. Go to https://semaphore.co
2. Sign up for an account
3. Get your API Key from dashboard
4. Load credits

#### Step 2: Add to `.env.local`

```env
# SMS Provider Selection
NEXT_PUBLIC_SMS_PROVIDER=semaphore

# Semaphore SMS Configuration
NEXT_PUBLIC_SEMAPHORE_API_KEY=your_semaphore_api_key_here
NEXT_PUBLIC_SEMAPHORE_SENDER_NAME=OSCA
```

#### Step 3: Restart Server

```bash
npm run dev
```

---

## 🔄 Switching Between Providers

### Switch to iProg Tech:
```env
NEXT_PUBLIC_SMS_PROVIDER=iprogtech
NEXT_PUBLIC_IPROGTECH_API_TOKEN=your_token_here
```

### Switch to Semaphore:
```env
NEXT_PUBLIC_SMS_PROVIDER=semaphore
NEXT_PUBLIC_SEMAPHORE_API_KEY=your_key_here
NEXT_PUBLIC_SEMAPHORE_SENDER_NAME=OSCA
```

**Just change `NEXT_PUBLIC_SMS_PROVIDER` and restart!**

---

## 📋 Complete `.env.local` Example

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ===== SMS CONFIGURATION =====

# SMS Provider: 'iprogtech' or 'semaphore'
NEXT_PUBLIC_SMS_PROVIDER=iprogtech

# iProg Tech SMS (Default Provider)
NEXT_PUBLIC_IPROGTECH_API_TOKEN=your_iprogtech_api_token_here

# Semaphore SMS (Alternative Provider)
# NEXT_PUBLIC_SEMAPHORE_API_KEY=your_semaphore_api_key_here
# NEXT_PUBLIC_SEMAPHORE_SENDER_NAME=OSCA
```

---

## 💰 Pricing Comparison

### iProg Tech SMS
- **₱1.00 per SMS** (160 characters)
- **No monthly fees**
- **Pay-as-you-go**
- **Minimum load**: ₱100
- **Local support**: Yes (Philippine-based)

### Semaphore SMS
- **~₱1.00 per SMS** (160 characters)
- **No monthly fees**
- **Pay-as-you-go**
- **Minimum load**: ₱500
- **International support**: Yes

**Both providers have similar pricing!**

---

## 🎯 Features Comparison

| Feature | iProg Tech | Semaphore |
|---------|-----------|-----------|
| Single SMS | ✅ | ✅ |
| Bulk SMS | ✅ | ✅ |
| Credits Check | ✅ | ✅ |
| Delivery Status | ✅ | ✅ |
| Philippine Numbers | ✅ | ✅ |
| API Documentation | ✅ | ✅ |
| Local Support | ✅ | ❌ |
| Pricing | ₱1/SMS | ~₱1/SMS |

---

## 🔧 How It Works

### Architecture:
```
Announcement Form
       ↓
   SMS Service (client/lib/services/sms-service.ts)
       ↓
   API Route (app/api/sms/send/route.ts)
       ↓
   Provider Selection (based on NEXT_PUBLIC_SMS_PROVIDER)
       ↓
   ┌─────────────┬─────────────┐
   ↓             ↓             ↓
iProg Tech   Semaphore    (Future providers)
```

### Code Flow:
1. User creates announcement with "Send SMS" checked
2. `SMSService` calls `/api/sms/send` with provider info
3. API route checks `NEXT_PUBLIC_SMS_PROVIDER`
4. Routes to appropriate provider function
5. Sends SMS and returns result
6. Success notification shown to user

---

## 📱 Testing

### Test with iProg Tech:
1. Set `NEXT_PUBLIC_SMS_PROVIDER=iprogtech`
2. Add your iProg Tech API token
3. Click "Test SMS" button
4. Enter your phone number
5. Click "Send Test SMS"
6. Check your phone! 📱

### Test with Semaphore:
1. Set `NEXT_PUBLIC_SMS_PROVIDER=semaphore`
2. Add your Semaphore API key
3. Click "Test SMS" button
4. Enter your phone number
5. Click "Send Test SMS"
6. Check your phone! 📱

---

## 🎨 What's Updated

### Files Modified:

1. **`lib/config.ts`** ✅
   - Added dual provider configuration
   - iProg Tech as default
   - Semaphore as alternative

2. **`lib/services/sms-service.ts`** ✅
   - Added `getProvider()` method
   - Added `isConfigured()` method
   - Updated `sendSMS()` to pass provider

3. **`app/api/sms/send/route.ts`** ✅
   - Added `sendViaIProgTech()` function
   - Added `sendViaSemaphore()` function
   - Provider routing logic
   - Credits balance checking

---

## ✅ Existing Features Still Work

### All SMS features remain functional:
- ✅ **Test SMS button** - Works with both providers
- ✅ **Announcement SMS** - Sends via selected provider
- ✅ **Bulk SMS** - Multiple recipients supported
- ✅ **Credits tracking** - Shows remaining balance
- ✅ **Error handling** - Graceful failures
- ✅ **Phone formatting** - Automatic Philippine format

### No Breaking Changes!
- ✅ All existing code works
- ✅ No database changes needed
- ✅ No UI changes required
- ✅ Just add environment variables

---

## 🔍 Troubleshooting

### Issue: "SMS service not configured"
**Solution**: 
- Check `.env.local` has the correct provider token
- Verify `NEXT_PUBLIC_SMS_PROVIDER` is set
- Restart development server

### Issue: "Invalid SMS provider"
**Solution**:
- Must be either `iprogtech` or `semaphore`
- Check spelling in `.env.local`

### Issue: SMS not sending
**Check**:
1. API token/key is correct
2. Credits balance is sufficient
3. Phone number is valid Philippine format
4. Provider service is online

---

## 📊 Monitoring

### Check Credits Balance:

#### iProg Tech:
```
GET https://sms.iprogtech.com/api/v1/account/sms_credits?api_token=YOUR_TOKEN
```

#### Semaphore:
```
GET https://api.semaphore.co/api/v4/account?apikey=YOUR_KEY
```

### In Your App:
- Success toast shows credits remaining
- Test SMS modal displays balance
- Logs show provider being used

---

## 🎯 Recommendations

### For Production:
1. ✅ **Use iProg Tech** (Default)
   - Local support
   - Same pricing
   - Philippine-based

2. ✅ **Keep Semaphore as backup**
   - Add both tokens to `.env.local`
   - Switch if one provider has issues
   - Redundancy is good!

### Load Credits:
- Start with ₱500 for testing
- Monitor usage for first month
- Adjust based on announcement frequency

---

## 🚀 Next Steps

### Immediate:
1. ✅ Get iProg Tech API token
2. ✅ Add to `.env.local`
3. ✅ Restart server
4. ✅ Test SMS with your phone

### Optional:
1. Get Semaphore API key (backup)
2. Test both providers
3. Choose preferred provider
4. Monitor credits usage

---

## 📞 Support

### iProg Tech Support:
- Website: https://sms.iprogtech.com
- Email: support@iprogtech.com
- Documentation: https://sms.iprogtech.com/api/v1/documentation

### Semaphore Support:
- Website: https://semaphore.co
- Email: support@semaphore.co
- Phone: (02) 8395-2639

---

## ✅ Summary

**What Changed:**
- ✅ Added iProg Tech SMS support (Default)
- ✅ Kept Semaphore SMS support (Alternative)
- ✅ Easy provider switching
- ✅ No breaking changes

**What You Need:**
- ⏳ iProg Tech API token (or Semaphore API key)
- ⏳ Add to `.env.local`
- ⏳ Restart server

**Result:**
- 🎉 Dual SMS provider support
- 🎉 Flexible and reliable
- 🎉 All features working
- 🎉 Easy to switch providers

**Your SMS system now supports both providers and defaults to iProg Tech!** 📱✅
