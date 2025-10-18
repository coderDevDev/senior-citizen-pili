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
  DialogTitle
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Heart,
  Plus,
  Search,
  Clock,
  Check,
  CheckCircle,
  X,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  User,
  MapPin,
  Phone,
  Activity,
  AlertTriangle,
  CalendarDays,
  DollarSign,
  Download,
  Upload,
  MoreHorizontal,
  RefreshCw,
  Package,
  CheckCircle2,
  XCircle,
  FileText,
  BarChart3,
  PhilippinePesoIcon
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { BenefitsAPI } from '@/lib/api/benefits';
import { AppointmentsAPI } from '@/lib/api/appointments';
import { useAuth } from '@/contexts/auth-context';
import { BarangaySelect, BarangayFilter } from '@/components/shared-components';
import type {
  BenefitApplication,
  BenefitStats,
  SeniorCitizen,
  BenefitFilters,
  APIBenefitFormData
} from '@/types/benefits';
import { supabase } from '@/lib/supabase';

// Zod schema for benefit application form
const benefitFormSchema = z.object({
  senior_citizen_id: z.string().min(1, 'Please select a senior citizen'),
  benefit_type: z.enum(
    [
      'social_pension',
      'health_assistance',
      'food_assistance',
      'transportation',
      'utility_subsidy',
      'other'
    ],
    {
      required_error: 'Please select a benefit type'
    }
  ),
  amount_requested: z.number().min(0, 'Amount must be positive').optional(),
  purpose: z
    .string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(500, 'Purpose cannot exceed 500 characters'),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  priority_level: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  required_by_date: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  follow_up_required: z.boolean().optional(),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  scheduled_location: z.string().optional(),
  scheduled_notes: z.string().optional()
});

type BenefitFormData = z.infer<typeof benefitFormSchema>;

interface SharedBenefitsPageProps {
  role?: 'osca' | 'basca' | 'senior';
  primaryColor?: string;
  userBarangay?: string;
  title?: string;
  description?: string;
}

export default function SharedBenefitsPage({
  role = 'osca',
  primaryColor = '#00af8f',
  userBarangay,
  title = 'Benefits Management',
  description = 'Manage benefit applications for senior citizens'
}: SharedBenefitsPageProps) {
  // Main state
  const [benefitApplications, setBenefitApplications] = useState<
    BenefitApplication[]
  >([]);
  const [benefitStats, setBenefitStats] = useState<BenefitStats | null>(null);
  const [seniorCitizens, setSeniorCitizens] = useState<SeniorCitizen[]>([]);
  const [barangays, setBarangays] = useState<{ id: string; name: string }[]>(
    []
  );

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSeniors, setIsLoadingSeniors] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<BenefitApplication | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [barangayFilter, setBarangayFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

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
  } = useForm<BenefitFormData>({
    resolver: zodResolver(benefitFormSchema),
    defaultValues: {
      senior_citizen_id: '',
      benefit_type: 'social_pension',
      amount_requested: undefined,
      purpose: '',
      notes: '',
      priority_level: 'medium',
      required_by_date: '',
      requirements: [],
      follow_up_required: false,
      scheduled_date: '',
      scheduled_time: '',
      scheduled_location: '',
      scheduled_notes: ''
    }
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [applicationsData, statsData, barangaysData] = await Promise.all([
          BenefitsAPI.getBenefitApplications(),
          BenefitsAPI.getBenefitApplicationStats(),
          AppointmentsAPI.getPiliBarangays()
        ]);

        // Filter applications for senior role
        let filteredApplications = applicationsData;
        if (role === 'senior') {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;

          if (userId) {
            const { data: senior } = await supabase
              .from('senior_citizens')
              .select('id')
              .eq('user_id', userId)
              .single();

            if (senior) {
              filteredApplications = applicationsData.filter(
                application => application.senior_citizen_id === senior.id
              );
            } else {
              filteredApplications = [];
            }
          } else {
            filteredApplications = [];
          }
        } else if (role === 'basca' && userBarangay) {
          // Filter for BASCA role - only applications from their barangay
          filteredApplications = applicationsData.filter(
            application => application.senior_citizen?.barangay === userBarangay
          );
        }

        setBenefitApplications(filteredApplications);
        setBenefitStats(statsData);
        setBarangays(barangaysData);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('❌ Failed to load data', {
          description: 'Please try refreshing the page'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [role, userBarangay]);

  // Export functions
  const exportBenefitsToPDF = async () => {
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
      pdf.text('Benefits Applications Report', pageWidth / 2, 20, {
        align: 'center'
      });

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        30,
        { align: 'center' }
      );

      // Table headers
      const headers = ['Date', 'Senior', 'Benefit Type', 'Status', 'Amount'];
      const colWidths = [25, 50, 35, 25, 25];
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
      filteredBenefitApplications.forEach(application => {
        if (y > 250) {
          pdf.addPage();
          y = 30;
        }

        const rowData = [
          new Date(application.created_at).toLocaleDateString(),
          `${application.senior_citizen.first_name} ${application.senior_citizen.last_name}`,
          application.benefit_type,
          application.status,
          application.amount ? `₱${application.amount}` : 'N/A'
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
        `benefits-applications-report-${
          new Date().toISOString().split('T')[0]
        }.pdf`
      );
      toast.success('✅ PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('❌ Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportBenefitsToExcel = () => {
    try {
      setIsExporting(true);
      const data = filteredApplications.map(application => ({
        'Application Date': new Date(
          application.created_at
        ).toLocaleDateString(),
        'Senior Citizen': `${application.senior_citizen.first_name} ${application.senior_citizen.last_name}`,
        'Benefit Type': application.benefit_type,
        Status: application.status,
        Amount: application.amount ? `₱${application.amount}` : 'N/A',
        Purpose: application.purpose,
        Notes: application.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Benefits Applications');
      XLSX.writeFile(
        wb,
        `benefits-applications-report-${
          new Date().toISOString().split('T')[0]
        }.xlsx`
      );
      toast.success('✅ Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('❌ Failed to export Excel file');
    } finally {
      setIsExporting(false);
    }
  };

  const exportBenefitsToJSON = () => {
    try {
      const data = {
        title: 'Benefits Applications Report',
        generatedAt: new Date().toISOString(),
        filters: {
          status: statusFilter,
          type: typeFilter,
          barangay:
            role === 'basca' && userBarangay ? userBarangay : barangayFilter,
          priority: priorityFilter
        },
        applications: filteredApplications.map(application => ({
          id: application.id,
          created_at: application.created_at,
          senior_citizen: application.senior_citizen,
          benefit_type: application.benefit_type,
          status: application.status,
          amount: application.amount,
          purpose: application.purpose,
          notes: application.notes
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `benefits-applications-report-${
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

  // Load applications when filters change
  useEffect(() => {
    const loadApplications = async () => {
      try {
        const filters: BenefitFilters = {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          barangay:
            role === 'basca' && userBarangay
              ? userBarangay
              : barangayFilter !== 'all'
              ? barangayFilter
              : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          search: searchQuery || undefined
        };

        const applicationsData = await BenefitsAPI.getBenefitApplications(
          filters
        );
        setBenefitApplications(applicationsData);
      } catch (error) {
        console.error('Error loading benefit applications:', error);
        toast.error('❌ Failed to load benefit applications');
      }
    };

    if (!isLoading) {
      loadApplications();
    }
  }, [
    statusFilter,
    typeFilter,
    barangayFilter,
    priorityFilter,
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

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return benefitApplications.filter(application => {
      const matchesSearch =
        !searchQuery ||
        application.senior_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        application.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        application.senior_barangay
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || application.status === statusFilter;
      const matchesType =
        typeFilter === 'all' || application.benefit_type === typeFilter;
      const matchesBarangay =
        barangayFilter === 'all' ||
        application.senior_barangay === barangayFilter;
      const matchesPriority =
        priorityFilter === 'all' ||
        application.priority_level === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesBarangay &&
        matchesPriority
      );
    });
  }, [
    benefitApplications,
    searchQuery,
    statusFilter,
    typeFilter,
    barangayFilter,
    priorityFilter
  ]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          percentage: 25,
          currentStep: 0,
          isCompleted: false,
          isCancelled: false
        };
      case 'approved':
        return {
          percentage: 50,
          currentStep: 1,
          isCompleted: false,
          isCancelled: false
        };
      case 'in_progress':
        return {
          percentage: 75,
          currentStep: 2,
          isCompleted: false,
          isCancelled: false
        };
      case 'completed':
        return {
          percentage: 100,
          currentStep: 3,
          isCompleted: true,
          isCancelled: false
        };
      case 'cancelled':
        return {
          percentage: 0,
          currentStep: 0,
          isCompleted: false,
          isCancelled: true
        };
      case 'rejected':
        return {
          percentage: 0,
          currentStep: 0,
          isCompleted: false,
          isCancelled: true
        };
      default:
        return {
          percentage: 0,
          currentStep: 0,
          isCompleted: false,
          isCancelled: false
        };
    }
  };

  const getStatusTrackingSteps = () => [
    {
      id: 'submitted',
      label: 'Application Submitted',
      description:
        'Benefit application has been submitted and is awaiting review',
      icon: Package,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      color: 'text-blue-600'
    },
    {
      id: 'approved',
      label: 'Application Approved',
      description: 'Application has been reviewed and approved for processing',
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      color: 'text-green-600'
    },
    {
      id: 'processing',
      label: 'Benefit Processing',
      description: 'Benefit is being processed and prepared for distribution',
      icon: Activity,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      color: 'text-purple-600'
    },
    {
      id: 'completed',
      label: 'Benefit Distributed',
      description:
        'Benefit has been successfully distributed to the senior citizen',
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      color: 'text-green-600'
    }
  ];

  // Modal handlers
  const openViewModal = async (application: BenefitApplication) => {
    try {
      const fullApplication = await BenefitsAPI.getBenefitApplicationById(
        application.id
      );
      setSelectedApplication(fullApplication);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error loading application details:', error);
      toast.error('❌ Failed to load application details');
    }
  };

  const openEditModal = (application: BenefitApplication) => {
    setSelectedApplication(application);
    reset({
      senior_citizen_id: application.senior_citizen_id,
      benefit_type: application.benefit_type,
      amount_requested: application.amount_requested || undefined,
      purpose: application.purpose,
      notes: application.notes || '',
      priority_level: application.priority_level || 'medium',
      required_by_date: application.required_by_date || '',
      requirements: application.requirements || [],
      follow_up_required: application.follow_up_required || false,
      scheduled_date: application.scheduled_date || '',
      scheduled_time: application.scheduled_time || '',
      scheduled_location: application.scheduled_location || '',
      scheduled_notes: application.scheduled_notes || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (application: BenefitApplication) => {
    setSelectedApplication(application);
    setIsDeleteDialogOpen(true);
  };

  const handleStatusChange = (applicationId: string, currentStatus: string) => {
    // Get status change options based on current status
    const statusOptions = getStatusChangeOptions(currentStatus);

    // For now, show a simple prompt - in a real app, you'd have a proper status change modal
    const newStatus = prompt(
      `Change status from ${currentStatus} to:`,
      statusOptions[0] || ''
    );

    if (newStatus && newStatus !== currentStatus) {
      updateApplicationStatus(applicationId, newStatus);
    }
  };

  const getStatusChangeOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return ['approved', 'rejected', 'cancelled'];
      case 'approved':
        return ['in_progress', 'cancelled'];
      case 'in_progress':
        return ['completed', 'cancelled'];
      case 'completed':
        return []; // No further changes
      case 'cancelled':
      case 'rejected':
        return ['pending']; // Can be reopened
      default:
        return ['approved', 'rejected', 'cancelled'];
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      await BenefitsAPI.updateBenefitApplicationStatus(
        applicationId,
        newStatus
      );
      toast.success('✅ Status updated successfully');

      // Reload applications
      const filters: BenefitFilters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        barangay: barangayFilter !== 'all' ? barangayFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchQuery || undefined
      };
      const applicationsData = await BenefitsAPI.getBenefitApplications(
        filters
      );
      setBenefitApplications(applicationsData);

      // Update stats
      const statsData = await BenefitsAPI.getBenefitApplicationStats();
      setBenefitStats(statsData);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('❌ Failed to update status');
    }
  };

  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;

    try {
      await BenefitsAPI.deleteBenefitApplication(selectedApplication.id);
      toast.success('✅ Application deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedApplication(null);

      // Reload applications
      const filters: BenefitFilters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        barangay: barangayFilter !== 'all' ? barangayFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchQuery || undefined
      };
      const applicationsData = await BenefitsAPI.getBenefitApplications(
        filters
      );
      setBenefitApplications(applicationsData);

      // Update stats
      const statsData = await BenefitsAPI.getBenefitApplicationStats();
      setBenefitStats(statsData);
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('❌ Failed to delete application');
    }
  };

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

  // Modal handlers
  const openCreateModal = useCallback(async () => {
    reset();

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
  }, [reset, role, setValue, loadSeniorCitizens]);

  const handleCreateApplication = async (data: BenefitFormData) => {
    setIsSubmitting(true);
    try {
      const apiData: APIBenefitFormData = {
        senior_citizen_id: data.senior_citizen_id,
        benefit_type: data.benefit_type,
        amount_requested: data.amount_requested,
        purpose: data.purpose,
        notes: data.notes,
        priority_level: data.priority_level || 'medium',
        required_by_date: data.required_by_date,
        requirements: data.requirements || [],
        follow_up_required: data.follow_up_required || false,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        scheduled_location: data.scheduled_location,
        scheduled_notes: data.scheduled_notes
      };

      await BenefitsAPI.createBenefitApplication(apiData);
      toast.success('✅ Benefit application created successfully');
      setIsCreateModalOpen(false);
      reset();

      // Reload applications
      const filters: BenefitFilters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        barangay: barangayFilter !== 'all' ? barangayFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchQuery || undefined
      };
      const applicationsData = await BenefitsAPI.getBenefitApplications(
        filters
      );
      setBenefitApplications(applicationsData);

      // Update stats
      const statsData = await BenefitsAPI.getBenefitApplicationStats();
      setBenefitStats(statsData);
    } catch (error) {
      console.error('Error creating application:', error);
      toast.error('❌ Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditApplication = async (data: BenefitFormData) => {
    if (!selectedApplication) return;

    setIsSubmitting(true);
    try {
      const apiData: Partial<APIBenefitFormData> = {
        amount_requested: data.amount_requested,
        purpose: data.purpose,
        notes: data.notes,
        priority_level: data.priority_level || 'medium',
        required_by_date: data.required_by_date,
        requirements: data.requirements || [],
        follow_up_required: data.follow_up_required || false,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        scheduled_location: data.scheduled_location,
        scheduled_notes: data.scheduled_notes
      };

      await BenefitsAPI.updateBenefitApplication(
        selectedApplication.id,
        apiData
      );
      toast.success('✅ Application updated successfully');
      setIsEditModalOpen(false);
      setSelectedApplication(null);

      // Reload applications
      const filters: BenefitFilters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        barangay: barangayFilter !== 'all' ? barangayFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchQuery || undefined
      };
      const applicationsData = await BenefitsAPI.getBenefitApplications(
        filters
      );
      setBenefitApplications(applicationsData);
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('❌ Failed to update application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // File upload handlers
  const handleFileUpload = async (applicationId: string, file: File) => {
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const result = await BenefitsAPI.uploadBenefitAttachment(
        applicationId,
        file
      );
      toast.success('✅ Document uploaded successfully');

      // Update the selected application with new attachment
      if (selectedApplication && selectedApplication.id === applicationId) {
        const updatedApplication = await BenefitsAPI.getBenefitApplicationById(
          applicationId
        );
        setSelectedApplication(updatedApplication);
      }

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('❌ Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (
    attachmentId: string,
    applicationId: string
  ) => {
    try {
      await BenefitsAPI.deleteBenefitAttachment(attachmentId);
      toast.success('✅ Document deleted successfully');

      // Update the selected application
      if (selectedApplication && selectedApplication.id === applicationId) {
        const updatedApplication = await BenefitsAPI.getBenefitApplicationById(
          applicationId
        );
        setSelectedApplication(updatedApplication);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('❌ Failed to delete document');
    }
  };

  // Stats
  const stats = [
    {
      title: 'Total Applications',
      value: benefitStats?.total.toString() || '0',
      change: 'All time',
      icon: Heart,
      color: 'bg-[#00af8f]'
    },
    {
      title: 'Pending',
      value: benefitStats?.pending.toString() || '0',
      change: 'Awaiting approval',
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Approved',
      value: benefitStats?.approved.toString() || '0',
      change: 'Ready for processing',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Total Amount',
      value: benefitStats
        ? `₱${benefitStats.total_amount_approved.toLocaleString()}`
        : '₱0',
      change: 'Approved amount',
      icon: PhilippinePesoIcon,
      color: 'bg-blue-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
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
                  <Heart className="w-8 h-8 text-white" />
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
                    <DropdownMenuItem
                      onClick={exportBenefitsToExcel}
                      disabled={isExporting}
                      className="cursor-pointer">
                      <BarChart3 className="w-4 h-4 mr-2 text-green-500" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={exportBenefitsToJSON}
                      disabled={isExporting}
                      className="cursor-pointer">
                      <Download className="w-4 h-4 mr-2 text-blue-500" />
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

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
                  ? 'Apply for Benefit'
                  : 'New Benefit Application'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 overflow-hidden">
              <CardContent className="p-3 sm:p-6 relative">
                <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-transparent to-gray-100/20 rounded-full transform translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8"></div>

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-[#666666] uppercase tracking-wide truncate">
                      {stat.title}
                    </p>
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

      {/* Filters and Applications List - Mobile Responsive */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-[#00af8f] to-[#00af90] rounded-2xl">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-[#333333]">
                  {role === 'senior'
                    ? 'My Benefit Applications'
                    : 'Benefit Applications Overview'}
                </CardTitle>
                <p className="text-xs sm:text-sm text-[#666666] mt-1">
                  {role === 'senior'
                    ? `${filteredApplications.length} benefit applications`
                    : `${filteredApplications.length} of ${benefitApplications.length} applications`}
                </p>
              </div>
            </div>
            <Badge className="bg-[#00af8f]/10 text-[#00af8f] w-fit">
              {filteredApplications.length} Results
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-4 sm:pb-6">
          {/* Filters - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 sm:h-11 border-gray-200 focus:border-[#00af8f] focus:ring-[#00af8f] text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 sm:h-11 border-gray-200 focus:border-[#00af8f] focus:ring-[#00af8f]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-10 sm:h-11 border-gray-200 focus:border-[#00af8f] focus:ring-[#00af8f]">
                  <SelectValue placeholder="Benefit Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="social_pension">Social Pension</SelectItem>
                  <SelectItem value="health_assistance">
                    Health Assistance
                  </SelectItem>
                  <SelectItem value="food_assistance">
                    Food Assistance
                  </SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="utility_subsidy">
                    Utility Subsidy
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Barangay Filter - Hidden for senior role */}
            {role !== 'senior' && (
              <div>
                <BarangayFilter
                  value={barangayFilter}
                  onValueChange={setBarangayFilter}
                  placeholder="Barangay"
                  className="h-10 sm:h-11 border-gray-200 focus:border-[#00af8f] focus:ring-[#00af8f]"
                  iconType="mappin"
                />
              </div>
            )}

            {/* Priority Filter */}
            <div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-10 sm:h-11 border-gray-200 focus:border-[#00af8f] focus:ring-[#00af8f]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Applications List - Mobile Responsive */}
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
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-3 sm:px-0">
              <div className="w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-r from-[#00af8f]/10 to-[#00af90]/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-[#00af8f]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#333333] mb-2">
                {benefitApplications.length === 0
                  ? role === 'senior'
                    ? 'No Benefit Applications Yet'
                    : 'No Benefit Applications Yet'
                  : 'No Results Found'}
              </h3>
              <p className="text-sm sm:text-lg text-[#666666] mb-4 sm:mb-6 px-4">
                {benefitApplications.length === 0
                  ? role === 'senior'
                    ? 'Get started by applying for your first benefit.'
                    : 'Get started by creating your first benefit application for a senior citizen.'
                  : 'Try adjusting your search criteria or filters to find benefit applications.'}
              </p>
              <Button
                onClick={openCreateModal}
                className="bg-[#00af8f] hover:bg-[#00af90] text-white h-10 sm:h-12 px-6 sm:px-8 font-semibold">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {role === 'senior'
                  ? 'Apply for Benefit'
                  : 'Create New Application'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              {filteredApplications.map(application => (
                <Card
                  key={application.id}
                  className="group hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 sm:w-14 h-10 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-r from-[#00af8f] to-[#00af90] bg-opacity-10 flex-shrink-0">
                          <Heart
                            className="w-5 h-5 sm:w-7 sm:h-7"
                            style={{ color: '#00af8f' }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h4 className="text-base sm:text-xl font-bold text-[#333333] group-hover:text-[#00af8f] transition-colors truncate">
                              {application.senior_name}
                            </h4>
                            {application.priority_level === 'urgent' && (
                              <Badge className="bg-red-100 text-red-800 border-0 w-fit">
                                🔴 Urgent
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                              <span className="font-medium truncate">
                                {application.benefit_type
                                  .replace('_', ' ')
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                              <span className="font-medium truncate">
                                {application.senior_barangay}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                              <span className="font-medium truncate">
                                {application.senior_phone || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                              <span className="font-medium">
                                {new Date(
                                  application.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`${getStatusColor(
                                  application.status
                                )} border w-fit`}>
                                {application.status.charAt(0).toUpperCase() +
                                  application.status.slice(1)}
                              </Badge>
                              {(() => {
                                const progress = getStatusProgress(
                                  application.status
                                );
                                if (
                                  !progress.isCancelled &&
                                  progress.currentStep >= 0
                                ) {
                                  return (
                                    <div className="flex items-center gap-1">
                                      <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-1 sm:h-1.5">
                                        <div
                                          className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                                            progress.isCompleted
                                              ? 'bg-green-500'
                                              : 'bg-[#00af8f]'
                                          }`}
                                          style={{
                                            width: `${progress.percentage}%`
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-500 font-medium">
                                        {Math.round(progress.percentage)}%
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <Badge className="bg-gradient-to-r from-[#00af8f] to-[#00af90] text-white border-0">
                              {application.benefit_type
                                .replace('_', ' ')
                                .toUpperCase()}
                            </Badge>
                            {application.amount_requested && (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-200 text-xs">
                                <PhilippinePesoIcon className="w-3 h-3 mr-1" />
                                {application.amount_requested.toLocaleString()}
                              </Badge>
                            )}
                          </div>

                          <div className="mb-3 sm:mb-4">
                            <h5 className="font-semibold text-[#333333] mb-2 flex items-center gap-2">
                              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                              Purpose:
                            </h5>
                            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed bg-gray-50 p-2 sm:p-3 rounded-lg line-clamp-2">
                              {application.purpose}
                            </p>
                          </div>

                          {application.notes && (
                            <div className="mb-3 sm:mb-4">
                              <h5 className="font-semibold text-[#333333] mb-2 flex items-center gap-2">
                                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                Notes:
                              </h5>
                              <p className="text-xs sm:text-sm text-[#666666] bg-blue-50 p-2 sm:p-3 rounded-lg line-clamp-2">
                                {application.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#00af8f] hover:text-[#00af90] hover:bg-[#00af8f]/5 h-8 w-8 sm:h-10 sm:w-10"
                          onClick={() => openViewModal(application)}
                          title="View Details">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>

                        {/* Status Change Dropdown - Hidden for senior role */}
                        {role !== 'senior' &&
                          getStatusChangeOptions(application.status).length >
                            0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 w-8 sm:h-10 sm:w-10"
                                  title="Change Status">
                                  <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {getStatusChangeOptions(application.status).map(
                                  option => (
                                    <DropdownMenuItem
                                      key={option}
                                      onClick={() =>
                                        updateApplicationStatus(
                                          application.id,
                                          option
                                        )
                                      }
                                      className="cursor-pointer">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        {option.charAt(0).toUpperCase() +
                                          option.slice(1).replace('_', ' ')}
                                      </div>
                                    </DropdownMenuItem>
                                  )
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 h-8 w-8 sm:h-10 sm:w-10"
                          onClick={() => openEditModal(application)}
                          title="Edit Application">
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-10 sm:w-10"
                          onClick={() => openDeleteDialog(application)}
                          title="Delete Application">
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
                              application.created_at
                            ).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Updated{' '}
                          <span className="font-medium">
                            {new Date(
                              application.updated_at
                            ).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Priority:{' '}
                          <span className="font-medium">
                            {application.priority_level?.toUpperCase() ||
                              'MEDIUM'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Benefit Application Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#00af8f]" />
              {role === 'senior'
                ? 'Apply for Benefit'
                : 'Create New Benefit Application'}
            </DialogTitle>
            <DialogDescription>
              {role === 'senior'
                ? 'Submit a new benefit application. All fields marked with * are required.'
                : 'Create a new benefit application for a senior citizen. All fields marked with * are required.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(handleCreateApplication)}
            className="space-y-6">
            {/* Senior Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Select Senior Citizen *
              </Label>

              {/* Search and Filter Controls - Hidden for senior role */}
              {role !== 'senior' && (
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
              )}

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

            {/* Benefit Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="benefit_type"
                  className="text-sm font-medium text-gray-700">
                  Benefit Type *
                </Label>
                <Select
                  value={watch('benefit_type')}
                  onValueChange={value =>
                    setValue('benefit_type', value as any)
                  }>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select benefit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_pension">
                      Social Pension
                    </SelectItem>
                    <SelectItem value="health_assistance">
                      Health Assistance
                    </SelectItem>
                    <SelectItem value="food_assistance">
                      Food Assistance
                    </SelectItem>
                    <SelectItem value="transportation">
                      Transportation
                    </SelectItem>
                    <SelectItem value="utility_subsidy">
                      Utility Subsidy
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.benefit_type && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.benefit_type.message}
                  </p>
                )}
              </div>

              {/* Hide amount field for social pension */}
              {watch('benefit_type') !== 'social_pension' && (
                <div>
                  <Label
                    htmlFor="amount_requested"
                    className="text-sm font-medium text-gray-700">
                    Amount Requested (₱)
                  </Label>
                  <Input
                    id="amount_requested"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('amount_requested', { valueAsNumber: true })}
                    className="mt-1"
                    placeholder="0.00"
                  />
                  {errors.amount_requested && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.amount_requested.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label
                htmlFor="purpose"
                className="text-sm font-medium text-gray-700">
                Purpose *
              </Label>
              <Textarea
                id="purpose"
                {...register('purpose')}
                className="mt-1 min-h-[100px]"
                placeholder="Describe the purpose of this benefit application..."
              />
              {errors.purpose && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.purpose.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="notes"
                className="text-sm font-medium text-gray-700">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                {...register('notes')}
                className="mt-1 min-h-[80px]"
                placeholder="Any additional notes or requirements..."
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.notes.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="priority_level"
                  className="text-sm font-medium text-gray-700">
                  Priority Level
                </Label>
                <Select
                  value={watch('priority_level')}
                  onValueChange={value =>
                    setValue('priority_level', value as any)
                  }>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority_level && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.priority_level.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="required_by_date"
                  className="text-sm font-medium text-gray-700">
                  Required By Date
                </Label>
                <Input
                  id="required_by_date"
                  type="date"
                  {...register('required_by_date')}
                  className="mt-1"
                />
                {errors.required_by_date && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.required_by_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Scheduling */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Scheduling (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="scheduled_date"
                    className="text-sm font-medium text-gray-700">
                    Scheduled Date
                  </Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    {...register('scheduled_date')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="scheduled_time"
                    className="text-sm font-medium text-gray-700">
                    Scheduled Time
                  </Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    {...register('scheduled_time')}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label
                  htmlFor="scheduled_location"
                  className="text-sm font-medium text-gray-700">
                  Scheduled Location
                </Label>
                <Input
                  id="scheduled_location"
                  {...register('scheduled_location')}
                  className="mt-1"
                  placeholder="e.g., OSCA Office, Barangay Hall"
                />
              </div>

              <div className="mt-4">
                <Label
                  htmlFor="scheduled_notes"
                  className="text-sm font-medium text-gray-700">
                  Schedule Notes
                </Label>
                <Textarea
                  id="scheduled_notes"
                  {...register('scheduled_notes')}
                  className="mt-1 min-h-[80px]"
                  placeholder="Any special instructions for the scheduled benefit distribution..."
                />
              </div>
            </div>

            <DialogFooter className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#00af8f] hover:bg-[#00af90] text-white"
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {role === 'senior' ? 'Submitting...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {role === 'senior'
                      ? 'Submit Application'
                      : 'Create Application'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#00af8f]" />
              Edit Benefit Application
            </DialogTitle>
            <DialogDescription>
              Update the benefit application details. All fields marked with *
              are required.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(handleCreateApplication)}
            className="space-y-6">
            {/* Senior Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Select Senior Citizen *
              </Label>

              {/* Search and Filter Controls - Hidden for senior role */}
              {role !== 'senior' && (
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
              )}

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

            {/* Benefit Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="benefit_type"
                  className="text-sm font-medium text-gray-700">
                  Benefit Type *
                </Label>
                <Select
                  value={watch('benefit_type')}
                  onValueChange={value =>
                    setValue('benefit_type', value as any)
                  }>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select benefit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_pension">
                      Social Pension
                    </SelectItem>
                    <SelectItem value="health_assistance">
                      Health Assistance
                    </SelectItem>
                    <SelectItem value="food_assistance">
                      Food Assistance
                    </SelectItem>
                    <SelectItem value="transportation">
                      Transportation
                    </SelectItem>
                    <SelectItem value="utility_subsidy">
                      Utility Subsidy
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.benefit_type && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.benefit_type.message}
                  </p>
                )}
              </div>

              {/* Hide amount field for social pension */}
              {watch('benefit_type') !== 'social_pension' && (
                <div>
                  <Label
                    htmlFor="amount_requested"
                    className="text-sm font-medium text-gray-700">
                    Amount Requested (₱)
                  </Label>
                  <Input
                    id="amount_requested"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('amount_requested', { valueAsNumber: true })}
                    className="mt-1"
                    placeholder="0.00"
                  />
                  {errors.amount_requested && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.amount_requested.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label
                htmlFor="purpose"
                className="text-sm font-medium text-gray-700">
                Purpose *
              </Label>
              <Textarea
                id="purpose"
                {...register('purpose')}
                className="mt-1 min-h-[100px]"
                placeholder="Describe the purpose of this benefit application..."
              />
              {errors.purpose && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.purpose.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="notes"
                className="text-sm font-medium text-gray-700">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                {...register('notes')}
                className="mt-1 min-h-[80px]"
                placeholder="Any additional notes or requirements..."
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.notes.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="priority_level"
                  className="text-sm font-medium text-gray-700">
                  Priority Level
                </Label>
                <Select
                  value={watch('priority_level')}
                  onValueChange={value =>
                    setValue('priority_level', value as any)
                  }>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority_level && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.priority_level.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="required_by_date"
                  className="text-sm font-medium text-gray-700">
                  Required By Date
                </Label>
                <Input
                  id="required_by_date"
                  type="date"
                  {...register('required_by_date')}
                  className="mt-1"
                />
                {errors.required_by_date && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.required_by_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Scheduling */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Scheduling (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="scheduled_date"
                    className="text-sm font-medium text-gray-700">
                    Scheduled Date
                  </Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    {...register('scheduled_date')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="scheduled_time"
                    className="text-sm font-medium text-gray-700">
                    Scheduled Time
                  </Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    {...register('scheduled_time')}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label
                  htmlFor="scheduled_location"
                  className="text-sm font-medium text-gray-700">
                  Scheduled Location
                </Label>
                <Input
                  id="scheduled_location"
                  {...register('scheduled_location')}
                  className="mt-1"
                  placeholder="e.g., OSCA Office, Barangay Hall"
                />
              </div>

              <div className="mt-4">
                <Label
                  htmlFor="scheduled_notes"
                  className="text-sm font-medium text-gray-700">
                  Schedule Notes
                </Label>
                <Textarea
                  id="scheduled_notes"
                  {...register('scheduled_notes')}
                  className="mt-1 min-h-[80px]"
                  placeholder="Any special instructions for the scheduled benefit distribution..."
                />
              </div>
            </div>

            <DialogFooter className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#00af8f] hover:bg-[#00af90] text-white"
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {role === 'senior' ? 'Submitting...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {role === 'senior'
                      ? 'Submit Application'
                      : 'Create Application'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Application Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#00af8f]" />
              Edit Benefit Application
            </DialogTitle>
            <DialogDescription>
              Update the benefit application details. All fields marked with *
              are required.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(handleEditApplication)}
            className="space-y-6">
            {/* Senior Selection (Read-only for edit) */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Senior Citizen *
              </Label>
              {selectedApplication && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="font-medium text-gray-900">
                    {selectedApplication.senior_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedApplication.senior_barangay} •{' '}
                    {selectedApplication.senior_gender}
                  </div>
                </div>
              )}
            </div>

            {/* Benefit Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="edit_benefit_type"
                  className="text-sm font-medium text-gray-700">
                  Benefit Type *
                </Label>
                <Select
                  value={watch('benefit_type')}
                  onValueChange={value =>
                    setValue('benefit_type', value as any)
                  }>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select benefit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_pension">
                      Social Pension
                    </SelectItem>
                    <SelectItem value="health_assistance">
                      Health Assistance
                    </SelectItem>
                    <SelectItem value="food_assistance">
                      Food Assistance
                    </SelectItem>
                    <SelectItem value="transportation">
                      Transportation
                    </SelectItem>
                    <SelectItem value="utility_subsidy">
                      Utility Subsidy
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.benefit_type && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.benefit_type.message}
                  </p>
                )}
              </div>

              {/* Hide amount field for social pension */}
              {watch('benefit_type') !== 'social_pension' && (
                <div>
                  <Label
                    htmlFor="edit_amount_requested"
                    className="text-sm font-medium text-gray-700">
                    Amount Requested (₱)
                  </Label>
                  <Input
                    id="edit_amount_requested"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('amount_requested', { valueAsNumber: true })}
                    className="mt-1"
                    placeholder="0.00"
                  />
                  {errors.amount_requested && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.amount_requested.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label
                htmlFor="edit_purpose"
                className="text-sm font-medium text-gray-700">
                Purpose *
              </Label>
              <Textarea
                id="edit_purpose"
                {...register('purpose')}
                className="mt-1 min-h-[100px]"
                placeholder="Describe the purpose of this benefit application..."
              />
              {errors.purpose && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.purpose.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="edit_notes"
                className="text-sm font-medium text-gray-700">
                Additional Notes
              </Label>
              <Textarea
                id="edit_notes"
                {...register('notes')}
                className="mt-1 min-h-[80px]"
                placeholder="Any additional notes or requirements..."
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.notes.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="edit_priority_level"
                  className="text-sm font-medium text-gray-700">
                  Priority Level
                </Label>
                <Select
                  value={watch('priority_level')}
                  onValueChange={value =>
                    setValue('priority_level', value as any)
                  }>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority_level && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.priority_level.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="edit_required_by_date"
                  className="text-sm font-medium text-gray-700">
                  Required By Date
                </Label>
                <Input
                  id="edit_required_by_date"
                  type="date"
                  {...register('required_by_date')}
                  className="mt-1"
                />
                {errors.required_by_date && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.required_by_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Scheduling */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Scheduling (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="edit_scheduled_date"
                    className="text-sm font-medium text-gray-700">
                    Scheduled Date
                  </Label>
                  <Input
                    id="edit_scheduled_date"
                    type="date"
                    {...register('scheduled_date')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="edit_scheduled_time"
                    className="text-sm font-medium text-gray-700">
                    Scheduled Time
                  </Label>
                  <Input
                    id="edit_scheduled_time"
                    type="time"
                    {...register('scheduled_time')}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label
                  htmlFor="edit_scheduled_location"
                  className="text-sm font-medium text-gray-700">
                  Scheduled Location
                </Label>
                <Input
                  id="edit_scheduled_location"
                  {...register('scheduled_location')}
                  className="mt-1"
                  placeholder="e.g., OSCA Office, Barangay Hall"
                />
              </div>

              <div className="mt-4">
                <Label
                  htmlFor="edit_scheduled_notes"
                  className="text-sm font-medium text-gray-700">
                  Schedule Notes
                </Label>
                <Textarea
                  id="edit_scheduled_notes"
                  {...register('scheduled_notes')}
                  className="mt-1 min-h-[80px]"
                  placeholder="Any special instructions for the scheduled benefit distribution..."
                />
              </div>
            </div>

            <DialogFooter className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#00af8f] hover:bg-[#00af90] text-white"
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Update Application
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Application Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-[#00af8f]" />
              Benefit Application Details
            </DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Senior Citizen
                  </Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedApplication.senior_name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Status
                  </Label>
                  <Badge className={getStatusColor(selectedApplication.status)}>
                    {selectedApplication.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Benefit Type
                  </Label>
                  <p className="text-gray-900">
                    {selectedApplication.benefit_type
                      .replace('_', ' ')
                      .toUpperCase()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Priority
                  </Label>
                  <Badge className="bg-orange-100 text-orange-800">
                    {selectedApplication.priority_level?.toUpperCase() ||
                      'MEDIUM'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Created
                  </Label>
                  <p className="text-gray-900">
                    {new Date(
                      selectedApplication.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Amount Requested
                  </Label>
                  <p className="text-gray-900">
                    {selectedApplication.amount_requested
                      ? `₱${selectedApplication.amount_requested.toLocaleString()}`
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Purpose
                </Label>
                <p className="text-gray-900 mt-1">
                  {selectedApplication.purpose}
                </p>
              </div>

              {selectedApplication.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Notes
                  </Label>
                  <p className="text-gray-900 mt-1">
                    {selectedApplication.notes}
                  </p>
                </div>
              )}

              {/* Status Tracking Section */}
              <div className="border-t pt-6">
                <Label className="text-sm font-medium text-gray-500 mb-4 block">
                  Application Status Tracking
                </Label>
                {(() => {
                  const progress = getStatusProgress(
                    selectedApplication.status
                  );
                  const steps = getStatusTrackingSteps();

                  if (progress.isCancelled) {
                    return (
                      <div className="text-center py-8">
                        <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          Application Cancelled
                        </h3>
                        <p className="text-sm text-gray-500">
                          This benefit application has been cancelled
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Progress Bar */}
                      <div className="relative">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Progress: {Math.round(progress.percentage)}%
                          </span>
                          <span
                            className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(
                              selectedApplication.status
                            )}`}>
                            {selectedApplication.status
                              .replace('_', ' ')
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              progress.isCompleted
                                ? 'bg-green-500'
                                : 'bg-[#00af8f]'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Visual Timeline */}
                      <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                        {/* Timeline Steps */}
                        <div className="space-y-6">
                          {steps.map((step, index) => {
                            const isActive = index === progress.currentStep;
                            const isCompleted =
                              index < progress.currentStep ||
                              progress.isCompleted;
                            const isUpcoming = index > progress.currentStep;

                            return (
                              <div
                                key={step.id}
                                className="relative flex items-start space-x-6">
                                {/* Timeline Connector */}
                                <div className="relative flex-shrink-0">
                                  {/* Step Icon */}
                                  <div
                                    className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                      isCompleted
                                        ? `${step.bgColor} ${step.borderColor} ${step.color}`
                                        : isActive
                                        ? `${step.bgColor} ${step.borderColor} ${step.color}`
                                        : 'bg-gray-100 border-gray-300 text-gray-400'
                                    }`}>
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-5 h-5" />
                                    ) : isActive ? (
                                      <>
                                        <step.icon className="w-5 h-5" />
                                        {/* Pulse animation for active step */}
                                        <div className="absolute inset-0 rounded-full border-2 border-[#00af8f] animate-ping opacity-20"></div>
                                      </>
                                    ) : (
                                      <step.icon className="w-5 h-5" />
                                    )}
                                  </div>

                                  {/* Timeline connector line */}
                                  {index < steps.length - 1 && (
                                    <div
                                      className={`absolute left-1/2 top-10 w-0.5 h-6 transform -translate-x-1/2 ${
                                        isCompleted
                                          ? 'bg-[#00af8f]'
                                          : 'bg-gray-200'
                                      }`}></div>
                                  )}
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 min-w-0 pb-6">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h4
                                      className={`text-base font-semibold ${
                                        isActive || isCompleted
                                          ? 'text-gray-900'
                                          : 'text-gray-500'
                                      }`}>
                                      {step.label}
                                    </h4>
                                    {isActive && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#00af8f] text-white animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                        Current
                                      </span>
                                    )}
                                    {isCompleted && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Completed
                                      </span>
                                    )}
                                  </div>

                                  <p
                                    className={`text-sm leading-relaxed ${
                                      isActive || isCompleted
                                        ? 'text-gray-600'
                                        : 'text-gray-400'
                                    }`}>
                                    {step.description}
                                  </p>

                                  {isActive &&
                                    selectedApplication.updated_at && (
                                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          <Clock className="w-4 h-4 text-blue-600" />
                                          <span className="text-sm font-medium text-blue-900">
                                            Last Updated
                                          </span>
                                        </div>
                                        <p className="text-sm text-blue-700 mt-1">
                                          {new Date(
                                            selectedApplication.updated_at
                                          ).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}{' '}
                                          at{' '}
                                          {new Date(
                                            selectedApplication.updated_at
                                          ).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                    )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Estimated Timeline */}
                      {!progress.isCompleted && !progress.isCancelled && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-blue-900">
                                Estimated Timeline
                              </h4>
                              <p className="text-sm text-blue-700 mt-1">
                                {progress.currentStep === 0 &&
                                  'Application review typically takes 1-2 business days'}
                                {progress.currentStep === 1 &&
                                  'Benefit processing usually takes 3-5 business days'}
                                {progress.currentStep === 2 &&
                                  'Benefit is being prepared and will be distributed soon'}
                                {progress.currentStep === 3 &&
                                  'Benefit has been successfully distributed'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Benefit Attachments Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm font-medium text-gray-500">
                    Attached Documents
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (selectedApplication) {
                          try {
                            const latestApplication =
                              await BenefitsAPI.getBenefitApplicationById(
                                selectedApplication.id
                              );
                            setSelectedApplication(latestApplication);
                            toast.success('Attachments refreshed');
                          } catch (error) {
                            toast.error('Failed to refresh attachments');
                          }
                        }
                      }}
                      className="text-gray-600 border-gray-300 hover:bg-gray-50">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <input
                      type="file"
                      id="benefit-file-upload"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && selectedApplication) {
                          handleFileUpload(selectedApplication.id, file);
                          e.target.value = ''; // Reset input
                        }
                      }}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById('benefit-file-upload')?.click()
                      }
                      disabled={isUploading}
                      className="text-[#00af8f] border-[#00af8f] hover:bg-[#00af8f] hover:text-white">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isUploading ? (
                  <div className="text-center py-8 text-gray-500">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-[#00af8f]" />
                    <p className="text-sm">Uploading document...</p>
                  </div>
                ) : uploadSuccess ? (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Document uploaded successfully!</p>
                  </div>
                ) : selectedApplication.attachments &&
                  selectedApplication.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedApplication.attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.round(attachment.file_size / 1024)} KB •{' '}
                              {new Date(
                                attachment.uploaded_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(attachment.file_url, '_blank')
                            }
                            className="text-[#00af8f] hover:text-[#00af90] hover:bg-[#00af8f]/5">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleFileDelete(
                                attachment.id,
                                selectedApplication.id
                              )
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No documents attached yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Upload supporting documents for this benefit application
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 flex-shrink-0">
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedApplication);
                  }}
                  className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                  Edit Application
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this benefit application? This
              action cannot be undone.
              {selectedApplication && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">
                    {selectedApplication.senior_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedApplication.benefit_type
                      .replace('_', ' ')
                      .toUpperCase()}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApplication}
              className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Application'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
