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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Check,
  CheckCircle,
  X,
  Eye,
  Phone,
  MapPin,
  Activity,
  AlertTriangle,
  CalendarDays,
  UserPlus,
  Stethoscope,
  Home,
  FileText,
  Star,
  Trash2,
  RotateCcw,
  Loader2,
  ChevronDown,
  Calendar as CalendarIcon,
  ArrowUp,
  ArrowDown,
  Target,
  Zap,
  Download,
  BarChart3
} from 'lucide-react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { AppointmentsAPI } from '@/lib/api/appointments';
import { useAuth } from '@/contexts/auth-context';
import { BarangaySelect, BarangayFilter } from '@/components/shared-components';
import type {
  Appointment,
  AppointmentStats,
  SeniorCitizen
} from '@/types/appointments';
import { supabase } from '@/lib/supabase';
import { format24To12Hour } from '@/lib/utils/timeFormat';
import {
  getAppointmentTypeLabel,
  getPriorityConfig,
  appointmentTypeOptions,
  priorityOptions,
  commonRequirements
} from '@/lib/validations/appointments';

// Calendar setup
const localizer = momentLocalizer(moment);

// Import calendar CSS
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Zod schema for appointment form
const appointmentFormSchema = z.object({
  senior_citizen_id: z.string().min(1, 'Please select a senior citizen'),
  appointment_type: z.enum(
    ['medical', 'bhw', 'basca', 'consultation', 'home_visit'],
    {
      required_error: 'Please select an appointment type'
    }
  ),
  appointment_date: z.string().min(1, 'Please select an appointment date'),
  appointment_time: z.string().min(1, 'Please select an appointment time'),
  purpose: z
    .string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(500, 'Purpose cannot exceed 500 characters'),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  priority_level: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  location: z
    .string()
    .max(200, 'Location cannot exceed 200 characters')
    .optional(),
  estimated_duration: z
    .number()
    .min(15, 'Minimum duration is 15 minutes')
    .max(480, 'Maximum duration is 8 hours')
    .optional(),
  requirements: z.array(z.string()).optional(),
  follow_up_required: z.boolean().optional()
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

interface SharedAppointmentsPageProps {
  role?: 'osca' | 'basca' | 'senior';
  primaryColor?: string;
  userBarangay?: string;
  title?: string;
  description?: string;
}

export default function SharedAppointmentsPage({
  role = 'osca',
  primaryColor = '#00af8f',
  userBarangay,
  title = 'Medical Appointments',
  description = 'Schedule and manage medical appointments for senior citizens'
}: SharedAppointmentsPageProps) {
  // Main state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentStats, setAppointmentStats] =
    useState<AppointmentStats | null>(null);
  const [seniorCitizens, setSeniorCitizens] = useState<SeniorCitizen[]>([]);
  const [barangays, setBarangays] = useState<{ id: string; name: string }[]>(
    []
  );
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingSeniors, setIsLoadingSeniors] = useState(false);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusConfirmDialogOpen, setIsStatusConfirmDialogOpen] =
    useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    appointmentId: string;
    newStatus: string;
    appointmentTitle: string;
  } | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [barangayFilter, setBarangayFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Senior citizen selection state
  const [seniorSearchQuery, setSeniorSearchQuery] = useState('');
  const [selectedBarangayForSeniors, setSelectedBarangayForSeniors] =
    useState('all');

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      senior_citizen_id: '',
      appointment_type: 'medical',
      appointment_date: '',
      appointment_time: '',
      purpose: '',
      notes: '',
      priority_level: 'medium',
      location: '',
      estimated_duration: 60,
      requirements: [],
      follow_up_required: false
    }
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [appointmentsData, statsData, barangaysData] = await Promise.all([
          AppointmentsAPI.getAppointments(),
          AppointmentsAPI.getAppointmentStats(),
          AppointmentsAPI.getPiliBarangays()
        ]);

        // For senior role, filter to show only their own appointments
        let filteredAppointments = appointmentsData;
        if (role === 'senior') {
          // Get current user's senior_citizen_id from auth
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;

          if (userId) {
            const { data: senior } = await supabase
              .from('senior_citizens')
              .select('id')
              .eq('user_id', userId)
              .single();

            if (senior) {
              filteredAppointments = appointmentsData.filter(
                appointment => appointment.senior_citizen_id === senior.id
              );
            }
          }
        }

        setAppointments(filteredAppointments);
        setAppointmentStats(statsData);
        setBarangays(barangaysData);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('❌ Failed to load appointments', {
          description: 'Please try refreshing the page'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Export functions
  const exportAppointmentsToPDF = async () => {
    try {
      setIsExporting(true);
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;

      // Header
      pdf.setFontSize(20);
      const hex = primaryColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      pdf.setTextColor(r, g, b);
      pdf.text('Appointments Report', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        30,
        { align: 'center' }
      );

      // Table headers
      const headers = ['Date', 'Time', 'Senior', 'Type', 'Status'];
      const colWidths = [30, 25, 50, 30, 25];
      let y = 50;

      pdf.setFontSize(10);
      headers.forEach((header, index) => {
        pdf.text(
          header,
          20 + colWidths.slice(0, index).reduce((a, b) => a + b, 0),
          y
        );
      });

      y += 10;
      pdf.line(20, y - 5, pageWidth - 20, y - 5);

      // Table data
      filteredAppointments.forEach(appointment => {
        if (y > 250) {
          pdf.addPage();
          y = 30;
        }

        const rowData = [
          new Date(appointment.appointment_date).toLocaleDateString(),
          appointment.appointment_time,
          `${appointment.senior_citizen.first_name} ${appointment.senior_citizen.last_name}`,
          appointment.appointment_type,
          appointment.status
        ];

        rowData.forEach((data, index) => {
          pdf.text(
            data,
            20 + colWidths.slice(0, index).reduce((a, b) => a + b, 0),
            y
          );
        });

        y += 8;
      });

      pdf.save(
        `appointments-report-${new Date().toISOString().split('T')[0]}.pdf`
      );
      toast.success('✅ PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('❌ Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAppointmentsToExcel = () => {
    try {
      setIsExporting(true);
      const data = filteredAppointments.map(appointment => ({
        'Appointment Date': new Date(
          appointment.appointment_date
        ).toLocaleDateString(),
        Time: format24To12Hour(appointment.appointment_time),
        'Senior Citizen': `${appointment.senior_citizen.first_name} ${appointment.senior_citizen.last_name}`,
        Type: appointment.appointment_type,
        Status: appointment.status,
        Notes: appointment.notes || '',
        Created: new Date(appointment.created_at).toLocaleDateString()
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
      XLSX.writeFile(
        wb,
        `appointments-report-${new Date().toISOString().split('T')[0]}.xlsx`
      );
      toast.success('✅ Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('❌ Failed to export Excel file');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAppointmentsToJSON = () => {
    try {
      const data = {
        title: 'Appointments Report',
        generatedAt: new Date().toISOString(),
        filters: {
          status: statusFilter,
          type: typeFilter,
          dateRange: dateFilter,
          barangay:
            role === 'basca' && userBarangay ? userBarangay : barangayFilter
        },
        appointments: filteredAppointments.map(appointment => ({
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          senior_citizen: appointment.senior_citizen,
          appointment_type: appointment.appointment_type,
          status: appointment.status,
          notes: appointment.notes,
          created_at: appointment.created_at
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointments-report-${
        new Date().toISOString().split('T')[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('✅ JSON file exported successfully!');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      toast.error('❌ Failed to export JSON file');
    }
  };

  // Load appointments when filters change
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const filters: AppointmentFilters = {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          date_range: dateFilter !== 'all' ? dateFilter : undefined,
          barangay:
            role === 'basca' && userBarangay
              ? userBarangay
              : barangayFilter !== 'all'
              ? barangayFilter
              : undefined,
          search: searchQuery || undefined
        };

        const appointmentsData = await AppointmentsAPI.getAppointments(filters);
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error loading appointments:', error);
        toast.error('❌ Failed to load appointments');
      }
    };

    if (!isLoading) {
      loadAppointments();
    }
  }, [
    statusFilter,
    typeFilter,
    dateFilter,
    barangayFilter,
    searchQuery,
    isLoading
  ]);

  // Load senior citizens for selection
  const loadSeniorCitizens = useCallback(
    async (search?: string, barangay?: string) => {
      setIsLoadingSeniors(true);
      try {
        let seniors;

        if (role === 'senior') {
          // For senior role, get only their own record
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;

          if (userId) {
            const { data: senior } = await supabase
              .from('senior_citizens')
              .select('id, first_name, last_name, barangay, date_of_birth')
              .eq('user_id', userId)
              .single();

            if (senior) {
              seniors = [
                {
                  id: senior.id,
                  first_name: senior.first_name,
                  last_name: senior.last_name,
                  barangay: senior.barangay,
                  age: senior.date_of_birth
                    ? new Date().getFullYear() -
                      new Date(senior.date_of_birth).getFullYear()
                    : 0
                }
              ];
            } else {
              seniors = [];
            }
          } else {
            seniors = [];
          }
        } else if (role === 'basca' && userBarangay) {
          // For BASCA role, get seniors from their barangay
          seniors = await AppointmentsAPI.getSeniorCitizens(
            search,
            userBarangay
          );
        } else {
          // For OSCA role, get all seniors
          seniors = await AppointmentsAPI.getSeniorCitizens(search, barangay);
        }

        setSeniorCitizens(seniors);
      } catch (error) {
        console.error('Error loading senior citizens:', error);
        toast.error('❌ Failed to load senior citizens');
      } finally {
        setIsLoadingSeniors(false);
      }
    },
    [role, userBarangay]
  );

  // Load available time slots
  const loadAvailableTimeSlots = useCallback(
    async (date: string, appointmentType?: string) => {
      if (!date) return;

      setIsLoadingTimeSlots(true);
      try {
        const timeSlots = await AppointmentsAPI.getAvailableTimeSlots(
          date,
          appointmentType
        );
        setAvailableTimeSlots(timeSlots);
      } catch (error) {
        console.error('Error loading time slots:', error);
        toast.error('❌ Failed to load available time slots');
      } finally {
        setIsLoadingTimeSlots(false);
      }
    },
    []
  );

  // Debounced senior search to reduce lag
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (isCreateModalOpen || isEditModalOpen) {
        const searchTerm = seniorSearchQuery.trim() || undefined;
        const barangayFilter =
          selectedBarangayForSeniors !== 'all'
            ? selectedBarangayForSeniors
            : undefined;
        loadSeniorCitizens(searchTerm, barangayFilter);
      }
    }, 300); // 300ms delay to reduce API calls

    return () => clearTimeout(searchTimeout);
  }, [
    seniorSearchQuery,
    selectedBarangayForSeniors,
    isCreateModalOpen,
    isEditModalOpen,
    loadSeniorCitizens
  ]);

  // Memoized filtered appointments for performance
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const matchesSearch =
        !searchQuery ||
        appointment.senior_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        appointment.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.senior_barangay
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || appointment.status === statusFilter;
      const matchesType =
        typeFilter === 'all' || appointment.appointment_type === typeFilter;
      const matchesBarangay =
        barangayFilter === 'all' ||
        appointment.senior_barangay === barangayFilter;
      const matchesPriority =
        priorityFilter === 'all' ||
        appointment.priority_level === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesBarangay &&
        matchesPriority
      );
    });
  }, [
    appointments,
    searchQuery,
    statusFilter,
    typeFilter,
    barangayFilter,
    priorityFilter
  ]);

  // Enhanced stats with real data
  const stats = [
    {
      title: 'Total Appointments',
      value: appointmentStats?.total.toString() || '0',
      change: 'All time',
      icon: Calendar,
      color: 'bg-[#00af8f]',
      trend: 'stable'
    },
    {
      title: 'Pending Approval',
      value: appointmentStats?.pending.toString() || '0',
      change: 'Requires action',
      icon: Clock,
      color: 'bg-yellow-500',
      trend: appointmentStats && appointmentStats.pending > 0 ? 'up' : 'stable'
    },
    {
      title: "Today's Appointments",
      value: appointmentStats?.today.toString() || '0',
      change: 'Scheduled today',
      icon: Activity,
      color: 'bg-blue-500',
      trend: 'stable'
    },
    {
      title: 'Overdue',
      value: appointmentStats?.overdue.toString() || '0',
      change: 'Need attention',
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend:
        appointmentStats && appointmentStats.overdue > 0 ? 'down' : 'stable'
    }
  ];

  // Calendar events for BigCalendar
  const calendarEvents = useMemo(() => {
    return filteredAppointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.senior_name} - ${getAppointmentTypeLabel(
        appointment.appointment_type
      )}`,
      start: new Date(
        `${appointment.appointment_date}T${appointment.appointment_time}`
      ),
      end: new Date(
        `${appointment.appointment_date}T${appointment.appointment_time}`
      ),
      resource: appointment
    }));
  }, [filteredAppointments]);

  // Optimized form handlers
  // Watch form values for time slot loading
  const watchedDate = watch('appointment_date');
  const watchedType = watch('appointment_type');

  // Load time slots when date or type changes
  useEffect(() => {
    if (watchedDate && watchedType) {
      loadAvailableTimeSlots(watchedDate, watchedType);
    }
  }, [watchedDate, watchedType, loadAvailableTimeSlots]);

  const handleSeniorSelection = useCallback(
    (seniorId: string) => {
      const selectedSenior = seniorCitizens.find(s => s.id === seniorId);
      if (selectedSenior) {
        setValue('senior_citizen_id', seniorId);
        setSeniorSearchQuery(
          `${selectedSenior.first_name} ${selectedSenior.last_name}`
        );
        // Auto-select the senior's barangay
        setSelectedBarangayForSeniors(selectedSenior.barangay);
      }
    },
    [seniorCitizens, setValue]
  );

  const resetForm = useCallback(() => {
    reset();
    setSeniorSearchQuery('');
    setSelectedBarangayForSeniors('all');
    setAvailableTimeSlots([]);
  }, [reset]);

  // Form submission handler using React Hook Form
  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating appointment...', {
      description: 'Setting up the appointment for the senior citizen'
    });

    try {
      const newAppointment = await AppointmentsAPI.createAppointment(data);
      setAppointments(prev => [newAppointment, ...prev]);

      // Refresh stats
      const newStats = await AppointmentsAPI.getAppointmentStats();
      setAppointmentStats(newStats);

      setIsCreateModalOpen(false);
      resetForm();

      toast.dismiss(loadingToast);
      toast.success('✅ Appointment created successfully!', {
        description: `Scheduled for ${newAppointment.senior_name} on ${new Date(
          newAppointment.appointment_date
        ).toLocaleDateString()}`,
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            setSelectedAppointment(newAppointment);
            setIsViewModalOpen(true);
          }
        }
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to create appointment', {
        description:
          error instanceof Error ? error.message : 'Please try again later'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit form submission handler using React Hook Form
  const onEditSubmit = async (data: AppointmentFormData) => {
    if (!selectedAppointment) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Updating appointment...', {
      description: 'Saving changes to the appointment'
    });

    try {
      const updatedAppointment = await AppointmentsAPI.updateAppointment(
        selectedAppointment.id,
        data
      );
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === selectedAppointment.id ? updatedAppointment : apt
        )
      );

      setIsEditModalOpen(false);
      setSelectedAppointment(null);
      resetForm();

      toast.dismiss(loadingToast);
      toast.success('✅ Appointment updated successfully!', {
        description: `Updated appointment for ${updatedAppointment.senior_name}`,
        duration: 5000
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to update appointment', {
        description:
          error instanceof Error ? error.message : 'Please try again later'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open status confirmation dialog
  const openStatusConfirmation = useCallback(
    (appointmentId: string, newStatus: string) => {
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        setPendingStatusChange({
          appointmentId,
          newStatus,
          appointmentTitle: `${
            appointment.senior_name
          } - ${getAppointmentTypeLabel(appointment.appointment_type)}`
        });
        setIsStatusConfirmDialogOpen(true);
      }
    },
    [appointments]
  );

  // Confirm status update
  const handleConfirmStatusUpdate = useCallback(async () => {
    if (!pendingStatusChange) return;

    const { appointmentId, newStatus } = pendingStatusChange;
    const loadingToast = toast.loading(
      `${
        newStatus === 'approved'
          ? 'Approving'
          : newStatus === 'cancelled'
          ? 'Rejecting'
          : newStatus === 'completed'
          ? 'Completing'
          : 'Updating'
      } appointment...`
    );

    try {
      await AppointmentsAPI.updateAppointmentStatus(appointmentId, newStatus);
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId
            ? {
                ...apt,
                status: newStatus as any,
                updated_at: new Date().toISOString()
              }
            : apt
        )
      );

      // Refresh stats
      const newStats = await AppointmentsAPI.getAppointmentStats();
      setAppointmentStats(newStats);

      setIsStatusConfirmDialogOpen(false);
      setPendingStatusChange(null);

      toast.dismiss(loadingToast);
      const statusLabel = newStatus === 'cancelled' ? 'rejected' : newStatus;
      toast.success(`✅ Appointment ${statusLabel} successfully!`, {
        duration: 4000
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to update appointment status', {
        description:
          error instanceof Error ? error.message : 'Please try again later'
      });
    }
  }, [pendingStatusChange]);

  // Legacy function for backward compatibility (now uses confirmation)
  const handleStatusUpdate = useCallback(
    (appointmentId: string, newStatus: string) => {
      openStatusConfirmation(appointmentId, newStatus);
    },
    [openStatusConfirmation]
  );

  const handleDeleteAppointment = useCallback(async () => {
    if (!selectedAppointment) return;

    const loadingToast = toast.loading('Deleting appointment...', {
      description: 'Removing appointment from the system'
    });

    try {
      await AppointmentsAPI.deleteAppointment(selectedAppointment.id);
      setAppointments(prev =>
        prev.filter(apt => apt.id !== selectedAppointment.id)
      );

      // Refresh stats
      const newStats = await AppointmentsAPI.getAppointmentStats();
      setAppointmentStats(newStats);

      setIsDeleteDialogOpen(false);
      setSelectedAppointment(null);

      toast.dismiss(loadingToast);
      toast.success('✅ Appointment deleted successfully!', {
        duration: 4000
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to delete appointment', {
        description:
          error instanceof Error ? error.message : 'Please try again later'
      });
    }
  }, [selectedAppointment]);

  // Modal handlers
  const openCreateModal = useCallback(async () => {
    resetForm();
    // Reset senior search state
    setSeniorSearchQuery('');
    setSelectedBarangayForSeniors('all');

    // For senior role, auto-select their own record
    if (role === 'senior') {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        if (userId) {
          const { data: senior } = await supabase
            .from('senior_citizens')
            .select('id, first_name, last_name')
            .eq('user_id', userId)
            .single();

          if (senior) {
            setValue('senior_citizen_id', senior.id);
            setSeniorSearchQuery(`${senior.first_name} ${senior.last_name}`);
          }
        }
      } catch (error) {
        console.error('Error auto-selecting senior:', error);
      }
    }

    setIsCreateModalOpen(true);
    // Load seniors based on role
    loadSeniorCitizens();
  }, [resetForm, role, setValue, loadSeniorCitizens]);

  const openEditModal = useCallback(
    async (appointment: Appointment) => {
      // Permission check for senior role
      if (role === 'senior') {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: senior } = await supabase
              .from('senior_citizens')
              .select('id')
              .eq('user_id', user.id)
              .single();
            
            if (senior && appointment.senior_citizen_id !== senior.id) {
              toast.error('You can only edit your own appointments');
              return;
            }
          }
        } catch (error) {
          console.error('Permission check error:', error);
          toast.error('Unable to verify permissions');
          return;
        }
      }

      setSelectedAppointment(appointment);
      reset({
        senior_citizen_id: appointment.senior_citizen_id,
        appointment_type: appointment.appointment_type,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        purpose: appointment.purpose,
        notes: appointment.notes || '',
        priority_level: appointment.priority_level || 'medium',
        location: appointment.location || '',
        estimated_duration: appointment.estimated_duration || 60,
        requirements: appointment.requirements || [],
        follow_up_required: appointment.follow_up_required || false
      });
      setSeniorSearchQuery(appointment.senior_name || '');
      loadSeniorCitizens();
      loadAvailableTimeSlots(
        appointment.appointment_date,
        appointment.appointment_type
      );
      setIsEditModalOpen(true);
    },
    [role, loadSeniorCitizens, loadAvailableTimeSlots, reset]
  );

  const openViewModal = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteDialogOpen(true);
  }, []);

  // Utility functions for styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'medical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'bhw':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'basca':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'consultation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'home_visit':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'approved':
        return Check;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return X;
      case 'rescheduled':
        return RotateCcw;
      default:
        return Clock;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return Stethoscope;
      case 'bhw':
        return UserPlus;
      case 'basca':
        return Users;
      case 'consultation':
        return FileText;
      case 'home_visit':
        return Home;
      default:
        return Calendar;
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `linear-gradient(to right, ${primaryColor}08, ${primaryColor}05, transparent)`
          }}></div>
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`
                  }}>
                  <CalendarDays className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-[#333333]">{title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: primaryColor }}></div>
                    <span className="text-sm text-[#666666]">
                      Real-time Data
                    </span>
                    <span className="text-xs text-[#888888]">
                      • Last updated {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[#666666] text-lg">{description}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {role !== 'senior' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 border-2 border-[#E0DDD8]"
                      style={
                        {
                          '--tw-ring-color': `${primaryColor}40`,
                          '--tw-border-opacity': '1'
                        } as React.CSSProperties & { [key: string]: string }
                      }>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {/* <DropdownMenuItem
                      onClick={exportAppointmentsToPDF}
                      disabled={isExporting}
                      className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2 text-red-500" />
                      Export as PDF
                    </DropdownMenuItem> */}
                    <DropdownMenuItem
                      onClick={exportAppointmentsToExcel}
                      disabled={isExporting}
                      className="cursor-pointer">
                      <BarChart3 className="w-4 h-4 mr-2 text-green-500" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={exportAppointmentsToJSON}
                      disabled={isExporting}
                      className="cursor-pointer">
                      <Download className="w-4 h-4 mr-2 text-blue-500" />
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="outline"
                onClick={() =>
                  setViewMode(viewMode === 'list' ? 'calendar' : 'list')
                }
                className="h-12 border-2 border-[#E0DDD8]"
                style={
                  {
                    '--tw-ring-color': `${primaryColor}40`,
                    '--tw-border-opacity': '1'
                  } as React.CSSProperties & { [key: string]: string }
                }>
                {viewMode === 'list' ? (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Calendar View
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    List View
                  </>
                )}
              </Button>

              <Button
                onClick={openCreateModal}
                className="h-12 text-white shadow-lg font-semibold px-6"
                style={
                  {
                    backgroundColor: primaryColor,
                    '--tw-ring-color': `${primaryColor}40`
                  } as React.CSSProperties & { [key: string]: string }
                }>
                <Plus className="w-5 h-5 mr-2" />
                {role === 'senior'
                  ? 'Request Appointment'
                  : 'Schedule Appointment'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon =
            stat.trend === 'up'
              ? ArrowUp
              : stat.trend === 'down'
              ? ArrowDown
              : null;

          return (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 overflow-hidden">
              <CardContent className="p-3 sm:p-6 relative">
                <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-transparent to-gray-100/20 rounded-full transform translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8"></div>

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <p className="text-xs sm:text-sm font-semibold text-[#666666] uppercase tracking-wide truncate">
                        {stat.title}
                      </p>
                      {TrendIcon && (
                        <TrendIcon
                          className={`w-2 h-2 sm:w-3 sm:h-3 ${
                            stat.trend === 'up'
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        />
                      )}
                    </div>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#333333] mb-1 group-hover:text-[#00af8f] transition-colors truncate">
                      {isLoading ? (
                        <div className="w-8 sm:w-12 h-4 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-[#666666] font-medium truncate">
                      {stat.change}
                    </p>
                  </div>

                  <div
                    className={`p-2 sm:p-4 rounded-2xl ${stat.color} bg-opacity-10 backdrop-blur-sm group-hover:scale-110 transition-transform flex-shrink-0 ml-2`}>
                    <Icon
                      className={`w-4 h-4 sm:w-7 sm:h-7`}
                      style={{ color: stat.color.replace('bg-', '') }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Filters - Mobile Responsive */}
      <Card className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-lg">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#666666] w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  placeholder="Search by senior name, purpose, barangay, or appointment details..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 h-10 sm:h-12 border-2 border-[#E0DDD8] focus:border-[#00af8f] text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 h-10 sm:h-12 border-2 border-[#E0DDD8] focus:border-[#00af8f]">
                  <SelectValue placeholder="🔄 Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                  <SelectItem value="approved">✅ Approved</SelectItem>
                  <SelectItem value="completed">🎯 Completed</SelectItem>
                  <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                  <SelectItem value="rescheduled">🔄 Rescheduled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-44 h-10 sm:h-12 border-2 border-[#E0DDD8] focus:border-[#00af8f]">
                  <SelectValue placeholder="🏥 Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="medical">🩺 Medical</SelectItem>
                  <SelectItem value="bhw">🏠 BHW Visit</SelectItem>
                  <SelectItem value="basca">👥 BASCA</SelectItem>
                  <SelectItem value="consultation">💬 Consultation</SelectItem>
                  <SelectItem value="home_visit">🚪 Home Visit</SelectItem>
                </SelectContent>
              </Select>

              {role !== 'senior' && (
                <BarangayFilter
                  value={barangayFilter}
                  onValueChange={setBarangayFilter}
                  placeholder="📍 Barangay"
                  className="w-full sm:w-44 h-10 sm:h-12 border-2 border-[#E0DDD8] focus:border-[#00af8f]"
                  iconType="mappin"
                />
              )}

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-44 h-10 sm:h-12 border-2 border-[#E0DDD8] focus:border-[#00af8f]">
                  <SelectValue placeholder="📅 Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">📅 Today</SelectItem>
                  <SelectItem value="tomorrow">⏭️ Tomorrow</SelectItem>
                  <SelectItem value="week">📊 This Week</SelectItem>
                  <SelectItem value="month">📈 This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area with Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={value => setViewMode(value as 'list' | 'calendar')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        {/* Appointments List View - Mobile Responsive */}
        <TabsContent value="list">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-[#00af8f] to-[#00af90] rounded-2xl">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-[#333333]">
                      Appointments Overview
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-[#666666] mt-1">
                      {filteredAppointments.length} of {appointments.length}{' '}
                      appointments
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#00af8f]/10 text-[#00af8f] w-fit">
                  {filteredAppointments.length} Results
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="p-3 sm:p-6 border rounded-xl animate-pulse">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gray-200 rounded-full"></div>
                          <div className="space-y-2 flex-1">
                            <div className="w-32 sm:w-48 h-4 sm:h-5 bg-gray-200 rounded"></div>
                            <div className="w-48 sm:w-64 h-3 sm:h-4 bg-gray-200 rounded"></div>
                            <div className="flex gap-2">
                              <div className="w-12 sm:w-16 h-5 sm:h-6 bg-gray-200 rounded"></div>
                              <div className="w-12 sm:w-16 h-5 sm:h-6 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 sm:gap-2">
                          <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gray-200 rounded"></div>
                          <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-12 sm:py-16 px-3 sm:px-0">
                  <div className="w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-r from-[#00af8f]/10 to-[#00af90]/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <CalendarDays className="w-8 h-8 sm:w-12 sm:h-12 text-[#00af8f]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#333333] mb-2">
                    {appointments.length === 0
                      ? 'No Appointments Yet'
                      : 'No Results Found'}
                  </h3>
                  <p className="text-sm sm:text-lg text-[#666666] mb-4 sm:mb-6 px-4">
                    {appointments.length === 0
                      ? 'Get started by scheduling your first appointment for a senior citizen.'
                      : 'Try adjusting your search criteria or filters to find appointments.'}
                  </p>
                  <Button
                    onClick={openCreateModal}
                    className="bg-[#00af8f] hover:bg-[#00af90] text-white h-10 sm:h-12 px-6 sm:px-8 font-semibold">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Schedule New Appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
                  {filteredAppointments.map(appointment => {
                    const StatusIcon = getStatusIcon(appointment.status);
                    const TypeIcon = getTypeIcon(appointment.appointment_type);
                    const priorityConfig = getPriorityConfig(
                      appointment.priority_level || 'medium'
                    );

                    return (
                      <Card
                        key={appointment.id}
                        className="group hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
                        <CardContent className="p-3 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                              <div
                                className={`w-10 sm:w-14 h-10 sm:h-14 rounded-2xl flex items-center justify-center ${getTypeColor(
                                  appointment.appointment_type
                                )} bg-opacity-10 flex-shrink-0`}>
                                <TypeIcon
                                  className="w-5 h-5 sm:w-7 sm:h-7"
                                  style={{
                                    color: getTypeColor(
                                      appointment.appointment_type
                                    )
                                      .split(' ')[2]
                                      .replace('text-', '')
                                  }}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                  <h4 className="text-base sm:text-xl font-bold text-[#333333] group-hover:text-[#00af8f] transition-colors truncate">
                                    {appointment.senior_name}
                                  </h4>
                                  {appointment.priority_level &&
                                    appointment.priority_level !== 'medium' && (
                                      <Badge
                                        className={`${priorityConfig.bgColor} ${priorityConfig.color} border-0 w-fit`}>
                                        <Star className="w-3 h-3 mr-1" />
                                        {priorityConfig.label}
                                      </Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                                    <span className="font-medium truncate">
                                      {new Date(
                                        appointment.appointment_date
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                                    <span className="font-medium truncate">
                                      {format24To12Hour(appointment.appointment_time)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                                    <span className="font-medium truncate">
                                      {appointment.senior_barangay}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                                    <span className="font-medium truncate">
                                      {appointment.senior_phone}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                  <Badge
                                    className={`${getStatusColor(
                                      appointment.status
                                    )} border w-fit`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {appointment.status
                                      .charAt(0)
                                      .toUpperCase() +
                                      appointment.status.slice(1)}
                                  </Badge>
                                  <Badge
                                    className={`${getTypeColor(
                                      appointment.appointment_type
                                    )} border`}>
                                    <TypeIcon className="w-3 h-3 mr-1" />
                                    {getAppointmentTypeLabel(
                                      appointment.appointment_type
                                    )}
                                  </Badge>
                                  {appointment.estimated_duration && (
                                    <Badge
                                      variant="outline"
                                      className="text-gray-600 border-gray-200 text-xs">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {appointment.estimated_duration}min
                                    </Badge>
                                  )}
                                </div>

                                <div className="mb-3 sm:mb-4">
                                  <h5 className="font-semibold text-[#333333] mb-2 flex items-center gap-2">
                                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Purpose:
                                  </h5>
                                  <p className="text-xs sm:text-sm text-[#666666] leading-relaxed bg-gray-50 p-2 sm:p-3 rounded-lg line-clamp-2">
                                    {appointment.purpose}
                                  </p>
                                </div>

                                {appointment.notes && (
                                  <div className="mb-3 sm:mb-4">
                                    <h5 className="font-semibold text-[#333333] mb-2 flex items-center gap-2">
                                      <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Notes:
                                    </h5>
                                    <p className="text-xs sm:text-sm text-[#666666] bg-blue-50 p-2 sm:p-3 rounded-lg line-clamp-2">
                                      {appointment.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              {/* Status Actions Dropdown - Hidden for senior role */}
                              {role !== 'senior' &&
                                appointment.status !== 'completed' &&
                                appointment.status !== 'cancelled' && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs sm:text-sm text-gray-600 mr-1 sm:mr-2">
                                      Actions:
                                    </span>
                                    <Select
                                      value=""
                                      onValueChange={value => {
                                        if (value) {
                                          handleStatusUpdate(
                                            appointment.id,
                                            value
                                          );
                                        }
                                      }}>
                                      <SelectTrigger className="h-8 w-auto min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm">
                                        <SelectValue placeholder="Choose action" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {appointment.status === 'pending' && (
                                          <>
                                            <SelectItem
                                              value="approved"
                                              className="text-green-600">
                                              <div className="flex items-center gap-2">
                                                <Check className="w-3 sm:w-4 h-3 sm:h-4" />
                                                Approve
                                              </div>
                                            </SelectItem>
                                            <SelectItem
                                              value="cancelled"
                                              className="text-red-600">
                                              <div className="flex items-center gap-2">
                                                <X className="w-3 sm:w-4 h-3 sm:h-4" />
                                                Reject
                                              </div>
                                            </SelectItem>
                                          </>
                                        )}
                                        {appointment.status === 'approved' && (
                                          <>
                                            <SelectItem
                                              value="completed"
                                              className="text-blue-600">
                                              <div className="flex items-center gap-2">
                                                <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4" />
                                                Complete
                                              </div>
                                            </SelectItem>
                                            <SelectItem
                                              value="cancelled"
                                              className="text-red-600">
                                              <div className="flex items-center gap-2">
                                                <X className="w-3 sm:w-4 h-3 sm:h-4" />
                                                Cancel
                                              </div>
                                            </SelectItem>
                                          </>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#00af8f] hover:text-[#00af90] hover:bg-[#00af8f]/5 h-8 w-8 sm:h-10 sm:w-10"
                                onClick={() => openViewModal(appointment)}
                                title="View Details">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 h-8 w-8 sm:h-10 sm:w-10"
                                onClick={() => openEditModal(appointment)}
                                title="Edit Appointment">
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-10 sm:w-10"
                                onClick={() => openDeleteDialog(appointment)}
                                title="Delete Appointment">
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs text-[#666666] pt-3 sm:pt-4 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Created{' '}
                                <span className="font-medium">
                                  {new Date(
                                    appointment.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Updated{' '}
                                <span className="font-medium">
                                  {new Date(
                                    appointment.updated_at
                                  ).toLocaleDateString()}
                                </span>
                              </span>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Age: <span className="font-medium">{appointment.senior_age}</span>
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar View - Mobile Responsive */}
        <TabsContent value="calendar">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-[#00af8f] to-[#00af90] rounded-2xl">
                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-[#333333]">
                      Calendar View
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-[#666666] mt-1">
                      Visual overview of all appointments by date and time
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#00af8f]/10 text-[#00af8f] w-fit">
                  {filteredAppointments.length} Appointments
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] sm:h-[600px] bg-white rounded-lg border">
                <BigCalendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%', padding: '10px sm:20px' }}
                  views={['month', 'week', 'day']}
                  defaultView="month"
                  popup
                  selectable
                  onSelectEvent={event => openViewModal(event.resource)}
                  eventPropGetter={event => {
                    const appointment = event.resource;
                    let backgroundColor = '#00af8f';

                    switch (appointment.status) {
                      case 'pending':
                        backgroundColor = '#f59e0b';
                        break;
                      case 'approved':
                        backgroundColor = '#3b82f6';
                        break;
                      case 'completed':
                        backgroundColor = '#10b981';
                        break;
                      case 'cancelled':
                        backgroundColor = '#ef4444';
                        break;
                      case 'rescheduled':
                        backgroundColor = '#8b5cf6';
                        break;
                    }

                    return {
                      style: {
                        backgroundColor,
                        borderColor: backgroundColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '10px sm:12px',
                        padding: '1px sm:2px 3px sm:6px'
                      }
                    };
                  }}
                  components={{
                    event: ({ event }) => (
                      <div className="text-xs">
                        <div className="font-semibold truncate">
                          {event.resource.senior_name}
                        </div>
                        <div className="truncate">
                          {getAppointmentTypeLabel(
                            event.resource.appointment_type
                          )}
                        </div>
                      </div>
                    )
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Appointment Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <CalendarDays className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-[#00af8f]" />
              Schedule New Appointment
            </DialogTitle>
            <DialogDescription>
              Create a new appointment for a senior citizen. All fields marked
              with * are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Senior Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Select Senior Citizen *
              </Label>

              {/* Search and Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Search by name..."
                    value={seniorSearchQuery}
                    onChange={e => {
                      // Update UI immediately but debounce the API call via useEffect
                      setSeniorSearchQuery(e.target.value);
                    }}
                    className="h-10"
                  />
                </div>
                <div>
                  <BarangayFilter
                    value={selectedBarangayForSeniors}
                    onValueChange={value => {
                      setSelectedBarangayForSeniors(value);
                      // Clear the selected senior when changing barangay filter
                      if (watch('senior_citizen_id')) {
                        setValue('senior_citizen_id', '');
                        setSeniorSearchQuery('');
                      }
                    }}
                    placeholder="Filter by barangay"
                    showIcon={false}
                  />
                </div>
              </div>

              {/* Senior Selection List */}
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {isLoadingSeniors ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading senior citizens...
                  </div>
                ) : seniorCitizens.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No senior citizens found. Try adjusting your search or
                    filter.
                  </div>
                ) : (
                  <div className="divide-y">
                    {seniorCitizens.map(senior => (
                      <div
                        key={senior.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          watch('senior_citizen_id') === senior.id
                            ? 'bg-[#00af8f]/10 border-l-4 border-[#00af8f]'
                            : ''
                        }`}
                        onClick={() => handleSeniorSelection(senior.id)}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {senior.first_name} {senior.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {senior.barangay}
                            </div>
                          </div>
                          {watch('senior_citizen_id') === senior.id && (
                            <Check className="w-5 h-5 text-[#00af8f]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.senior_citizen_id && (
                <p className="text-sm text-red-600">
                  {errors.senior_citizen_id.message}
                </p>
              )}
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="appointment_type"
                  className="text-sm font-medium text-gray-700">
                  Appointment Type *
                </Label>
                <Select
                  value={watch('appointment_type')}
                  onValueChange={value =>
                    setValue('appointment_type', value as any)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">{option.label}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.appointment_type && (
                  <p className="text-sm text-red-600">
                    {errors.appointment_type.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="priority_level"
                  className="text-sm font-medium text-gray-700">
                  Priority Level *
                </Label>
                <Select
                  value={watch('priority_level')}
                  onValueChange={value =>
                    setValue('priority_level', value as any)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              option.value === 'urgent'
                                ? 'bg-red-500'
                                : option.value === 'high'
                                ? 'bg-orange-500'
                                : option.value === 'medium'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}></div>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority_level && (
                  <p className="text-sm text-red-600">
                    {errors.priority_level.message}
                  </p>
                )}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="appointment_date"
                  className="text-sm font-medium text-gray-700">
                  Appointment Date *
                </Label>
                <Input
                  type="date"
                  {...register('appointment_date')}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-10"
                />
                {errors.appointment_date && (
                  <p className="text-sm text-red-600">
                    {errors.appointment_date.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="appointment_time"
                  className="text-sm font-medium text-gray-700">
                  Appointment Time *
                </Label>
                <Select
                  value={watch('appointment_time')}
                  onValueChange={value => setValue('appointment_time', value)}
                  disabled={isLoadingTimeSlots}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingTimeSlots ? 'Loading slots...' : 'Select time'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.appointment_time && (
                  <p className="text-sm text-red-600">
                    {errors.appointment_time.message}
                  </p>
                )}
              </div>
            </div>

            {/* Purpose and Location */}
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="purpose"
                  className="text-sm font-medium text-gray-700">
                  Purpose/Reason *
                </Label>
                <Textarea
                  placeholder="Describe the purpose of this appointment..."
                  className="min-h-[80px]"
                  {...register('purpose')}
                />
                {errors.purpose && (
                  <p className="text-sm text-red-600">
                    {errors.purpose.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="location"
                  className="text-sm font-medium text-gray-700">
                  Location
                </Label>
                <Input
                  type="text"
                  placeholder="e.g., OSCA Office, Senior's Home, Barangay Hall"
                  className="h-10"
                  {...register('location')}
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="estimated_duration"
                  className="text-sm font-medium text-gray-700">
                  Estimated Duration (minutes)
                </Label>
                <Input
                  type="number"
                  min="15"
                  max="480"
                  className="h-10"
                  {...register('estimated_duration', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-gray-700">
                  Additional Notes
                </Label>
                <Textarea
                  placeholder="Any additional information or special instructions..."
                  className="min-h-[60px]"
                  {...register('notes')}
                />
              </div>
            </div>

            {/* Requirements */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Requirements
              </Label>
              <div className="mt-2 space-y-2">
                {commonRequirements.map(req => (
                  <div key={req} className="flex items-center space-x-2">
                    <Checkbox
                      id={req}
                      checked={watch('requirements')?.includes(req) || false}
                      onCheckedChange={checked => {
                        const currentRequirements = watch('requirements') || [];
                        const newRequirements = checked
                          ? [...currentRequirements, req]
                          : currentRequirements.filter(
                              (r: string) => r !== req
                            );
                        setValue('requirements', newRequirements);
                      }}
                    />
                    <Label htmlFor={req} className="text-sm text-gray-600">
                      {req}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="follow_up_required"
                checked={watch('follow_up_required')}
                onCheckedChange={checked =>
                  setValue('follow_up_required', checked as boolean)
                }
              />
              <Label
                htmlFor="follow_up_required"
                className="text-sm text-gray-600">
                Follow-up appointment required
              </Label>
            </div>

            <DialogFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Schedule Appointment
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Appointment Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <CalendarDays className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-[#00af8f]" />
              Appointment Details
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-500">
                    Senior Citizen
                  </Label>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">
                    {selectedAppointment.senior_name}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-500">
                    Status
                  </Label>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(selectedAppointment.status)} w-fit`}>
                      {selectedAppointment.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-500">
                    Appointment Type
                  </Label>
                  <p className="text-gray-900 mt-1">
                    {getAppointmentTypeLabel(
                      selectedAppointment.appointment_type
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-500">
                    Priority
                  </Label>
                  <div className="mt-1">
                    <Badge
                      className={`${
                        getPriorityConfig(
                          selectedAppointment.priority_level || 'medium'
                        ).bgColor
                      } ${
                        getPriorityConfig(
                          selectedAppointment.priority_level || 'medium'
                        ).color
                      } w-fit`}>
                      {selectedAppointment.priority_level?.toUpperCase() ||
                        'MEDIUM'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-500">
                    Date & Time
                  </Label>
                  <p className="text-gray-900 mt-1">
                    {new Date(
                      selectedAppointment.appointment_date
                    ).toLocaleDateString()}{' '}
                    at {format24To12Hour(selectedAppointment.appointment_time)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-500">
                    Location
                  </Label>
                  <p className="text-gray-900 mt-1">
                    {selectedAppointment.location || 'OSCA Office'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-500">
                  Purpose
                </Label>
                <p className="text-gray-900 mt-1 text-sm sm:text-base leading-relaxed">
                  {selectedAppointment.purpose}
                </p>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-500">
                    Notes
                  </Label>
                  <p className="text-gray-900 mt-1 text-sm sm:text-base leading-relaxed">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedAppointment);
                  }}
                  className="bg-[#00af8f] hover:bg-[#00af90] text-white h-10 sm:h-12">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Appointment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                  className="h-10 sm:h-12">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <CalendarDays className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-[#00af8f]" />
              Edit Appointment
            </DialogTitle>
            <DialogDescription>
              Update the appointment details. All fields marked with * are
              required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6">
            {/* Senior Selection (Read-only for edit) */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Senior Citizen *
              </Label>
              {selectedAppointment && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="font-medium text-gray-900">
                    {selectedAppointment.senior_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedAppointment.senior_barangay} •{' '}
                    {selectedAppointment.senior_gender}
                  </div>
                </div>
              )}
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="edit_appointment_type"
                  className="text-sm font-medium text-gray-700">
                  Appointment Type *
                </Label>
                <Select
                  value={watch('appointment_type')}
                  onValueChange={value =>
                    setValue('appointment_type', value as any)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.appointment_type && (
                  <p className="text-sm text-red-600">
                    {errors.appointment_type.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="edit_priority_level"
                  className="text-sm font-medium text-gray-700">
                  Priority Level *
                </Label>
                <Select
                  value={watch('priority_level')}
                  onValueChange={value =>
                    setValue('priority_level', value as any)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              option.value === 'urgent'
                                ? 'bg-red-500'
                                : option.value === 'high'
                                ? 'bg-orange-500'
                                : option.value === 'medium'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}></div>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority_level && (
                  <p className="text-sm text-red-600">
                    {errors.priority_level.message}
                  </p>
                )}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="edit_appointment_date"
                  className="text-sm font-medium text-gray-700">
                  Appointment Date *
                </Label>
                <Input
                  type="date"
                  {...register('appointment_date')}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-10"
                />
                {errors.appointment_date && (
                  <p className="text-sm text-red-600">
                    {errors.appointment_date.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="edit_appointment_time"
                  className="text-sm font-medium text-gray-700">
                  Appointment Time *
                </Label>
                <Select
                  value={watch('appointment_time')}
                  onValueChange={value => setValue('appointment_time', value)}
                  disabled={isLoadingTimeSlots}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingTimeSlots ? 'Loading slots...' : 'Select time'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.appointment_time && (
                  <p className="text-sm text-red-600">
                    {errors.appointment_time.message}
                  </p>
                )}
              </div>
            </div>

            {/* Purpose and Location */}
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="edit_purpose"
                  className="text-sm font-medium text-gray-700">
                  Purpose/Reason *
                </Label>
                <Textarea
                  placeholder="Describe the purpose of this appointment..."
                  className="min-h-[80px]"
                  {...register('purpose')}
                />
                {errors.purpose && (
                  <p className="text-sm text-red-600">
                    {errors.purpose.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="edit_location"
                  className="text-sm font-medium text-gray-700">
                  Location
                </Label>
                <Input
                  type="text"
                  placeholder="e.g., OSCA Office, Senior's Home, Barangay Hall"
                  className="h-10"
                  {...register('location')}
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="edit_estimated_duration"
                  className="text-sm font-medium text-gray-700">
                  Estimated Duration (minutes)
                </Label>
                <Input
                  type="number"
                  min="15"
                  max="480"
                  className="h-10"
                  {...register('estimated_duration', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label
                  htmlFor="edit_notes"
                  className="text-sm font-medium text-gray-700">
                  Additional Notes
                </Label>
                <Textarea
                  placeholder="Any additional information or special instructions..."
                  className="min-h-[60px]"
                  {...register('notes')}
                />
              </div>
            </div>

            {/* Requirements */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Requirements
              </Label>
              <div className="mt-2 space-y-2">
                {commonRequirements.map(req => (
                  <div key={req} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit_${req}`}
                      checked={watch('requirements')?.includes(req) || false}
                      onCheckedChange={checked => {
                        const currentRequirements = watch('requirements') || [];
                        const newRequirements = checked
                          ? [...currentRequirements, req]
                          : currentRequirements.filter(
                              (r: string) => r !== req
                            );
                        setValue('requirements', newRequirements);
                      }}
                    />
                    <Label
                      htmlFor={`edit_${req}`}
                      className="text-sm text-gray-600">
                      {req}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_follow_up_required"
                checked={watch('follow_up_required')}
                onCheckedChange={checked =>
                  setValue('follow_up_required', checked as boolean)
                }
              />
              <Label
                htmlFor="edit_follow_up_required"
                className="text-sm text-gray-600">
                Follow-up appointment required
              </Label>
            </div>

            <DialogFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Update Appointment
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Appointment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment for{' '}
              <strong>{selectedAppointment?.senior_name}</strong>?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Scheduled:{' '}
                {selectedAppointment &&
                  new Date(
                    selectedAppointment.appointment_date
                  ).toLocaleDateString()}{' '}
                at {format24To12Hour(selectedAppointment?.appointment_time || '')}
              </span>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Appointment
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Confirmation Dialog */}
      <AlertDialog
        open={isStatusConfirmDialogOpen}
        onOpenChange={setIsStatusConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              {pendingStatusChange?.newStatus === 'approved' && (
                <>
                  <Check className="w-5 h-5 mr-2 text-green-600" />
                  Approve Appointment
                </>
              )}
              {pendingStatusChange?.newStatus === 'cancelled' && (
                <>
                  <X className="w-5 h-5 mr-2 text-red-600" />
                  Reject Appointment
                </>
              )}
              {pendingStatusChange?.newStatus === 'completed' && (
                <>
                  <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                  Complete Appointment
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{' '}
              <strong>
                {pendingStatusChange?.newStatus === 'cancelled'
                  ? 'reject'
                  : pendingStatusChange?.newStatus}
              </strong>{' '}
              this appointment?
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                <strong>Appointment:</strong>{' '}
                {pendingStatusChange?.appointmentTitle}
              </span>
              <br />
              {pendingStatusChange?.newStatus === 'approved' && (
                <span className="text-sm text-green-700">
                  ✅ The senior citizen will be notified that their appointment
                  has been approved.
                </span>
              )}
              {pendingStatusChange?.newStatus === 'cancelled' && (
                <span className="text-sm text-red-700">
                  ❌ The senior citizen will be notified that their appointment
                  has been rejected.
                </span>
              )}
              {pendingStatusChange?.newStatus === 'completed' && (
                <span className="text-sm text-blue-700">
                  ✅ This appointment will be marked as completed and archived.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              onClick={() => {
                setIsStatusConfirmDialogOpen(false);
                setPendingStatusChange(null);
              }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusUpdate}
              disabled={isSubmitting}
              className={
                pendingStatusChange?.newStatus === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : pendingStatusChange?.newStatus === 'cancelled'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {pendingStatusChange?.newStatus === 'approved' && (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Approve Appointment
                    </>
                  )}
                  {pendingStatusChange?.newStatus === 'cancelled' && (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Reject Appointment
                    </>
                  )}
                  {pendingStatusChange?.newStatus === 'completed' && (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Appointment
                    </>
                  )}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
