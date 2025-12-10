# Troubleshooting Activity Logs

## 🔍 Step-by-Step Debugging Guide

### Step 1: Verify Database Table Exists

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Run this query:**
```sql
-- Check if activity_logs table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'activity_logs'
);
```

**Expected Result:** Should return `true`

**If it returns `false`:**
- ❌ The table doesn't exist
- ✅ **Solution:** Run the migration manually:
  1. Open `supabase/migrations/20241210_activity_logs.sql`
  2. Copy ALL the contents
  3. Paste in SQL Editor
  4. Click **Run**

### Step 2: Check Table Structure

```sql
-- Check table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_logs'
ORDER BY ordinal_position;
```

**Expected Columns:**
- id (uuid)
- user_id (uuid)
- user_role (varchar)
- user_name (varchar)
- user_email (varchar)
- action (varchar)
- entity_type (varchar)
- entity_id (uuid)
- entity_name (varchar)
- description (text)
- old_values (jsonb)
- new_values (jsonb)
- ip_address (inet)
- user_agent (text)
- barangay (varchar)
- created_at (timestamp)

### Step 3: Test Direct Insert

```sql
-- Try inserting a test log directly
INSERT INTO activity_logs (
  user_role,
  user_name,
  action,
  entity_type,
  entity_name,
  description
) VALUES (
  'senior',
  'Test User',
  'create',
  'benefit',
  'Test Benefit',
  'Test log entry'
);

-- Check if it was inserted
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 1;
```

**If this fails:**
- Check the error message
- Might be a constraint violation
- Check RLS policies

### Step 4: Check RLS Policies

```sql
-- View RLS policies
SELECT * FROM pg_policies WHERE tablename = 'activity_logs';
```

**Expected Policies:**
1. "OSCA can view all activity logs" (SELECT)
2. "BASCA can view barangay activity logs" (SELECT)
3. "Seniors can view own activity logs" (SELECT)
4. "System can insert activity logs" (INSERT)

**If policies are missing:**
- Run the migration again
- Or create them manually

### Step 5: Check Browser Console

1. **Open Browser Console** (Press F12)
2. **Go to Console tab**
3. **Try creating a benefit**
4. **Look for these messages:**

✅ **Success messages:**
```
🔍 Attempting to log benefit creation: {...}
📝 Inserting activity log: {...}
✅ Activity log inserted successfully: {...}
✅ Activity log created: {...}
```

❌ **Error messages to look for:**
```
❌ Failed to insert activity log: {...}
❌ Failed to log activity: {...}
Error code: ...
Error message: ...
```

### Step 6: Common Errors & Solutions

#### Error: "relation 'activity_logs' does not exist"
**Cause:** Table not created
**Solution:** Run the migration:
```bash
npx supabase db push
```

#### Error: "new row violates row-level security policy"
**Cause:** RLS policy blocking insert
**Solution:** Check if INSERT policy exists:
```sql
-- Add INSERT policy if missing
CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

#### Error: "null value in column 'user_role' violates not-null constraint"
**Cause:** user_role is not being set
**Solution:** Check if user has a role in the users table:
```sql
SELECT id, email, role FROM users WHERE id = auth.uid();
```

#### Error: "permission denied for table activity_logs"
**Cause:** RLS is enabled but no policies allow access
**Solution:** Temporarily disable RLS to test:
```sql
-- ONLY FOR TESTING - Re-enable after testing!
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Try your operation

-- Re-enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
```

### Step 7: Check Network Requests

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Filter by "activity"**
4. **Create a benefit**
5. **Look for POST request to activity_logs**

**Check:**
- Status code (should be 200 or 201)
- Response body (should contain the inserted log)
- Request payload (should contain log data)

### Step 8: Verify User Authentication

```sql
-- Check current user
SELECT auth.uid() as user_id, auth.email() as user_email;

-- Check user details
SELECT * FROM users WHERE id = auth.uid();
```

**Make sure:**
- User is authenticated
- User has a role (osca, basca, or senior)
- User exists in users table

### Step 9: Test with Simple Log

Create a test page to isolate the issue:

```typescript
// Test page: app/test-logging/page.tsx
'use client';

import { ActivityLogger } from '@/lib/services/activity-logger';
import { Button } from '@/components/ui/button';

export default function TestLogging() {
  const testLog = async () => {
    try {
      console.log('Testing activity log...');
      
      const result = await ActivityLogger.log({
        user_role: 'senior',
        user_name: 'Test User',
        action: 'create',
        entity_type: 'benefit',
        entity_name: 'Test Benefit',
        description: 'This is a test log'
      } as any);
      
      console.log('Result:', result);
      alert('Check console for result');
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test Activity Logging</h1>
      <Button onClick={testLog}>Test Log</Button>
    </div>
  );
}
```

Navigate to: `http://localhost:3000/test-logging`

### Step 10: Check Supabase Logs

1. **Go to Supabase Dashboard**
2. **Navigate to Logs**
3. **Select "Postgres Logs"**
4. **Look for errors related to activity_logs**

## 🎯 Quick Checklist

Run through this checklist:

- [ ] Migrations ran successfully (`npx supabase db push`)
- [ ] `activity_logs` table exists in database
- [ ] Table has all required columns
- [ ] RLS policies are set up
- [ ] User is authenticated
- [ ] User has a role in users table
- [ ] Browser console shows no errors
- [ ] Network tab shows successful POST request
- [ ] Direct SQL insert works

## 📞 Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Share the error message** from browser console
2. **Share the error** from Supabase logs
3. **Check if benefit creation itself works** (without logging)
4. **Try the test page** to isolate the issue

## 🔧 Nuclear Option: Reset Everything

If nothing works, try this:

```sql
-- Drop and recreate the table
DROP TABLE IF EXISTS activity_logs CASCADE;

-- Then run the migration again
```

Then copy and paste the entire contents of `supabase/migrations/20241210_activity_logs.sql` into SQL Editor and run it.

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Browser console shows "✅ Activity log inserted successfully"
2. ✅ SQL query `SELECT * FROM activity_logs` returns rows
3. ✅ Activity logs page shows the entries
4. ✅ No errors in browser console
5. ✅ No errors in Supabase logs

Good luck! 🚀
