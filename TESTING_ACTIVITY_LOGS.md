# Testing Activity Logs - Quick Guide

## 🧪 How to Test the Activity Logs System

### Prerequisites
1. ✅ Run database migrations first:
```bash
cd "c:\Users\ACER\Desktop\2025 Capstone Project\SENIOR\client"
npx supabase db push
```

2. ✅ Make sure your dev server is running:
```bash
npm run dev
```

## 📝 Step-by-Step Testing

### Test 1: Create a Benefit Application (Senior Role)

1. **Navigate to Benefits Page**
   - Go to: `http://localhost:3000/dashboard/senior/benefits`
   - Click "Apply for Benefit" button

2. **Fill Out the Form**
   - Select benefit type (e.g., "Social Pension")
   - Fill in purpose
   - Submit the form

3. **Check Activity Logs**
   - Navigate to: `http://localhost:3000/dashboard/senior/activity-logs`
   - You should see a new log entry:
     - ✅ Action: "Created" (green badge)
     - ✅ Entity: "Benefit Application"
     - ✅ Description: "Applied for social_pension benefit"

### Test 2: View Activity Logs (OSCA Role)

1. **Login as OSCA**
   - Navigate to: `http://localhost:3000/dashboard/osca/activity-logs`

2. **You Should See:**
   - ✅ All activities from all users
   - ✅ Statistics dashboard (Total, Today, Last 24h)
   - ✅ Filters (Action, Entity Type, Search)
   - ✅ Color-coded action badges

3. **Test Filters:**
   - Filter by "Create" action
   - Filter by "Benefit" entity type
   - Search for a senior's name

4. **Test Export:**
   - Click "Export CSV" button
   - Click "Export JSON" button
   - Files should download automatically

### Test 3: Approve a Benefit (OSCA Role)

1. **Go to Benefits Page**
   - Navigate to: `http://localhost:3000/dashboard/osca/benefits`
   - Find a pending benefit application

2. **Approve It**
   - Click on the benefit
   - Change status to "Approved"
   - Enter amount if needed
   - Save

3. **Check Activity Logs**
   - Go back to: `http://localhost:3000/dashboard/osca/activity-logs`
   - You should see TWO new entries:
     - ✅ One from the senior (create)
     - ✅ One from OSCA (approve)

### Test 4: View Activity Logs (BASCA Role)

1. **Login as BASCA**
   - Navigate to: `http://localhost:3000/dashboard/basca/activity-logs`

2. **You Should See:**
   - ✅ Only activities from your barangay
   - ✅ Stats for your barangay only
   - ✅ Same filters and export features

### Test 5: Check Database

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Go to Table Editor

2. **Check activity_logs Table**
   - You should see entries for each action
   - Check columns:
     - `user_name` - Who did it
     - `action` - What they did
     - `entity_type` - What was affected
     - `description` - Human-readable description
     - `created_at` - When it happened

## 🎯 What to Look For

### ✅ Success Indicators

1. **Activity Logs Page Loads**
   - No errors in console
   - Stats cards show numbers
   - Logs list appears

2. **New Logs Appear After Actions**
   - Create benefit → See "Created" log
   - Approve benefit → See "Approved" log
   - Update benefit → See "Updated" log

3. **Filters Work**
   - Selecting action filters the list
   - Selecting entity type filters the list
   - Search finds relevant logs

4. **Export Works**
   - CSV file downloads
   - JSON file downloads
   - Files contain log data

5. **Role-Based Access Works**
   - OSCA sees all logs
   - BASCA sees only barangay logs
   - Senior sees only their own logs

### ❌ Common Issues & Solutions

#### Issue 1: "activity_logs table doesn't exist"
**Solution:** Run the migrations:
```bash
npx supabase db push
```

#### Issue 2: "No logs appearing"
**Check:**
1. Did you run the migrations?
2. Did the benefit creation succeed?
3. Check browser console for errors
4. Check Supabase logs

#### Issue 3: "Permission denied"
**Solution:** Check RLS policies in Supabase:
```sql
-- Run this in SQL Editor
SELECT * FROM activity_logs LIMIT 1;
```

#### Issue 4: "Page shows 0 activities"
**Possible Reasons:**
1. No activities created yet (create a benefit first)
2. RLS policies blocking access
3. User not authenticated properly

## 🔍 Debugging Tips

### Check Browser Console
```javascript
// Open browser console (F12)
// Look for errors related to:
- "activity_logs"
- "Failed to log activity"
- "RLS policy"
```

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "activity"
4. Look for failed requests

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to Logs
3. Look for errors related to activity_logs table

## 📊 Expected Results

### After Creating 1 Benefit Application:

**Activity Logs Page Should Show:**
- Total Activities: 1
- Today: 1
- Last 24h: 1
- One log entry with:
  - Green "Created" badge
  - "Benefit Application" entity type
  - Your name as the user
  - Timestamp

### After OSCA Approves It:

**Activity Logs Page Should Show:**
- Total Activities: 2
- Today: 2
- Last 24h: 2
- Two log entries:
  1. Senior's "Created" action
  2. OSCA's "Approved" action

## 🎉 Success Criteria

You've successfully tested the system when:
- ✅ Activity logs page loads without errors
- ✅ Creating a benefit creates a log entry
- ✅ Log entry shows correct user, action, and description
- ✅ Filters work correctly
- ✅ Export functions work
- ✅ Role-based access is enforced
- ✅ Stats are accurate

## 📞 Need Help?

If logs aren't appearing:
1. Check if migrations ran successfully
2. Verify the benefit was created successfully
3. Check browser console for errors
4. Check Supabase logs
5. Verify RLS policies are set correctly

## 🚀 Next Steps

Once testing is successful:
1. Add logging to Documents API
2. Add logging to Appointments API
3. Add logging to Announcements API
4. Test Recently Deleted feature
5. Add navigation menu links

Good luck with testing! 🎯
