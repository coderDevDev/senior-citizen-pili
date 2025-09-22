'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
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
import {
  Bell,
  Plus,
  Search,
  AlertTriangle,
  Send,
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Users,
  Loader2
} from 'lucide-react';
// import { useAuth } from '@/contexts/auth-context';
import { AnnouncementsAPI } from '@/lib/api/announcements';
import { BarangaySelect, BarangayFilter } from '@/components/shared-components';
import type { Announcement, Barangay } from '@/types/announcements';

// Zod schema for announcement form
const announcementFormSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(500, 'Content cannot exceed 500 characters'),
  type: z.enum(['general', 'emergency', 'benefit', 'birthday'], {
    required_error: 'Please select an announcement type'
  }),
  targetBarangay: z.string().optional(),
  isUrgent: z.boolean().optional(),
  expiresAt: z.string().optional(),
  sendSMS: z.boolean().optional()
});

type AnnouncementFormData = z.infer<typeof announcementFormSchema>;

interface SharedAnnouncementsPageProps {
  role?: 'osca' | 'basca' | 'senior';
  primaryColor?: string;
  userBarangay?: string;
  title?: string;
  description?: string;
}

export default function SharedAnnouncementsPage({
  role = 'osca',
  primaryColor = '#00af8f',
  userBarangay,
  title = 'Announcements & Notifications',
  description = 'Manage system-wide and barangay-specific announcements for senior citizens'
}: SharedAnnouncementsPageProps) {
  //  const { authState } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [urgentFilter, setUrgentFilter] = useState('all');
  const [barangayFilter, setBarangayFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'general',
      targetBarangay: '',
      isUrgent: false,
      expiresAt: '',
      sendSMS: false
    }
  });

  // Utility function to handle loading toast with proper cleanup
  const withLoadingToast = async <T,>(
    operation: () => Promise<T>,
    loadingMessage: string,
    loadingDescription?: string
  ): Promise<T> => {
    const loadingToast = toast.loading(loadingMessage, {
      description: loadingDescription
    });

    try {
      const result = await operation();
      toast.dismiss(loadingToast);
      return result;
    } catch (error) {
      toast.dismiss(loadingToast);
      throw error; // Re-throw to let the caller handle the error
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadAnnouncements();
    loadBarangays();
  }, []);

  // Load announcements from API
  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const filters = {
        search: searchQuery || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        isUrgent:
          urgentFilter === 'urgent'
            ? true
            : urgentFilter === 'normal'
            ? false
            : undefined,
        targetBarangay:
          role === 'basca' && userBarangay
            ? userBarangay
            : role === 'senior' && userBarangay
            ? userBarangay
            : barangayFilter !== 'all'
            ? barangayFilter
            : undefined
      };

      const result = await AnnouncementsAPI.getAnnouncements(1, 50, filters);

      // For senior role, filter to show only system-wide or their barangay announcements
      let filteredResults = result.announcements;
      if (role === 'senior' && userBarangay) {
        filteredResults = result.announcements.filter(
          announcement =>
            !announcement.targetBarangay || // System-wide announcements (no specific barangay)
            announcement.targetBarangay === userBarangay // Announcements for their barangay
        );
      }

      setAnnouncements(filteredResults);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error('⚠️ Failed to load announcements', {
        description:
          error instanceof Error ? error.message : 'Please try again later',
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => loadAnnouncements()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load barangays from API
  const loadBarangays = async () => {
    try {
      const result = await AnnouncementsAPI.getBarangays();
      setBarangays(result);
    } catch (error) {
      console.error('Error loading barangays:', error);
    }
  };

  // Filter announcements based on current filters
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch =
      searchQuery === '' ||
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (announcement.targetBarangay &&
        announcement.targetBarangay
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesType =
      typeFilter === 'all' || announcement.type === typeFilter;
    const matchesUrgent =
      urgentFilter === 'all' ||
      (urgentFilter === 'urgent' && announcement.isUrgent) ||
      (urgentFilter === 'normal' && !announcement.isUrgent);
    const matchesBarangay =
      barangayFilter === 'all' ||
      announcement.targetBarangay === barangayFilter ||
      (!announcement.targetBarangay && barangayFilter === 'system-wide');

    return matchesSearch && matchesType && matchesUrgent && matchesBarangay;
  });

  // Reset form
  const resetForm = useCallback(() => {
    reset();
  }, [reset]);

  // Form submission handler using React Hook Form
  const onSubmit = async (data: AnnouncementFormData) => {
    setIsSubmitting(true);

    try {
      await withLoadingToast(
        () =>
          AnnouncementsAPI.createAnnouncement({
            title: data.title,
            content: data.content,
            type: data.type,
            targetBarangay: data.targetBarangay || undefined,
            isUrgent: data.isUrgent,
            expiresAt: data.expiresAt || undefined,
            sendSMS: data.sendSMS
          }),
        'Creating announcement...',
        data.sendSMS
          ? 'Publishing and sending SMS notifications'
          : 'Publishing announcement'
      );

      toast.success('🎉 Announcement created successfully!', {
        description: `"${data.title}" has been published${
          data.sendSMS ? ' and SMS notifications sent' : ''
        }.`,
        duration: 5000,
        action: {
          label: 'View All',
          onClick: () => setIsCreateModalOpen(false)
        }
      });

      setIsCreateModalOpen(false);
      resetForm();
      await loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);

      toast.error('❌ Failed to create announcement', {
        description:
          error instanceof Error ? error.message : 'Please try again later',
        duration: 8000,
        action: {
          label: 'Retry',
          onClick: () => onSubmit(data)
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncement) return;

    try {
      setIsSubmitting(true);

      await AnnouncementsAPI.deleteAnnouncement(selectedAnnouncement.id);

      toast.success('🗑️ Announcement deleted successfully!', {
        description: `"${selectedAnnouncement.title}" has been removed from the system.`,
        duration: 4000
      });

      setIsDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
      await loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('❌ Failed to delete announcement', {
        description:
          error instanceof Error ? error.message : 'Please try again later',
        duration: 6000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening view modal
  const openViewModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewModalOpen(true);
  };

  // Handle opening edit modal
  const openEditModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    reset({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      targetBarangay: announcement.targetBarangay || '',
      isUrgent: announcement.isUrgent,
      expiresAt: announcement.expiresAt || '',
      sendSMS: false
    });
    setIsEditModalOpen(true);
  };

  // Edit form submission handler using React Hook Form
  const onEditSubmit = async (data: AnnouncementFormData) => {
    if (!selectedAnnouncement) return;

    setIsSubmitting(true);

    try {
      await AnnouncementsAPI.updateAnnouncement({
        id: selectedAnnouncement.id,
        title: data.title,
        content: data.content,
        type: data.type,
        targetBarangay: data.targetBarangay || undefined,
        isUrgent: data.isUrgent,
        expiresAt: data.expiresAt || undefined,
        sendSMS: data.sendSMS
      });

      toast.success('✅ Announcement updated successfully!', {
        description: `"${data.title}" has been updated${
          data.sendSMS ? ' and SMS notifications sent' : ''
        }.`,
        duration: 5000
      });

      setIsEditModalOpen(false);
      resetForm();
      setSelectedAnnouncement(null);
      await loadAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('❌ Failed to update announcement', {
        description:
          error instanceof Error ? error.message : 'Please try again later',
        duration: 6000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening delete dialog
  const openDeleteDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteDialogOpen(true);
  };

  // Handle filter changes
  const handleFilterChange = () => {
    loadAnnouncements();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'benefit':
        return 'bg-green-100 text-green-800';
      case 'birthday':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Memoized stats calculation to prevent unnecessary recalculations
  const stats = useMemo(
    () => [
      {
        title: 'Total Announcements',
        value: announcements.length.toString(),
        change: 'Active',
        icon: Bell,
        color: `bg-[${primaryColor}]`,
        textColor: `text-[${primaryColor}]`
      },
      {
        title: 'Urgent Alerts',
        value: announcements.filter(a => a.isUrgent).length.toString(),
        change: 'Requires attention',
        icon: AlertTriangle,
        color: 'bg-red-500',
        textColor: 'text-red-500'
      },
      {
        title: 'SMS Sent',
        value: announcements.filter(a => a.smsSent).length.toString(),
        change: `${announcements.reduce(
          (sum, a) => sum + (a.recipientCount || 0),
          0
        )} recipients`,
        icon: Send,
        color: role === 'basca' ? 'bg-[#ffd416]' : 'bg-[#ffd416]',
        textColor: role === 'basca' ? 'text-[#ffd416]' : 'text-[#ffd416]'
      },
      {
        title: 'This Month',
        value: announcements
          .filter(a => {
            const date = new Date(a.createdAt);
            const now = new Date();
            return (
              date.getMonth() === now.getMonth() &&
              date.getFullYear() === now.getFullYear()
            );
          })
          .length.toString(),
        change: 'Created',
        icon: Calendar,
        color: `bg-[${primaryColor}]`,
        textColor: `text-[${primaryColor}]`
      }
    ],
    [announcements]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">{title}</h1>
          <p className="text-[#666666] mt-2">{description}</p>
        </div>
        {role !== 'senior' && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button
                className="text-white shadow-lg"
                style={{ backgroundColor: primaryColor }}
                onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Create and send announcements to senior citizens in Pili,
                  Camarines Sur
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Title Field */}
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter announcement title"
                    className={errors.title ? 'border-red-500' : ''}
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Content Field */}
                <div>
                  <Label htmlFor="content" className="text-sm font-medium">
                    Content <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Enter announcement content"
                    rows={4}
                    className={errors.content ? 'border-red-500' : ''}
                    {...register('content')}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {watch('content')?.length || 0}/500 characters
                  </p>
                  {errors.content && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.content.message}
                    </p>
                  )}
                </div>

                {/* Type and Target Barangay */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">
                      Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch('type')}
                      onValueChange={(value: any) =>
                        setValue('type', value as any)
                      }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="benefit">Benefit</SelectItem>
                        <SelectItem value="birthday">Birthday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <BarangaySelect
                      id="targetBarangay"
                      label="Target Barangay"
                      value={watch('targetBarangay') || 'system-wide'}
                      onValueChange={value =>
                        setValue(
                          'targetBarangay',
                          value === 'system-wide' ? '' : value
                        )
                      }
                      placeholder="Select barangay"
                      includeSystemWide={true}
                      showIcon={false}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave as system-wide to send to all barangays
                    </p>
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="urgent"
                      checked={watch('isUrgent')}
                      onCheckedChange={checked =>
                        setValue('isUrgent', !!checked)
                      }
                    />
                    <Label htmlFor="urgent" className="text-sm">
                      Mark as urgent
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sms"
                      checked={watch('sendSMS')}
                      onCheckedChange={checked =>
                        setValue('sendSMS', !!checked)
                      }
                    />
                    <Label htmlFor="sms" className="text-sm">
                      Send SMS notifications
                    </Label>
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <Label htmlFor="expiresAt" className="text-sm font-medium">
                    Expires At (Optional)
                  </Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    className={errors.expiresAt ? 'border-red-500' : ''}
                    {...register('expiresAt')}
                  />
                  {errors.expiresAt && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.expiresAt.message}
                    </p>
                  )}
                </div>

                {/* SMS Preview */}
                {watch('sendSMS') && watch('title') && watch('content') && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      SMS Preview:
                    </h4>
                    <div className="text-sm bg-white p-2 rounded border">
                      {watch('isUrgent') && '[URGENT] '}
                      {watch('type') === 'emergency' && '[EMERGENCY] '}[
                      {watch('targetBarangay') || 'OSCA'}] {watch('title')}
                      {(watch('content')?.length || 0) <= 100 && (
                        <div className="mt-1">{watch('content')}</div>
                      )}
                      <div className="mt-1 text-xs text-gray-600">
                        - OSCA Pili
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Estimated length: ~
                      {
                        ((watch('title') || '') + (watch('content') || '') + 30)
                          .length
                      }{' '}
                      characters
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#00af8f] hover:bg-[#00af90] text-white"
                    disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Create Announcement
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-white to-gray-50/50">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-[#666666] uppercase tracking-wide truncate">
                      {stat.title}
                    </p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#333333] mt-1 sm:mt-2 truncate">
                      {isLoading ? (
                        <div className="w-8 sm:w-16 h-4 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className={`text-xs sm:text-sm font-medium ${stat.textColor} mt-1 truncate`}>
                      {stat.change}
                    </p>
                  </div>
                  <div
                    className={`p-2 sm:p-4 rounded-2xl ${stat.color} bg-opacity-10 backdrop-blur-sm flex-shrink-0 ml-2`}>
                    <Icon className={`w-4 h-4 sm:w-7 sm:h-7 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters - Mobile Responsive */}
      <Card className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-lg">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#666666] w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 h-10 sm:h-12 border-2 border-[#E0DDD8] focus:border-[#00af8f] text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-44 h-10 sm:h-12">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="benefit">Benefit</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgentFilter} onValueChange={setUrgentFilter}>
                <SelectTrigger className="w-full sm:w-44 h-10 sm:h-12">
                  <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent Only</SelectItem>
                  <SelectItem value="normal">Normal Only</SelectItem>
                </SelectContent>
              </Select>
              {role !== 'senior' && (
                <BarangayFilter
                  value={barangayFilter}
                  onValueChange={setBarangayFilter}
                  placeholder="Filter by Barangay"
                  includeSystemWide={true}
                  className="w-full sm:w-44 h-10 sm:h-12"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List - Mobile Responsive */}
      <Card className="border-0 shadow-lg" data-announcements-list>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#00af8f]" />
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#333333]">
                  {role === 'senior'
                    ? 'Your Announcements'
                    : 'All Announcements'}
                </h3>
                <p className="text-xs sm:text-sm text-[#666666] mt-1">
                  {role === 'senior'
                    ? `${filteredAnnouncements.length} announcements for you and your barangay`
                    : `${filteredAnnouncements.length} of ${announcements.length} announcements`}
                </p>
              </div>
            </div>
            <Badge className="bg-[#00af8f]/10 text-[#00af8f] w-fit">
              {filteredAnnouncements.length} Results
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4 px-3 sm:px-0">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 sm:p-4 border rounded-lg animate-pulse">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-32 sm:w-64 h-4 sm:h-5 bg-gray-200 rounded"></div>
                    <div className="w-12 sm:w-16 h-4 sm:h-5 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-full h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-3/4 h-3 sm:h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-3 sm:px-0">
              <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-[#333333] mb-2">
                {announcements.length === 0
                  ? 'No Announcements Yet'
                  : 'No Results Found'}
              </h3>
              <p className="text-sm sm:text-base text-[#666666] mb-4">
                {announcements.length === 0
                  ? role === 'senior'
                    ? 'No announcements available for your barangay at the moment.'
                    : 'Create your first announcement to get started.'
                  : 'Try adjusting your search criteria.'}
              </p>
              {announcements.length === 0 && role !== 'senior' && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Announcement
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto px-3 sm:px-0">
              {filteredAnnouncements.map(announcement => (
                <div
                  key={announcement.id}
                  className="p-3 sm:p-6 border-2 border-[#E0DDD8]/50 rounded-xl hover:border-[#00af8f]/30 hover:bg-[#00af8f]/5 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mt-2 flex-shrink-0 ${
                          announcement.isUrgent
                            ? 'bg-red-500 animate-pulse'
                            : 'bg-[#00af8f]'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-semibold text-[#333333] mb-1 line-clamp-2">
                          {announcement.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                          <Badge className={getTypeColor(announcement.type)}>
                            {announcement.type}
                          </Badge>
                          {announcement.isUrgent && (
                            <Badge variant="destructive">Urgent</Badge>
                          )}
                          {announcement.targetBarangay ? (
                            <Badge
                              variant="outline"
                              className="border-[#00af8f] text-[#00af8f] text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-[80px] sm:max-w-none">
                                {announcement.targetBarangay}
                              </span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-blue-500 text-blue-700 text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              System-wide
                            </Badge>
                          )}
                          {announcement.smsSent && (
                            <Badge
                              variant="outline"
                              className="border-green-500 text-green-600 text-xs">
                              <Send className="w-3 h-3 mr-1" />
                              SMS ({announcement.recipientCount || 0})
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewModal(announcement)}
                        className="text-[#00af8f] hover:text-[#00af90] p-2 h-8 w-8 sm:h-10 sm:w-10">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      {role !== 'senior' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(announcement)}
                            className="text-blue-600 hover:text-blue-700 p-2 h-8 w-8 sm:h-10 sm:w-10">
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(announcement)}
                            className="text-red-600 hover:text-red-700 p-2 h-8 w-8 sm:h-10 sm:w-10">
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-[#666666] mb-3 leading-relaxed line-clamp-3">
                    {announcement.content}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-[#666666]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        Created{' '}
                        <span className="font-medium">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {announcement.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          Expires{' '}
                          <span className="font-medium">
                            {new Date(
                              announcement.expiresAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge className="bg-[#00af8f]/10 text-[#00af8f] w-fit">
                      {announcement.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Announcement Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#00af8f]" />
              View Announcement Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this announcement
            </DialogDescription>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 p-4 rounded-lg border border-[#00af8f]/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#333333] mb-2">
                      {selectedAnnouncement.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={getTypeColor(selectedAnnouncement.type)}>
                        {selectedAnnouncement.type}
                      </Badge>
                      {selectedAnnouncement.isUrgent && (
                        <Badge variant="destructive">Urgent</Badge>
                      )}
                      <Badge className="bg-[#00af8f]/10 text-[#00af8f]">
                        {selectedAnnouncement.status}
                      </Badge>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full ${
                      selectedAnnouncement.isUrgent
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-[#00af8f]'
                    }`}></div>
                </div>
              </div>

              {/* Content */}
              <div>
                <Label className="text-sm font-medium text-[#666666]">
                  Content
                </Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                  <p className="text-[#333333] leading-relaxed whitespace-pre-wrap">
                    {selectedAnnouncement.content}
                  </p>
                </div>
              </div>

              {/* Target & Reach */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-[#666666]">
                    Target Audience
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    {selectedAnnouncement.targetBarangay ? (
                      <Badge
                        variant="outline"
                        className="border-[#00af8f] text-[#00af8f]">
                        <MapPin className="w-3 h-3 mr-1" />
                        {selectedAnnouncement.targetBarangay}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-blue-500 text-blue-700">
                        <Users className="w-3 h-3 mr-1" />
                        System-wide
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#666666]">
                    SMS Status
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    {selectedAnnouncement.smsSent ? (
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-600">
                        <Send className="w-3 h-3 mr-1" />
                        SMS Sent ({selectedAnnouncement.recipientCount ||
                          0}{' '}
                        recipients)
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-gray-500 text-gray-600">
                        No SMS sent
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-[#666666]">
                    Created
                  </Label>
                  <div className="mt-2 flex items-center gap-2 text-sm text-[#333333]">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                  </div>
                </div>
                {selectedAnnouncement.expiresAt && (
                  <div>
                    <Label className="text-sm font-medium text-[#666666]">
                      Expires
                    </Label>
                    <div className="mt-2 flex items-center gap-2 text-sm text-[#333333]">
                      <Calendar className="w-4 h-4" />
                      {new Date(
                        selectedAnnouncement.expiresAt
                      ).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* SMS Preview if sent */}
              {selectedAnnouncement.smsSent && (
                <div>
                  <Label className="text-sm font-medium text-[#666666]">
                    SMS Message Preview
                  </Label>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm bg-white p-2 rounded border">
                      {selectedAnnouncement.isUrgent && '[URGENT] '}
                      {selectedAnnouncement.type === 'emergency' &&
                        '[EMERGENCY] '}
                      [{selectedAnnouncement.targetBarangay || 'OSCA'}]{' '}
                      {selectedAnnouncement.title}
                      {selectedAnnouncement.content.length <= 100 && (
                        <div className="mt-1">
                          {selectedAnnouncement.content}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-600">
                        - OSCA Pili
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedAnnouncement);
                  }}
                  className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Announcement
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Announcement
            </DialogTitle>
            <DialogDescription>
              Make changes to this announcement
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            {/* Title Field */}
            <div>
              <Label htmlFor="edit-title" className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                {...register('title')}
                placeholder="Enter announcement title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Content Field */}
            <div>
              <Label htmlFor="edit-content" className="text-sm font-medium">
                Content <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-content"
                {...register('content')}
                placeholder="Enter announcement content"
                rows={4}
                className={errors.content ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                {watch('content')?.length || 0}/500 characters
              </p>
              {errors.content && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Type and Target Barangay */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type" className="text-sm font-medium">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('type')}
                  onValueChange={(value: any) =>
                    setValue('type', value as any)
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="benefit">Benefit</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <BarangaySelect
                  id="edit-targetBarangay"
                  label="Target Barangay"
                  value={watch('targetBarangay') || 'system-wide'}
                  onValueChange={value =>
                    setValue(
                      'targetBarangay',
                      value === 'system-wide' ? '' : value
                    )
                  }
                  placeholder="Select barangay"
                  includeSystemWide={true}
                  showIcon={false}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave as system-wide to send to all barangays
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-urgent"
                  checked={watch('isUrgent')}
                  onCheckedChange={checked => setValue('isUrgent', !!checked)}
                />
                <Label htmlFor="edit-urgent" className="text-sm">
                  Mark as urgent
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-sms"
                  checked={watch('sendSMS')}
                  onCheckedChange={checked => setValue('sendSMS', !!checked)}
                />
                <Label htmlFor="edit-sms" className="text-sm">
                  Send SMS notifications
                </Label>
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <Label htmlFor="edit-expiresAt" className="text-sm font-medium">
                Expires At (Optional)
              </Label>
              <Input
                id="edit-expiresAt"
                type="datetime-local"
                {...register('expiresAt')}
                className={errors.expiresAt ? 'border-red-500' : ''}
              />
              {errors.expiresAt && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.expiresAt.message}
                </p>
              )}
            </div>

            {/* SMS Preview */}
            {watch('sendSMS') && watch('title') && watch('content') && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  SMS Preview:
                </h4>
                <div className="text-sm bg-white p-2 rounded border">
                  {watch('isUrgent') && '[URGENT] '}
                  {watch('type') === 'emergency' && '[EMERGENCY] '}[
                  {watch('targetBarangay') || 'OSCA'}] {watch('title')}
                  {(watch('content')?.length || 0) <= 100 && (
                    <div className="mt-1">{watch('content')}</div>
                  )}
                  <div className="mt-1 text-xs text-gray-600">- OSCA Pili</div>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Estimated length: ~
                  {
                    ((watch('title') || '') + (watch('content') || '') + 30)
                      .length
                  }{' '}
                  characters
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                  setSelectedAnnouncement(null);
                }}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <Edit className="w-4 h-4 mr-2" />
                Update Announcement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAnnouncement?.title}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAnnouncement}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700">
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
