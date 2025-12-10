'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ActivityLogger } from '@/lib/services/activity-logger';

interface DeletedItem {
  id: string;
  deleted_at: string;
  deleted_by: string;
  delete_reason?: string;
  deleted_by_user?: any;
  [key: string]: any;
}

export default function BASCARecentlyDeletedPage() {
  const [userBarangay, setUserBarangay] = useState<string>('');
  const [deletedAnnouncements, setDeletedAnnouncements] = useState<DeletedItem[]>([]);
  const [deletedDocuments, setDeletedDocuments] = useState<DeletedItem[]>([]);
  const [deletedAppointments, setDeletedAppointments] = useState<DeletedItem[]>([]);
  const [deletedBenefits, setDeletedBenefits] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreDialog, setRestoreDialog] = useState<{
    open: boolean;
    item: any;
    type: string;
  }>({
    open: false,
    item: null,
    type: ''
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: any;
    type: string;
  }>({
    open: false,
    item: null,
    type: ''
  });

  useEffect(() => {
    loadUserBarangay();
  }, []);

  useEffect(() => {
    if (userBarangay) {
      loadDeletedItems();
    }
  }, [userBarangay]);

  const loadUserBarangay = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: user } = await supabase
          .from('users')
          .select('barangay')
          .eq('id', userData.user.id)
          .single();

        if (user?.barangay) {
          setUserBarangay(user.barangay);
        }
      }
    } catch (error) {
      console.error('Failed to load user barangay:', error);
    }
  };

  const loadDeletedItems = async () => {
    setLoading(true);
    try {
      // Load deleted announcements (barangay-specific)
      const { data: announcements } = await supabase
        .from('announcements')
        .select(
          '*, deleted_by_user:users!announcements_deleted_by_fkey(first_name, last_name)'
        )
        .not('deleted_at', 'is', null)
        .eq('target_barangay', userBarangay)
        .order('deleted_at', { ascending: false });

      // Load deleted documents (barangay seniors only)
      const { data: documents } = await supabase
        .from('document_requests')
        .select(
          '*, deleted_by_user:users!document_requests_deleted_by_fkey(first_name, last_name), senior_citizens!inner(first_name, last_name, barangay)'
        )
        .not('deleted_at', 'is', null)
        .eq('senior_citizens.barangay', userBarangay)
        .order('deleted_at', { ascending: false });

      // Load deleted appointments (barangay seniors only)
      const { data: appointments } = await supabase
        .from('appointments')
        .select(
          '*, deleted_by_user:users!appointments_deleted_by_fkey(first_name, last_name), senior_citizens!inner(first_name, last_name, barangay)'
        )
        .not('deleted_at', 'is', null)
        .eq('senior_citizens.barangay', userBarangay)
        .order('deleted_at', { ascending: false });

      // Load deleted benefits (barangay seniors only)
      const { data: benefits } = await supabase
        .from('benefit_applications')
        .select(
          '*, deleted_by_user:users!benefit_applications_deleted_by_fkey(first_name, last_name), senior_citizens!inner(first_name, last_name, barangay)'
        )
        .not('deleted_at', 'is', null)
        .eq('senior_citizens.barangay', userBarangay)
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

      const { error } = await supabase
        .from(tableName!)
        .update({
          deleted_at: null,
          deleted_by: null,
          delete_reason: null
        })
        .eq('id', item.id);

      if (error) throw error;

      await ActivityLogger.log({
        action: 'restore',
        entity_type: type as any,
        entity_id: item.id,
        entity_name:
          item.title ||
          item.document_type ||
          item.appointment_type ||
          item.benefit_type,
        description: `Restored ${type}: ${
          item.title ||
          item.document_type ||
          item.appointment_type ||
          item.benefit_type
        }`
      } as any);

      toast.success('✅ Item restored successfully!');
      setRestoreDialog({ open: false, item: null, type: '' });
      loadDeletedItems();
    } catch (error) {
      console.error('Failed to restore item:', error);
      toast.error('❌ Failed to restore item');
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

      const { error } = await supabase.from(tableName!).delete().eq('id', item.id);

      if (error) throw error;

      toast.success('✅ Item permanently deleted');
      setDeleteDialog({ open: false, item: null, type: '' });
      loadDeletedItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('❌ Failed to delete item');
    }
  };

  const getDaysUntilPermanentDelete = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = 30 * 24 * 60 * 60 * 1000 - (now.getTime() - deleted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const renderDeletedItem = (item: DeletedItem, type: string) => {
    const daysLeft = getDaysUntilPermanentDelete(item.deleted_at);
    const deletedByName = item.deleted_by_user
      ? `${item.deleted_by_user.first_name} ${item.deleted_by_user.last_name}`
      : 'Unknown';

    let itemName = '';
    if (type === 'announcement') {
      itemName = item.title;
    } else if (type === 'document') {
      itemName = `${item.document_type} - ${item.senior_citizens?.first_name} ${item.senior_citizens?.last_name}`;
    } else if (type === 'appointment') {
      itemName = `${item.appointment_type} - ${item.senior_citizens?.first_name} ${item.senior_citizens?.last_name}`;
    } else if (type === 'benefit') {
      itemName = `${item.benefit_type} - ${item.senior_citizens?.first_name} ${item.senior_citizens?.last_name}`;
    }

    return (
      <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-[#333333] mb-2">{itemName}</h4>
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
          Restore or permanently delete items from {userBarangay}
        </p>
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Auto-Cleanup Policy</p>
              <p>
                Items in Recently Deleted will be permanently removed after 30 days.
              </p>
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
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto"></div>
                  <p className="text-[#666666] mt-4">Loading...</p>
                </div>
              ) : deletedAnnouncements.length === 0 ? (
                <div className="text-center py-8 text-[#666666]">
                  No deleted announcements
                </div>
              ) : (
                <div className="space-y-4">
                  {deletedAnnouncements.map(item =>
                    renderDeletedItem(item, 'announcement')
                  )}
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
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto"></div>
                  <p className="text-[#666666] mt-4">Loading...</p>
                </div>
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
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto"></div>
                  <p className="text-[#666666] mt-4">Loading...</p>
                </div>
              ) : deletedAppointments.length === 0 ? (
                <div className="text-center py-8 text-[#666666]">
                  No deleted appointments
                </div>
              ) : (
                <div className="space-y-4">
                  {deletedAppointments.map(item =>
                    renderDeletedItem(item, 'appointment')
                  )}
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
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto"></div>
                  <p className="text-[#666666] mt-4">Loading...</p>
                </div>
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
      <AlertDialog
        open={restoreDialog.open}
        onOpenChange={open =>
          !open && setRestoreDialog({ open: false, item: null, type: '' })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the item and make it active again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={open =>
          !open && setDeleteDialog({ open: false, item: null, type: '' })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The item will be permanently deleted from
              the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
