# Activity Logs & Soft Delete Implementation Guide

## 📋 Overview

This guide explains how to implement the Activity Logs and Soft Delete (Recently Deleted) features in your Senior Citizen Management System.

## ✅ What Has Been Created

### 1. Database Migrations
- ✅ `supabase/migrations/20241210_activity_logs.sql` - Activity logs table
- ✅ `supabase/migrations/20241210_soft_delete.sql` - Soft delete columns

### 2. TypeScript Types
- ✅ `types/activity-logs.ts` - All type definitions

### 3. Services & APIs
- ✅ `lib/services/activity-logger.ts` - Core logging service
- ✅ `lib/api/activity-logs.ts` - API functions

## 🚀 Step-by-Step Implementation

### Step 1: Run Database Migrations

```bash
# Navigate to your project directory
cd "c:\Users\ACER\Desktop\2025 Capstone Project\SENIOR\client"

# Run migrations using Supabase CLI
npx supabase db push

# Or manually run the SQL files in Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to SQL Editor
# 4. Copy and paste the contents of each migration file
# 5. Click "Run"
```

### Step 2: Test Activity Logging

Add logging to an existing function (example with announcements):

```typescript
// In your announcements API file
import { ActivityLogger } from '@/lib/services/activity-logger';

// When creating an announcement
async createAnnouncement(data: AnnouncementData) {
  // Create the announcement
  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert(data)
    .select()
    .single();
    
  if (error) throw error;
  
  // Log the activity
  await ActivityLogger.logAnnouncementActivity(
    'create',
    announcement.id,
    announcement.title,
    undefined,
    announcement
  );
  
  return announcement;
}

// When deleting an announcement (soft delete)
async deleteAnnouncement(id: string, reason?: string) {
  // Get the announcement first
  const { data: announcement } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();
    
  if (!announcement) throw new Error('Announcement not found');
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Soft delete
  const { error } = await supabase
    .from('announcements')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user?.id,
      delete_reason: reason
    })
    .eq('id', id);
    
  if (error) throw error;
  
  // Log the activity
  await ActivityLogger.logAnnouncementActivity(
    'delete',
    id,
    announcement.title,
    announcement,
    null
  );
  
  return true;
}

// Restore deleted announcement
async restoreAnnouncement(id: string) {
  const { data: announcement } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();
    
  if (!announcement) throw new Error('Announcement not found');
  
  // Restore
  const { error } = await supabase
    .from('announcements')
    .update({
      deleted_at: null,
      deleted_by: null,
      delete_reason: null
    })
    .eq('id', id);
    
  if (error) throw error;
  
  // Log the activity
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

### Step 3: Update Existing Queries to Exclude Deleted Items

```typescript
// Before (shows all records)
const { data } = await supabase
  .from('announcements')
  .select('*')
  .order('created_at', { ascending: false });

// After (excludes deleted records)
const { data } = await supabase
  .from('announcements')
  .select('*')
  .is('deleted_at', null)  // Only get non-deleted items
  .order('created_at', { ascending: false });
```

### Step 4: Create Activity Logs UI Page

Create a new page for each role:

```typescript
// app/dashboard/osca/activity-logs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ActivityLogsAPI } from '@/lib/api/activity-logs';
import type { ActivityLog, ActivityLogFilters } from '@/types/activity-logs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ACTION_COLORS, ACTION_LABELS, ENTITY_TYPE_LABELS } from '@/types/activity-logs';
import { Download, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ActivityLogFilters>({
    page: 1,
    limit: 20
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await ActivityLogsAPI.getActivityLogs(filters);
      setLogs(result.logs);
      setTotal(result.total);
      setPages(result.pages);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        content = await ActivityLogsAPI.exportToCSV(filters);
        filename = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        content = await ActivityLogsAPI.exportToJSON(filters);
        filename = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${format.toUpperCase()} successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export logs');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">Activity Logs</h1>
          <p className="text-[#666666] mt-2">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, action: value === 'all' ? undefined : value as any, page: 1 })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="restore">Restore</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.entity_type || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, entity_type: value === 'all' ? undefined : value as any, page: 1 })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="benefit">Benefits</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="appointment">Appointments</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="senior_citizen">Senior Citizens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => setFilters({ page: 1, limit: 20 })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Activity History ({total} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto"></div>
              <p className="text-[#666666] mt-4">Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-[#666666]">
              No activity logs found
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={ACTION_COLORS[log.action]}>
                          {ACTION_LABELS[log.action]}
                        </Badge>
                        <Badge variant="outline">
                          {ENTITY_TYPE_LABELS[log.entity_type]}
                        </Badge>
                        {log.barangay && (
                          <Badge variant="secondary">{log.barangay}</Badge>
                        )}
                      </div>
                      <p className="font-medium text-[#333333] mb-1">
                        {log.description}
                      </p>
                      <p className="text-sm text-[#666666]">
                        by {log.user_name} ({log.user_role})
                      </p>
                      {log.entity_name && (
                        <p className="text-sm text-[#888888] mt-1">
                          Entity: {log.entity_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-[#888888]">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div>{new Date(log.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-[#666666]">
                Page {filters.page} of {pages}
              </span>
              <Button
                variant="outline"
                disabled={filters.page === pages}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 5: Create Recently Deleted Page

```typescript
// app/dashboard/osca/deleted/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ActivityLogger } from '@/lib/services/activity-logger';

export default function RecentlyDeletedPage() {
  const [deletedAnnouncements, setDeletedAnnouncements] = useState<any[]>([]);
  const [deletedDocuments, setDeletedDocuments] = useState<any[]>([]);
  const [deletedAppointments, setDeletedAppointments] = useState<any[]>([]);
  const [deletedBenefits, setDeletedBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreDialog, setRestoreDialog] = useState<{ open: boolean; item: any; type: string }>({
    open: false,
    item: null,
    type: ''
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: any; type: string }>({
    open: false,
    item: null,
    type: ''
  });

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const loadDeletedItems = async () => {
    setLoading(true);
    try {
      // Load deleted announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*, deleted_by_user:users!announcements_deleted_by_fkey(first_name, last_name)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      // Load deleted documents
      const { data: documents } = await supabase
        .from('document_requests')
        .select('*, deleted_by_user:users!document_requests_deleted_by_fkey(first_name, last_name), senior_citizens(first_name, last_name)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      // Load deleted appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, deleted_by_user:users!appointments_deleted_by_fkey(first_name, last_name), senior_citizens(first_name, last_name)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      // Load deleted benefits
      const { data: benefits } = await supabase
        .from('benefit_applications')
        .select('*, deleted_by_user:users!benefit_applications_deleted_by_fkey(first_name, last_name), senior_citizens(first_name, last_name)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      setDeletedAnnouncements(announcements || []);
      setDeletedDocuments(documents || []);
      setDeletedAppointments(appointments || []);
      setDeletedBenefits(benefits || []);
    } catch (error) {
      console.error('Failed to load deleted items:', error);
      toast.error('Failed to load deleted items');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    const { item, type } = restoreDialog;
    if (!item) return;

    try {
      const tableName = {
        announcement: 'announcements',
        document: 'document_requests',
        appointment: 'appointments',
        benefit: 'benefit_applications'
      }[type];

      // Restore the item
      const { error } = await supabase
        .from(tableName!)
        .update({
          deleted_at: null,
          deleted_by: null,
          delete_reason: null
        })
        .eq('id', item.id);

      if (error) throw error;

      // Log the activity
      await ActivityLogger.log({
        action: 'restore',
        entity_type: type as any,
        entity_id: item.id,
        entity_name: item.title || item.document_type || item.appointment_type || item.benefit_type,
        description: `Restored ${type}: ${item.title || item.document_type || item.appointment_type || item.benefit_type}`
      } as any);

      toast.success('Item restored successfully!');
      setRestoreDialog({ open: false, item: null, type: '' });
      loadDeletedItems();
    } catch (error) {
      console.error('Failed to restore item:', error);
      toast.error('Failed to restore item');
    }
  };

  const handlePermanentDelete = async () => {
    const { item, type } = deleteDialog;
    if (!item) return;

    try {
      const tableName = {
        announcement: 'announcements',
        document: 'document_requests',
        appointment: 'appointments',
        benefit: 'benefit_applications'
      }[type];

      // Permanently delete
      const { error } = await supabase
        .from(tableName!)
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Item permanently deleted');
      setDeleteDialog({ open: false, item: null, type: '' });
      loadDeletedItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
    }
  };

  const getDaysUntilPermanentDelete = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = 30 * 24 * 60 * 60 * 1000 - (now.getTime() - deleted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const renderDeletedItem = (item: any, type: string) => {
    const daysLeft = getDaysUntilPermanentDelete(item.deleted_at);
    const deletedByName = item.deleted_by_user
      ? `${item.deleted_by_user.first_name} ${item.deleted_by_user.last_name}`
      : 'Unknown';

    return (
      <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-[#333333] mb-2">
              {item.title || item.document_type || item.appointment_type || item.benefit_type}
            </h4>
            <div className="space-y-1 text-sm text-[#666666]">
              <p>Deleted by: {deletedByName}</p>
              <p>Deleted: {new Date(item.deleted_at).toLocaleString()}</p>
              {item.delete_reason && <p>Reason: {item.delete_reason}</p>}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={daysLeft <= 7 ? 'destructive' : 'secondary'}>
                  {daysLeft} days until permanent deletion
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRestoreDialog({ open: true, item, type })}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restore
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialog({ open: true, item, type })}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#333333]">Recently Deleted</h1>
        <p className="text-[#666666] mt-2">
          Restore or permanently delete items
        </p>
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Auto-Cleanup Policy</p>
              <p>Items in Recently Deleted will be permanently removed after 30 days.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="announcements">
            Announcements ({deletedAnnouncements.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({deletedDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="appointments">
            Appointments ({deletedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="benefits">
            Benefits ({deletedBenefits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : deletedAnnouncements.length === 0 ? (
                <div className="text-center py-8 text-[#666666]">
                  No deleted announcements
                </div>
              ) : (
                <div className="space-y-4">
                  {deletedAnnouncements.map(item => renderDeletedItem(item, 'announcement'))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : deletedDocuments.length === 0 ? (
                <div className="text-center py-8 text-[#666666]">
                  No deleted documents
                </div>
              ) : (
                <div className="space-y-4">
                  {deletedDocuments.map(item => renderDeletedItem(item, 'document'))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : deletedAppointments.length === 0 ? (
                <div className="text-center py-8 text-[#666666]">
                  No deleted appointments
                </div>
              ) : (
                <div className="space-y-4">
                  {deletedAppointments.map(item => renderDeletedItem(item, 'appointment'))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : deletedBenefits.length === 0 ? (
                <div className="text-center py-8 text-[#666666]">
                  No deleted benefits
                </div>
              ) : (
                <div className="space-y-4">
                  {deletedBenefits.map(item => renderDeletedItem(item, 'benefit'))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialog.open} onOpenChange={(open) => !open && setRestoreDialog({ open: false, item: null, type: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the item and make it active again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, item: null, type: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The item will be permanently deleted from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-red-600 hover:bg-red-700">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

## 📝 Next Steps

1. **Run the migrations** in Supabase
2. **Test activity logging** by adding it to one feature first
3. **Update all delete operations** to use soft delete
4. **Create the UI pages** for Activity Logs and Recently Deleted
5. **Add navigation links** to these new pages in your sidebar
6. **Test thoroughly** with all three roles (OSCA, BASCA, Senior)

## 🔧 Integration Checklist

- [ ] Run database migrations
- [ ] Test ActivityLogger service
- [ ] Update announcements API with logging
- [ ] Update documents API with logging
- [ ] Update appointments API with logging
- [ ] Update benefits API with logging
- [ ] Create Activity Logs page for OSCA
- [ ] Create Activity Logs page for BASCA
- [ ] Create Activity Logs page for Senior
- [ ] Create Recently Deleted page for OSCA
- [ ] Create Recently Deleted page for BASCA
- [ ] Add navigation menu items
- [ ] Test all features
- [ ] Set up auto-cleanup cron job

## 🎯 Benefits

✅ Complete audit trail of all actions
✅ Accountability and transparency
✅ Safety net for accidental deletions
✅ Compliance with data retention policies
✅ Easy debugging and troubleshooting
✅ User activity analytics

## 📞 Support

If you encounter any issues, check:
1. Database migrations ran successfully
2. RLS policies are set correctly
3. User has proper permissions
4. Activity logs table exists and is accessible

Good luck with the implementation! 🚀
