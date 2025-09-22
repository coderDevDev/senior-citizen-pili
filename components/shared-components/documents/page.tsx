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
  FileText,
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
  FileCheck,
  Download,
  Upload,
  MoreHorizontal,
  RefreshCw,
  Package,
  CheckCircle2,
  XCircle,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { DocumentsAPI } from '@/lib/api/documents';
import { AppointmentsAPI } from '@/lib/api/appointments';
import { useAuth } from '@/contexts/auth-context';
import { BarangaySelect, BarangayFilter } from '@/components/shared-components';
import type {
  DocumentRequest,
  DocumentRequestStats,
  SeniorCitizen
} from '@/types/documents';
import { supabase } from '@/lib/supabase';

// Zod schema for document request form
const documentFormSchema = z.object({
  senior_citizen_id: z.string().min(1, 'Please select a senior citizen'),
  document_type: z.enum(
    [
      'osca_id',
      'medical_certificate',
      'endorsement_letter',
      'birth_certificate',
      'barangay_clearance'
    ],
    {
      required_error: 'Please select a document type'
    }
  ),
  purpose: z
    .string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(500, 'Purpose cannot exceed 500 characters'),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  priority_level: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  required_by_date: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  follow_up_required: z.boolean().optional()
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

interface SharedDocumentsPageProps {
  role?: 'osca' | 'basca' | 'senior';
  primaryColor?: string;
  userBarangay?: string;
  title?: string;
  description?: string;
}

export default function SharedDocumentsPage({
  role = 'osca',
  primaryColor = '#00af8f',
  userBarangay,
  title = 'Document Requests',
  description = 'Process document requests for senior citizens'
}: SharedDocumentsPageProps) {
  // Main state
  const [documents, setDocuments] = useState<DocumentRequest[]>([]);
  const [documentStats, setDocumentStats] = useState<DocumentStats | null>(
    null
  );
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
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentRequest | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
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
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      senior_citizen_id: '',
      document_type: 'osca_id',
      purpose: '',
      notes: '',
      priority_level: 'medium',
      required_by_date: '',
      requirements: [],
      follow_up_required: false
    }
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [documentsData, statsData, barangaysData] = await Promise.all([
          DocumentsAPI.getDocumentRequests(),
          DocumentsAPI.getDocumentRequestStats(),
          AppointmentsAPI.getPiliBarangays()
        ]);

        // Filter documents for senior role
        let filteredDocuments = documentsData;
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
              filteredDocuments = documentsData.filter(
                document => document.senior_citizen_id === senior.id
              );
            } else {
              filteredDocuments = [];
            }
          } else {
            filteredDocuments = [];
          }
        } else if (role === 'basca' && userBarangay) {
          // Filter for BASCA role - only documents from their barangay
          filteredDocuments = documentsData.filter(
            document => document.senior_citizen?.barangay === userBarangay
          );
        }

        setDocuments(filteredDocuments);
        setDocumentStats(statsData);
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
  const exportDocumentsToPDF = async () => {
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
      pdf.text('Document Requests Report', pageWidth / 2, 20, {
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
      const headers = ['Date', 'Senior', 'Document Type', 'Status', 'Priority'];
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
      filteredDocuments.forEach(document => {
        if (y > 250) {
          pdf.addPage();
          y = 30;
        }

        const rowData = [
          new Date(document.created_at).toLocaleDateString(),
          `${document.senior_citizen.first_name} ${document.senior_citizen.last_name}`,
          document.document_type,
          document.status,
          document.priority_level
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
        `document-requests-report-${new Date().toISOString().split('T')[0]}.pdf`
      );
      toast.success('✅ PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('❌ Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportDocumentsToExcel = () => {
    try {
      setIsExporting(true);
      const data = filteredDocuments.map(document => ({
        'Request Date': new Date(document.created_at).toLocaleDateString(),
        'Senior Citizen': `${document.senior_citizen.first_name} ${document.senior_citizen.last_name}`,
        'Document Type': document.document_type,
        Status: document.status,
        Priority: document.priority_level,
        Purpose: document.purpose,
        Notes: document.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Document Requests');
      XLSX.writeFile(
        wb,
        `document-requests-report-${
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

  const exportDocumentsToJSON = () => {
    try {
      const data = {
        title: 'Document Requests Report',
        generatedAt: new Date().toISOString(),
        filters: {
          status: statusFilter,
          type: typeFilter,
          barangay:
            role === 'basca' && userBarangay ? userBarangay : barangayFilter,
          priority: priorityFilter
        },
        documents: filteredDocuments.map(document => ({
          id: document.id,
          created_at: document.created_at,
          senior_citizen: document.senior_citizen,
          document_type: document.document_type,
          status: document.status,
          priority_level: document.priority_level,
          purpose: document.purpose,
          notes: document.notes
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-requests-report-${
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

  // Load documents when filters change
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const filters: DocumentFilters = {
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

        const documentsData = await DocumentsAPI.getDocumentRequests(filters);
        setDocuments(documentsData);
      } catch (error) {
        console.error('Error loading documents:', error);
        toast.error('❌ Failed to load documents');
      }
    };

    if (!isLoading) {
      loadDocuments();
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

  // Debounced senior search
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
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [
    seniorSearchQuery,
    selectedBarangayForSeniors,
    isCreateModalOpen,
    isEditModalOpen,
    loadSeniorCitizens
  ]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(document => {
      const matchesSearch =
        !searchQuery ||
        document.senior_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        document.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        document.senior_barangay
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || document.status === statusFilter;
      const matchesType =
        typeFilter === 'all' || document.document_type === typeFilter;
      const matchesBarangay =
        barangayFilter === 'all' || document.senior_barangay === barangayFilter;
      const matchesPriority =
        priorityFilter === 'all' || document.priority_level === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesBarangay &&
        matchesPriority
      );
    });
  }, [
    documents,
    searchQuery,
    statusFilter,
    typeFilter,
    barangayFilter,
    priorityFilter
  ]);

  // Stats
  const stats = [
    {
      title: 'Total Requests',
      value: documentStats?.total.toString() || '0',
      change: 'All time',
      icon: FileText,
      color: 'bg-[#00af8f]'
    },
    {
      title: 'Pending',
      value: documentStats?.pending.toString() || '0',
      change: 'Awaiting approval',
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Completed',
      value: documentStats?.completed.toString() || '0',
      change: 'Ready for pickup',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Urgent',
      value: documentStats?.urgent.toString() || '0',
      change: 'High priority',
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ];

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ready_for_pickup':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'osca_id':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medical_certificate':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'endorsement_letter':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'birth_certificate':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'barangay_clearance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const option = documentTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  // Status tracking configuration
  const getStatusTrackingSteps = () => [
    {
      id: 'pending',
      label: 'Request Submitted',
      description: 'Document request has been submitted and is awaiting review',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300'
    },
    {
      id: 'approved',
      label: 'Request Approved',
      description: 'Request has been approved and is ready for processing',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300'
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      description: 'Document is being processed by OSCA staff',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      borderColor: 'border-indigo-300'
    },
    {
      id: 'ready_for_pickup',
      label: 'Ready for Pickup',
      description: 'Document is ready and waiting for pickup',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-300'
    },
    {
      id: 'completed',
      label: 'Completed',
      description: 'Document has been picked up and request is complete',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300'
    }
  ];

  const getStatusProgress = (currentStatus: string) => {
    const steps = getStatusTrackingSteps();
    const currentIndex = steps.findIndex(step => step.id === currentStatus);

    if (currentStatus === 'cancelled' || currentStatus === 'rejected') {
      return {
        percentage: 0,
        currentStep: -1,
        isCompleted: false,
        isCancelled: true
      };
    }

    return {
      percentage: ((currentIndex + 1) / steps.length) * 100,
      currentStep: currentIndex,
      isCompleted: currentStatus === 'completed',
      isCancelled: false
    };
  };

  // Form handlers
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
  }, [reset]);

  // Form submission handlers
  const onSubmit = async (data: DocumentFormData) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating document request...', {
      description: 'Setting up the document request for the senior citizen'
    });

    try {
      const apiData: APIDocumentFormData = {
        senior_citizen_id: data.senior_citizen_id,
        document_type: data.document_type,
        purpose: data.purpose,
        notes: data.notes,
        priority_level: data.priority_level || 'medium',
        required_by_date: data.required_by_date,
        requirements: data.requirements || [],
        follow_up_required: data.follow_up_required || false
      };
      const newDocument = await DocumentsAPI.createDocumentRequest(apiData);
      setDocuments(prev => [newDocument, ...prev]);

      // Refresh stats
      const newStats = await DocumentsAPI.getDocumentRequestStats();
      setDocumentStats(newStats);

      setIsCreateModalOpen(false);
      resetForm();

      toast.dismiss(loadingToast);
      toast.success('✅ Document request created successfully!', {
        description: `Request for ${newDocument.senior_name} has been submitted`,
        duration: 5000
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to create document request', {
        description:
          error instanceof Error ? error.message : 'Please try again later'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: DocumentFormData) => {
    if (!selectedDocument) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Updating document request...', {
      description: 'Saving changes to the document request'
    });

    try {
      const updatedDocument = await DocumentsAPI.updateDocumentRequest(
        selectedDocument.id,
        data
      );
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === selectedDocument.id ? updatedDocument : doc
        )
      );

      setIsEditModalOpen(false);
      setSelectedDocument(null);
      resetForm();

      toast.dismiss(loadingToast);
      toast.success('✅ Document request updated successfully!', {
        description: `Updated request for ${updatedDocument.senior_name}`,
        duration: 5000
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to update document request', {
        description:
          error instanceof Error ? error.message : 'Please try again later'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal handlers
  const openCreateModal = useCallback(async () => {
    resetForm();

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

    console.log('Dex');
    setIsCreateModalOpen(true);
    // Load seniors based on role
    loadSeniorCitizens();
  }, [resetForm, role, setValue, loadSeniorCitizens]);

  const openEditModal = useCallback(
    (document: DocumentRequest) => {
      setSelectedDocument(document);
      reset({
        senior_citizen_id: document.senior_citizen_id,
        document_type: document.document_type as any,
        purpose: document.purpose,
        notes: document.notes || '',
        priority_level: document.priority_level as any,
        required_by_date: document.required_by_date || '',
        requirements: [],
        follow_up_required: false
      });
      setSeniorSearchQuery(document.senior_name || '');
      setIsEditModalOpen(true);
    },
    [reset]
  );

  const openViewModal = useCallback(async (document: DocumentRequest) => {
    setSelectedDocument(document);
    setIsViewModalOpen(true);

    // Fetch the latest document data including attachments
    try {
      const latestDocument = await DocumentsAPI.getDocumentRequestById(
        document.id
      );
      setSelectedDocument(latestDocument);
    } catch (error) {
      console.error('Error fetching latest document data:', error);
      // Keep the original document data if fetch fails
    }
  }, []);

  const openDeleteDialog = useCallback((document: DocumentRequest) => {
    setSelectedDocument(document);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteDocument = useCallback(async () => {
    if (!selectedDocument) return;

    const loadingToast = toast.loading('Deleting document request...', {
      description: 'Removing document request from the system'
    });

    try {
      await DocumentsAPI.deleteDocumentRequest(selectedDocument.id);
      setDocuments(prev => prev.filter(doc => doc.id !== selectedDocument.id));

      // Refresh stats
      const newStats = await DocumentsAPI.getDocumentRequestStats();
      setDocumentStats(newStats);

      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);

      toast.dismiss(loadingToast);
      toast.success('✅ Document request deleted successfully!', {
        duration: 4000
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to delete document request', {
        description:
          error instanceof Error ? error.message : 'Please try again later'
      });
    }
  }, [selectedDocument]);

  // Status change handler
  const handleStatusChange = useCallback(
    async (documentId: string, newStatus: DocumentRequest['status']) => {
      const loadingToast = toast.loading('Updating status...', {
        description: 'Changing document request status'
      });

      try {
        const updatedDocument = await DocumentsAPI.updateDocumentRequestStatus(
          documentId,
          newStatus
        );

        setDocuments(prev =>
          prev.map(doc => (doc.id === documentId ? updatedDocument : doc))
        );

        // Refresh stats
        const newStats = await DocumentsAPI.getDocumentRequestStats();
        setDocumentStats(newStats);

        toast.dismiss(loadingToast);
        toast.success('✅ Status updated successfully!', {
          description: `Document request status changed to ${newStatus}`,
          duration: 4000
        });
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('❌ Failed to update status', {
          description:
            error instanceof Error ? error.message : 'Please try again later'
        });
      }
    },
    []
  );

  // File upload handlers
  const handleFileUpload = useCallback(
    async (documentId: string, file: File) => {
      setIsUploading(true);
      const loadingToast = toast.loading('Uploading document...', {
        description: 'Please wait while we upload your file'
      });

      try {
        const attachment = await DocumentsAPI.uploadDocumentAttachment(
          documentId,
          file
        );

        // Update the document in the list to include the new attachment
        setDocuments(prev =>
          prev.map(doc => {
            if (doc.id === documentId) {
              return {
                ...doc,
                attachments: [...(doc.attachments || []), attachment]
              };
            }
            return doc;
          })
        );

        // Update the selected document if it's the same one
        if (selectedDocument && selectedDocument.id === documentId) {
          setSelectedDocument(prev => ({
            ...prev!,
            attachments: [...(prev!.attachments || []), attachment]
          }));
        }

        toast.dismiss(loadingToast);
        toast.success('✅ Document uploaded successfully!', {
          description: `File "${file.name}" has been uploaded`,
          duration: 4000
        });

        // Show brief success animation
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2000);
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('❌ Failed to upload document', {
          description:
            error instanceof Error ? error.message : 'Please try again later'
        });
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const handleFileDelete = useCallback(
    async (attachmentId: string, documentId: string) => {
      const loadingToast = toast.loading('Deleting document...', {
        description: 'Removing the attached file'
      });

      try {
        await DocumentsAPI.deleteDocumentAttachment(attachmentId);

        // Update the document in the list to remove the attachment
        setDocuments(prev =>
          prev.map(doc => {
            if (doc.id === documentId) {
              return {
                ...doc,
                attachments:
                  doc.attachments?.filter(att => att.id !== attachmentId) || []
              };
            }
            return doc;
          })
        );

        // Update the selected document if it's the same one
        if (selectedDocument && selectedDocument.id === documentId) {
          setSelectedDocument(prev => ({
            ...prev!,
            attachments:
              prev!.attachments?.filter(att => att.id !== attachmentId) || []
          }));
        }

        toast.dismiss(loadingToast);
        toast.success('✅ Document deleted successfully!', {
          duration: 4000
        });
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('❌ Failed to delete document', {
          description:
            error instanceof Error ? error.message : 'Please try again later'
        });
      }
    },
    []
  );

  // Document type options
  const documentTypeOptions = [
    { value: 'osca_id', label: 'OSCA ID Card' },
    { value: 'medical_certificate', label: 'Medical Certificate' },
    { value: 'endorsement_letter', label: 'Endorsement Letter' },
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'barangay_clearance', label: 'Barangay Clearance' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  // Status change options for actions
  const getStatusChangeOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return [
          { value: 'approved', label: 'Approve', color: 'bg-green-500' },
          { value: 'cancelled', label: 'Cancel', color: 'bg-red-500' }
        ];
      case 'approved':
        return [
          {
            value: 'in_progress',
            label: 'Start Processing',
            color: 'bg-blue-500'
          },
          { value: 'cancelled', label: 'Cancel', color: 'bg-red-500' }
        ];
      case 'in_progress':
        return [
          { value: 'completed', label: 'Complete', color: 'bg-green-500' },
          {
            value: 'ready_for_pickup',
            label: 'Ready for Pickup',
            color: 'bg-yellow-500'
          },
          { value: 'cancelled', label: 'Cancel', color: 'bg-red-500' }
        ];
      case 'ready_for_pickup':
        return [
          {
            value: 'completed',
            label: 'Mark as Picked Up',
            color: 'bg-green-500'
          }
        ];
      default:
        return [];
    }
  };

  // Common requirements
  const commonRequirements = [
    'Valid ID',
    'Proof of Residency',
    'Medical Records',
    'Photograph',
    'Birth Certificate'
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
                  <FileText className="w-8 h-8 text-white" />
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
                      onClick={exportDocumentsToPDF}
                      disabled={isExporting}
                      className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2 text-red-500" />
                      Export as PDF
                    </DropdownMenuItem> */}
                    <DropdownMenuItem
                      onClick={exportDocumentsToExcel}
                      disabled={isExporting}
                      className="cursor-pointer">
                      <BarChart3 className="w-4 h-4 mr-2 text-green-500" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={exportDocumentsToJSON}
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
                  ? 'Request Document'
                  : 'New Document Request'}
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

      {/* Filters - Mobile Responsive */}
      <Card className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-lg">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#666666] w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  placeholder="Search by senior name, document type, or purpose..."
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
                  <SelectItem value="ready_for_pickup">
                    📋 Ready for Pickup
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-44 h-10 sm:h-12 border-2 border-[#E0DDD8] focus:border-[#00af8f]">
                  <SelectValue placeholder="📄 Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="osca_id">🆔 OSCA ID</SelectItem>
                  <SelectItem value="medical_certificate">
                    🏥 Medical Cert
                  </SelectItem>
                  <SelectItem value="endorsement_letter">
                    📝 Endorsement
                  </SelectItem>
                  <SelectItem value="birth_certificate">
                    📋 Birth Cert
                  </SelectItem>
                  <SelectItem value="barangay_clearance">
                    🏛️ Clearance
                  </SelectItem>
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

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-44 h-10 sm:h-12 border-2 border-[#E0DDD8] focus:border-[#00af8f]">
                  <SelectValue placeholder="⚡ Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List - Mobile Responsive */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-[#00af8f] to-[#00af90] rounded-2xl">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-[#333333]">
                  {role === 'senior'
                    ? 'My Document Requests'
                    : 'Document Requests Overview'}
                </CardTitle>
                <p className="text-xs sm:text-sm text-[#666666] mt-1">
                  {role === 'senior'
                    ? `${filteredDocuments.length} document requests`
                    : `${filteredDocuments.length} of ${documents.length} requests`}
                </p>
              </div>
            </div>
            <Badge className="bg-[#00af8f]/10 text-[#00af8f] w-fit">
              {filteredDocuments.length} Results
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
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-3 sm:px-0">
              <div className="w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-r from-[#00af8f]/10 to-[#00af90]/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-[#00af8f]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#333333] mb-2">
                {documents.length === 0
                  ? role === 'senior'
                    ? 'No Document Requests Yet'
                    : 'No Document Requests Yet'
                  : 'No Results Found'}
              </h3>
              <p className="text-sm sm:text-lg text-[#666666] mb-4 sm:mb-6 px-4">
                {documents.length === 0
                  ? role === 'senior'
                    ? 'Get started by requesting your first document.'
                    : 'Get started by creating your first document request for a senior citizen.'
                  : 'Try adjusting your search criteria or filters to find document requests.'}
              </p>
              <Button
                onClick={openCreateModal}
                className="bg-[#00af8f] hover:bg-[#00af90] text-white h-10 sm:h-12 px-6 sm:px-8 font-semibold">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {role === 'senior' ? 'Request Document' : 'Create New Request'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              {filteredDocuments.map(document => (
                <Card
                  key={document.id}
                  className="group hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div
                          className={`w-10 sm:w-14 h-10 sm:h-14 rounded-2xl flex items-center justify-center ${getTypeColor(
                            document.document_type
                          )} bg-opacity-10 flex-shrink-0`}>
                          <FileText
                            className="w-5 h-5 sm:w-7 sm:h-7"
                            style={{
                              color: getTypeColor(document.document_type)
                                .split(' ')[2]
                                .replace('text-', '')
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h4 className="text-base sm:text-xl font-bold text-[#333333] group-hover:text-[#00af8f] transition-colors truncate">
                              {document.senior_name}
                            </h4>
                            {document.priority_level === 'urgent' && (
                              <Badge className="bg-red-100 text-red-800 border-0 w-fit">
                                🔴 Urgent
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                              <span className="font-medium truncate">
                                {getDocumentTypeLabel(document.document_type)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                              <span className="font-medium truncate">
                                {document.senior_barangay}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                              <span className="font-medium truncate">
                                {document.senior_phone}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#00af8f]" />
                              <span className="font-medium">
                                {new Date(
                                  document.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`${getStatusColor(
                                  document.status
                                )} border w-fit`}>
                                {document.status.charAt(0).toUpperCase() +
                                  document.status.slice(1)}
                              </Badge>
                              {(() => {
                                const progress = getStatusProgress(
                                  document.status
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
                            <Badge
                              className={`${getTypeColor(
                                document.document_type
                              )} border`}>
                              {getDocumentTypeLabel(document.document_type)}
                            </Badge>
                            {document.required_by_date && (
                              <Badge
                                variant="outline"
                                className="text-gray-600 border-gray-200 text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                Required by{' '}
                                {new Date(
                                  document.required_by_date
                                ).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>

                          <div className="mb-3 sm:mb-4">
                            <h5 className="font-semibold text-[#333333] mb-2 flex items-center gap-2">
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                              Purpose:
                            </h5>
                            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed bg-gray-50 p-2 sm:p-3 rounded-lg line-clamp-2">
                              {document.purpose}
                            </p>
                          </div>

                          {document.notes && (
                            <div className="mb-3 sm:mb-4">
                              <h5 className="font-semibold text-[#333333] mb-2 flex items-center gap-2">
                                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                Notes:
                              </h5>
                              <p className="text-xs sm:text-sm text-[#666666] bg-blue-50 p-2 sm:p-3 rounded-lg line-clamp-2">
                                {document.notes}
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
                          onClick={() => openViewModal(document)}
                          title="View Details">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>

                        {/* Status Change Dropdown - Hidden for senior role */}
                        {role !== 'senior' &&
                          getStatusChangeOptions(document.status).length >
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
                                {getStatusChangeOptions(document.status).map(
                                  option => (
                                    <DropdownMenuItem
                                      key={option.value}
                                      onClick={() =>
                                        handleStatusChange(
                                          document.id,
                                          option.value as any
                                        )
                                      }
                                      className="cursor-pointer">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-2 h-2 rounded-full ${option.color}`}
                                        />
                                        {option.label}
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
                          onClick={() => openEditModal(document)}
                          title="Edit Request">
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-10 sm:w-10"
                          onClick={() => openDeleteDialog(document)}
                          title="Delete Request">
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
                            {new Date(document.created_at).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Updated{' '}
                          <span className="font-medium">
                            {new Date(document.updated_at).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Priority:{' '}
                          <span className="font-medium">
                            {document.priority_level?.toUpperCase() || 'MEDIUM'}
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

      {/* Create Document Request Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#00af8f]" />
              {role === 'senior' ? 'Request Document' : 'Create New Document Request'}
            </DialogTitle>
            <DialogDescription>
              {role === 'senior'
                ? 'Submit a new document request. All fields marked with * are required.'
                : 'Create a new document request for a senior citizen. All fields marked with * are required.'}
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
                    No senior citizens found. Try adjusting your search or filter.
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

            {/* Document Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="document_type"
                  className="text-sm font-medium text-gray-700">
                  Document Type *
                </Label>
                <Select
                  value={watch('document_type')}
                  onValueChange={value =>
                    setValue('document_type', value as any)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.document_type && (
                  <p className="text-sm text-red-600">
                    {errors.document_type.message}
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
                        {option.label}
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

            {/* Purpose */}
            <div>
              <Label
                htmlFor="purpose"
                className="text-sm font-medium text-gray-700">
                Purpose/Reason *
              </Label>
              <Textarea
                placeholder="Describe the purpose of this document request..."
                className="min-h-[80px]"
                {...register('purpose')}
              />
              {errors.purpose && (
                <p className="text-sm text-red-600">{errors.purpose.message}</p>
              )}
            </div>

            {/* Required by date */}
            <div>
              <Label
                htmlFor="required_by_date"
                className="text-sm font-medium text-gray-700">
                Required by Date (Optional)
              </Label>
              <Input
                type="date"
                {...register('required_by_date')}
                min={new Date().toISOString().split('T')[0]}
                className="h-10"
              />
            </div>

            {/* Notes */}
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
                    {role === 'senior' ? 'Requesting...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    {role === 'senior' ? 'Submit Request' : 'Create Request'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Document Request Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#00af8f]" />
              Edit Document Request
            </DialogTitle>
            <DialogDescription>
              Update the document request details. All fields marked with * are
              required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6">
            {/* Senior Selection (Read-only for edit) */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Senior Citizen *
              </Label>
              {selectedDocument && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="font-medium text-gray-900">
                    {selectedDocument.senior_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedDocument.senior_barangay} •{' '}
                    {selectedDocument.senior_gender}
                  </div>
                </div>
              )}
            </div>

            {/* Document Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="edit_document_type"
                  className="text-sm font-medium text-gray-700">
                  Document Type *
                </Label>
                <Select
                  value={watch('document_type')}
                  onValueChange={value =>
                    setValue('document_type', value as any)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.document_type && (
                  <p className="text-sm text-red-600">
                    {errors.document_type.message}
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
                        {option.label}
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

            {/* Purpose */}
            <div>
              <Label
                htmlFor="edit_purpose"
                className="text-sm font-medium text-gray-700">
                Purpose/Reason *
              </Label>
              <Textarea
                placeholder="Describe the purpose of this document request..."
                className="min-h-[80px]"
                {...register('purpose')}
              />
              {errors.purpose && (
                <p className="text-sm text-red-600">{errors.purpose.message}</p>
              )}
            </div>

            {/* Required by date */}
            <div>
              <Label
                htmlFor="edit_required_by_date"
                className="text-sm font-medium text-gray-700">
                Required by Date (Optional)
              </Label>
              <Input
                type="date"
                {...register('required_by_date')}
                min={new Date().toISOString().split('T')[0]}
                className="h-10"
              />
            </div>

            {/* Notes */}
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
                    <FileText className="w-4 h-4 mr-2" />
                    Update Request
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
              Delete Document Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document request for{' '}
              <strong>{selectedDocument?.senior_name}</strong>?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Document Type:{' '}
                {selectedDocument &&
                  getDocumentTypeLabel(selectedDocument.document_type)}
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
              onClick={handleDeleteDocument}
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
                  Delete Request
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
