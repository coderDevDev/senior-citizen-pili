# Activity Logs & Soft Delete - Deployment Guide

## 🎉 Implementation Complete!

All core files have been created. Follow this guide to deploy the system.

## ✅ What Has Been Created

### Database Files
- ✅ `supabase/migrations/20241210_activity_logs.sql`
- ✅ `supabase/migrations/20241210_soft_delete.sql`

### Backend Services
- ✅ `types/activity-logs.ts`
- ✅ `lib/services/activity-logger.ts`
- ✅ `lib/api/activity-logs.ts`

### UI Pages - Activity Logs
- ✅ `app/dashboard/osca/activity-logs/page.tsx`
- ✅ `app/dashboard/basca/activity-logs/page.tsx`
- ✅ `app/dashboard/senior/activity-logs/page.tsx`

### UI Pages - Recently Deleted
- ✅ `app/dashboard/osca/deleted/page.tsx`
- ✅ `app/dashboard/basca/deleted/page.tsx`

## 🚀 Deployment Steps

### Step 1: Run Database Migrations (5 minutes)

#### Option A: Using Supabase CLI (Recommended)
```bash
# Navigate to project directory
cd "c:\Users\ACER\Desktop\2025 Capstone Project\SENIOR\client"

# Push migrations to Supabase
npx supabase db push
```

#### Option B: Manual via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Open `supabase/migrations/20241210_activity_logs.sql`
5. Copy all contents and paste into SQL Editor
6. Click **Run**
7. Repeat for `supabase/migrations/20241210_soft_delete.sql`

### Step 2: Verify Database Setup (2 minutes)

Run this query in SQL Editor to verify:
```sql
-- Check if activity_logs table exists
SELECT * FROM activity_logs LIMIT 1;

-- Check if soft delete columns exist
SELECT deleted_at, deleted_by, delete_reason 
FROM announcements LIMIT 1;
```

### Step 3: Test Activity Logging (10 minutes)

Add logging to one feature to test. Example with announcements:

```typescript
// In your announcements API file
import { ActivityLogger } from '@/lib/services/activity-logger';

// After creating an announcement
const newAnnouncement = await supabase
  .from('announcements')
  .insert(data)
  .select()
  .single();

// Log the activity
await ActivityLogger.logAnnouncementActivity(
  'create',
  newAnnouncement.data.id,
  newAnnouncement.data.title,
  undefined,
  newAnnouncement.data
);
```

### Step 4: Access the New Pages

Navigate to these URLs to test:

**Activity Logs:**
- OSCA: `http://localhost:3000/dashboard/osca/activity-logs`
- BASCA: `http://localhost:3000/dashboard/basca/activity-logs`
- Senior: `http://localhost:3000/dashboard/senior/activity-logs`

**Recently Deleted:**
- OSCA: `http://localhost:3000/dashboard/osca/deleted`
- BASCA: `http://localhost:3000/dashboard/basca/deleted`

### Step 5: Add Navigation Links (Optional)

Add these links to your sidebar navigation:

```typescript
// For OSCA sidebar
{
  name: 'Activity Logs',
  href: '/dashboard/osca/activity-logs',
  icon: Activity
},
{
  name: 'Recently Deleted',
  href: '/dashboard/osca/deleted',
  icon: Trash2
}

// For BASCA sidebar
{
  name: 'Activity Logs',
  href: '/dashboard/basca/activity-logs',
  icon: Activity
},
{
  name: 'Recently Deleted',
  href: '/dashboard/basca/deleted',
  icon: Trash2
}

// For Senior sidebar
{
  name: 'My Activity',
  href: '/dashboard/senior/activity-logs',
  icon: Activity
}
```

## 🔧 Integration Guide

### How to Add Logging to Your APIs

#### 1. Benefits API
```typescript
import { ActivityLogger } from '@/lib/services/activity-logger';

// When creating a benefit application
await ActivityLogger.logBenefitActivity(
  'create',
  benefit.id,
  benefit.benefit_type,
  seniorName,
  undefined,
  benefit
);

// When approving
await ActivityLogger.logBenefitActivity(
  'approve',
  benefit.id,
  benefit.benefit_type,
  seniorName,
  oldBenefit,
  updatedBenefit
);
```

#### 2. Documents API
```typescript
// When creating a document request
await ActivityLogger.logDocumentActivity(
  'create',
  document.id,
  document.document_type,
  seniorName,
  undefined,
  document
);

// When approving
await ActivityLogger.logDocumentActivity(
  'approve',
  document.id,
  document.document_type,
  seniorName,
  oldDocument,
  updatedDocument
);
```

#### 3. Appointments API
```typescript
// When creating an appointment
await ActivityLogger.logAppointmentActivity(
  'create',
  appointment.id,
  appointment.appointment_type,
  seniorName,
  appointment.appointment_date,
  undefined,
  appointment
);
```

### How to Convert to Soft Delete

#### Before (Hard Delete):
```typescript
async deleteAnnouncement(id: string) {
  await supabase.from('announcements').delete().eq('id', id);
}
```

#### After (Soft Delete):
```typescript
async deleteAnnouncement(id: string, reason?: string) {
  // Get the item first
  const { data: announcement } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();
    
  if (!announcement) throw new Error('Not found');
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Soft delete
  await supabase
    .from('announcements')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user?.id,
      delete_reason: reason
    })
    .eq('id', id);
    
  // Log activity
  await ActivityLogger.logAnnouncementActivity(
    'delete',
    id,
    announcement.title,
    announcement,
    null
  );
}
```

### How to Add Restore Function

```typescript
async restoreAnnouncement(id: string) {
  const { data: announcement } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();
    
  if (!announcement) throw new Error('Not found');
  
  // Restore
  await supabase
    .from('announcements')
    .update({
      deleted_at: null,
      deleted_by: null,
      delete_reason: null
    })
    .eq('id', id);
    
  // Log activity
  await ActivityLogger.logAnnouncementActivity(
    'restore',
    id,
    announcement.title,
    null,
    announcement
  );
  
  return announcement;
}
```

### Update Queries to Exclude Deleted Items

```typescript
// Before
const { data } = await supabase
  .from('announcements')
  .select('*');

// After
const { data } = await supabase
  .from('announcements')
  .select('*')
  .is('deleted_at', null);  // Only get non-deleted items
```

## 📊 Features Overview

### Activity Logs
- ✅ Track all user actions
- ✅ Filter by action, entity type, date
- ✅ Search functionality
- ✅ Export to CSV/JSON
- ✅ Role-based access control
- ✅ Statistics dashboard

### Soft Delete
- ✅ 30-day grace period
- ✅ Restore functionality
- ✅ Track who deleted and why
- ✅ Auto-cleanup after 30 days
- ✅ Permanent delete option

## 🧪 Testing Checklist

- [ ] Run database migrations successfully
- [ ] Verify activity_logs table exists
- [ ] Verify soft delete columns exist
- [ ] Test creating an activity log
- [ ] Access Activity Logs page (OSCA)
- [ ] Access Activity Logs page (BASCA)
- [ ] Access Activity Logs page (Senior)
- [ ] Access Recently Deleted page (OSCA)
- [ ] Access Recently Deleted page (BASCA)
- [ ] Test soft delete functionality
- [ ] Test restore functionality
- [ ] Test permanent delete
- [ ] Test filters and search
- [ ] Test export to CSV
- [ ] Test export to JSON
- [ ] Test pagination
- [ ] Verify RLS policies work correctly

## 🎯 Next Steps

1. **Run the migrations** (Step 1)
2. **Test one feature** (e.g., announcements)
3. **Add navigation links** (Step 5)
4. **Integrate logging** into all APIs gradually
5. **Update all delete operations** to soft delete
6. **Test thoroughly** with all three roles

## 💡 Pro Tips

1. **Start Small**: Test with announcements first before rolling out to all features
2. **Check Logs**: Monitor the activity_logs table to see if logging is working
3. **Test RLS**: Make sure BASCA can only see their barangay logs
4. **Export Data**: Use the export feature to backup activity logs
5. **Auto-Cleanup**: The system will auto-delete items after 30 days

## 🐛 Troubleshooting

### Issue: Migrations fail
**Solution**: Check if tables already exist. Drop and recreate if needed.

### Issue: Activity logs not appearing
**Solution**: Check if RLS policies are set correctly. Verify user role.

### Issue: Can't restore items
**Solution**: Verify the user has permission. Check foreign key constraints.

### Issue: Export not working
**Solution**: Check browser console for errors. Verify data is loading.

## 📞 Support

If you encounter issues:
1. Check the implementation guide
2. Review the code examples
3. Test with a simple feature first
4. Check Supabase logs for errors

## 🎉 Success!

Once deployed, you'll have:
- ✅ Complete audit trail of all actions
- ✅ Safety net for accidental deletions
- ✅ Compliance with data retention policies
- ✅ Easy debugging and troubleshooting
- ✅ User activity analytics

Good luck with the deployment! 🚀
