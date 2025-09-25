'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  Database,
  CloudOff,
  Wifi,
  WifiOff,
  Settings,
  RefreshCw
} from 'lucide-react';
import { SeniorCitizensTable } from '@/components/seniors/senior-citizens-table';
import { AddSeniorModal } from '@/components/seniors/add-senior-modal';
import { ViewSeniorModal } from '@/components/seniors/view-senior-modal';
import { DeleteSeniorDialog } from '@/components/seniors/delete-senior-dialog';
import { usePWA } from '@/hooks/usePWA';
import type { SeniorCitizen } from '@/types/property';

interface SharedSeniorsPageProps {
  role?: 'osca' | 'basca' | 'senior';
  primaryColor?: string;
  userBarangay?: string;
  title?: string;
  description?: string;
}

export default function SharedSeniorsPage({
  role = 'osca',
  primaryColor = '#00af8f',
  userBarangay,
  title = 'Senior Citizens',
  description = 'Manage and monitor all registered senior citizens'
}: SharedSeniorsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [barangayFilter, setBarangayFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSenior, setSelectedSenior] = useState<SeniorCitizen | null>(
    null
  );
  const [seniors, setSeniors] = useState<SeniorCitizen[]>([]);
  const [offlineSeniors, setOfflineSeniors] = useState<SeniorCitizen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOffline, setIsLoadingOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('online');
  const [simulateOffline, setSimulateOffline] = useState(false);

  const { isOnline, offlineQueue, syncInProgress, syncOfflineData } = usePWA();

  // Override online status for simulation
  const effectiveIsOnline = simulateOffline ? false : isOnline;

  // Fetch seniors data from the database
  const fetchSeniors = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { SeniorCitizensAPI } = await import('@/lib/api/senior-citizens');
      const result = await SeniorCitizensAPI.getAllSeniorCitizens(
        role === 'basca' && userBarangay
          ? userBarangay
          : barangayFilter !== 'all'
          ? barangayFilter
          : undefined
      );

      console.log({ result });
      if (result.success && result.data) {
        // Transform database data to match our SeniorCitizen type
        const transformedSeniors: SeniorCitizen[] = result.data.map(
          (dbSenior: any) => ({
            id: dbSenior.id,
            userId: dbSenior.user_id,
            firstName: dbSenior.first_name,
            lastName: dbSenior.last_name,
            barangay: dbSenior.barangay,
            barangayCode: dbSenior.barangay_code,
            // Reconstruct address data from codes
            addressData: {
              region: dbSenior.region_code
                ? { region_code: dbSenior.region_code, region_name: '' }
                : undefined,
              province: dbSenior.province_code
                ? { province_code: dbSenior.province_code, province_name: '' }
                : undefined,
              city: dbSenior.city_code
                ? { city_code: dbSenior.city_code, city_name: '' }
                : undefined,
              barangay: dbSenior.barangay_code
                ? {
                    brgy_code: dbSenior.barangay_code,
                    brgy_name: dbSenior.barangay
                  }
                : undefined
            },
            dateOfBirth: dbSenior.date_of_birth,
            gender: dbSenior.gender,
            address: dbSenior.address,
            contactPerson: dbSenior.contact_person,
            contactPhone: dbSenior.contact_phone,
            contactRelationship: dbSenior.contact_relationship,
            medicalConditions: dbSenior.medical_conditions || [],
            medications: dbSenior.medications || [],
            emergencyContactName: dbSenior.emergency_contact_name,
            emergencyContactPhone: dbSenior.emergency_contact_phone,
            emergencyContactRelationship:
              dbSenior.emergency_contact_relationship,
            oscaId: dbSenior.osca_id,
            seniorIdPhoto: dbSenior.senior_id_photo,
            profilePicture: dbSenior.profile_picture,
            documents: dbSenior.documents || [],
            status: dbSenior.status,
            registrationDate: dbSenior.registration_date,
            lastMedicalCheckup: dbSenior.last_medical_checkup,
            notes: dbSenior.notes,
            housingCondition: dbSenior.housing_condition,
            physicalHealthCondition: dbSenior.physical_health_condition,
            monthlyIncome: dbSenior.monthly_income,
            monthlyPension: dbSenior.monthly_pension,
            livingCondition: dbSenior.living_condition,
            beneficiaries: dbSenior.beneficiaries || [],
            createdAt: dbSenior.created_at,
            updatedAt: dbSenior.updated_at,
            createdBy: dbSenior.created_by,
            updatedBy: dbSenior.updated_by,
            // Add user data if available
            // firstName: dbSenior.users?.first_name,
            // lastName: dbSenior.users?.last_name,
            email: dbSenior.users?.email,
            phone: dbSenior.users?.phone
          })
        );

        setSeniors(transformedSeniors);
        setIsLoading(false);
      } else {
        throw new Error('Failed to fetch seniors data');
      }
    } catch (error) {
      console.error('Error fetching seniors:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setSeniors([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch offline seniors data
  const fetchOfflineSeniors = async () => {
    try {
      setIsLoadingOffline(true);
      const { getOfflineDB } = await import('@/lib/db/offline-db');
      const db = await getOfflineDB();
      const offlineData = await db.getSeniors();

      // Transform offline data to match SeniorCitizen type
      const transformedOfflineSeniors: SeniorCitizen[] = offlineData.map(
        (offlineSenior: any) => ({
          id: offlineSenior.id,
          userId: offlineSenior.userId || null,
          firstName: offlineSenior.firstName,
          lastName: offlineSenior.lastName,
          barangay: offlineSenior.barangay,
          barangayCode: offlineSenior.barangayCode,
          addressData: offlineSenior.addressData,
          dateOfBirth: offlineSenior.dateOfBirth,
          gender: offlineSenior.gender,
          address: offlineSenior.address,
          contactPerson: offlineSenior.contactPerson,
          contactPhone: offlineSenior.contactPhone,
          contactRelationship: offlineSenior.contactRelationship,
          medicalConditions: offlineSenior.medicalConditions || [],
          medications: offlineSenior.medications || [],
          emergencyContactName: offlineSenior.emergencyContactName,
          emergencyContactPhone: offlineSenior.emergencyContactPhone,
          emergencyContactRelationship:
            offlineSenior.emergencyContactRelationship,
          oscaId: offlineSenior.oscaId,
          seniorIdPhoto: offlineSenior.seniorIdPhoto,
          profilePicture: offlineSenior.profilePicture,
          documents: offlineSenior.documents || [],
          status: offlineSenior.status || 'active',
          registrationDate: offlineSenior.registrationDate,
          lastMedicalCheckup: offlineSenior.lastMedicalCheckup,
          notes: offlineSenior.notes,
          housingCondition: offlineSenior.housingCondition,
          physicalHealthCondition: offlineSenior.physicalHealthCondition,
          monthlyIncome: offlineSenior.monthlyIncome,
          monthlyPension: offlineSenior.monthlyPension,
          livingCondition: offlineSenior.livingCondition,
          beneficiaries: offlineSenior.beneficiaries || [],
          createdAt: offlineSenior.createdAt,
          updatedAt: offlineSenior.updatedAt,
          createdBy: offlineSenior.createdBy,
          updatedBy: offlineSenior.updatedBy,
          email: offlineSenior.email,
          phone: offlineSenior.phone,
          // Mark as offline
          isOffline: true
        })
      );

      // Filter by barangay if BASCA user
      const filteredOfflineSeniors =
        role === 'basca' && userBarangay
          ? transformedOfflineSeniors.filter(
              senior => senior.barangay === userBarangay
            )
          : transformedOfflineSeniors;

      setOfflineSeniors(filteredOfflineSeniors);
    } catch (error) {
      console.error('Error fetching offline seniors:', error);
      setOfflineSeniors([]);
    } finally {
      setIsLoadingOffline(false);
    }
  };

  // Fetch data on component mount and when filters change
  // Export functions
  const exportSeniorsToPDF = async () => {
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
      pdf.text('Senior Citizens Report', pageWidth / 2, 20, {
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
      const headers = ['Name', 'Barangay', 'Age', 'Gender', 'Status'];
      const colWidths = [50, 40, 20, 25, 25];
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
      filteredSeniors.forEach(senior => {
        if (y > 250) {
          pdf.addPage();
          y = 30;
        }

        const age =
          new Date().getFullYear() - new Date(senior.dateOfBirth).getFullYear();
        const rowData = [
          `${senior.firstName} ${senior.lastName}`,
          senior.barangay,
          age.toString(),
          senior.gender,
          senior.status
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
        `senior-citizens-report-${new Date().toISOString().split('T')[0]}.pdf`
      );
      toast.success('✅ PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('❌ Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportSeniorsToExcel = () => {
    try {
      setIsExporting(true);
      const data = filteredSeniors.map(senior => {
        const age =
          new Date().getFullYear() - new Date(senior.dateOfBirth).getFullYear();
        return {
          Name: `${senior.firstName} ${senior.lastName}`,
          Barangay: senior.barangay,
          Age: age,
          Gender: senior.gender,
          Status: senior.status,
          'Contact Phone': senior.contactPhone || '',
          'OSCA ID': senior.oscaId || '',
          'Registration Date': senior.registrationDate
            ? new Date(senior.registrationDate).toLocaleDateString()
            : ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Senior Citizens');
      XLSX.writeFile(
        wb,
        `senior-citizens-report-${new Date().toISOString().split('T')[0]}.xlsx`
      );
      toast.success('✅ Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('❌ Failed to export Excel file');
    } finally {
      setIsExporting(false);
    }
  };

  const exportSeniorsToJSON = () => {
    try {
      const data = {
        title: 'Senior Citizens Report',
        generatedAt: new Date().toISOString(),
        filters: {
          barangay:
            role === 'basca' && userBarangay ? userBarangay : barangayFilter
        },
        seniors: filteredSeniors.map(senior => ({
          id: senior.id,
          firstName: senior.firstName,
          lastName: senior.lastName,
          barangay: senior.barangay,
          dateOfBirth: senior.dateOfBirth,
          gender: senior.gender,
          status: senior.status,
          contactPhone: senior.contactPhone,
          oscaId: senior.oscaId,
          registrationDate: senior.registrationDate
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `senior-citizens-report-${
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

  // Sync all offline data
  const handleSyncAllData = async () => {
    if (effectiveIsOnline && syncOfflineData) {
      try {
        await syncOfflineData();
        // Refresh data after sync
        await fetchSeniors();
        await fetchOfflineSeniors();
        toast.success('All offline data synced successfully');
      } catch (error) {
        console.error('Sync failed:', error);
        toast.error('Failed to sync data');
      }
    }
  };

  // Sync individual offline entry
  const handleSyncIndividual = async (senior: SeniorCitizen) => {
    if (!effectiveIsOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    try {
      const { SeniorCitizensAPI } = await import('@/lib/api/senior-citizens');

      // Prepare the data for API (remove offline-specific fields)
      const apiData = {
        email: senior.email,
        password: senior.password || 'temp123', // Use existing password or generate temp
        firstName: senior.firstName,
        lastName: senior.lastName,
        dateOfBirth: senior.dateOfBirth,
        gender: senior.gender,
        barangay: senior.barangay,
        barangayCode: senior.barangayCode,
        address: senior.address,
        addressData: senior.addressData,
        contactPerson: senior.contactPerson,
        contactPhone: senior.contactPhone,
        contactRelationship: senior.contactRelationship,
        emergencyContactName: senior.emergencyContactName,
        emergencyContactPhone: senior.emergencyContactPhone,
        emergencyContactRelationship: senior.emergencyContactRelationship,
        medicalConditions: senior.medicalConditions,
        medications: senior.medications,
        notes: senior.notes,
        housingCondition: senior.housingCondition,
        physicalHealthCondition: senior.physicalHealthCondition,
        monthlyIncome: senior.monthlyIncome,
        monthlyPension: senior.monthlyPension,
        livingCondition: senior.livingCondition,
        profilePicture: senior.profilePicture,
        seniorIdPhoto: senior.seniorIdPhoto,
        beneficiaries: senior.beneficiaries
      };

      // Create on server
      const result = await SeniorCitizensAPI.createSeniorCitizen(apiData);

      if (result.success) {
        // Remove from offline storage
        const { getOfflineDB } = await import('@/lib/db/offline-db');
        const db = await getOfflineDB();
        await db.deleteSenior(senior.id);

        // Refresh data
        await fetchSeniors();
        await fetchOfflineSeniors();

        toast.success(
          `${senior.firstName} ${senior.lastName} synced to server successfully!`
        );
      } else {
        throw new Error(result.message || 'Failed to sync senior');
      }
    } catch (error) {
      console.error('Individual sync failed:', error);
      toast.error(`Failed to sync ${senior.firstName} ${senior.lastName}`);
    }
  };

  // Simulate offline data for testing
  const simulateOfflineData = async () => {
    try {
      const { getOfflineDB } = await import('@/lib/db/offline-db');
      const db = await getOfflineDB();

      // Create a test offline senior citizen
      const testOfflineSenior = {
        id: `test-offline-${Date.now()}`,
        email: `test-offline-${Date.now()}@example.com`,
        password: 'test123',
        firstName: 'Test',
        lastName: 'Offline',
        dateOfBirth: '1950-01-01',
        gender: 'male',
        barangay: userBarangay || 'Test Barangay',
        barangayCode: 'test_barangay',
        address: '123 Test Street, Test Barangay, Pili, Camarines Sur',
        addressData: {
          region: { region_code: '05', region_name: 'Region V - Bicol' },
          province: { province_code: '0517', province_name: 'Camarines Sur' },
          city: { city_code: '051724', city_name: 'Pili' },
          barangay: {
            brgy_code: 'test_barangay',
            brgy_name: userBarangay || 'Test Barangay'
          }
        },
        emergencyContactName: 'Test Contact',
        emergencyContactPhone: '09123456789',
        emergencyContactRelationship: 'Son',
        medicalConditions: ['Test Condition'],
        medications: ['Test Medication'],
        housingCondition: 'owned',
        physicalHealthCondition: 'good',
        monthlyIncome: 5000,
        monthlyPension: 2000,
        livingCondition: 'independent',
        beneficiaries: [],
        status: 'active',
        registrationDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOffline: true
      };

      await db.saveSenior(testOfflineSenior);
      toast.success('Test offline data created successfully!');

      // Refresh offline data
      fetchOfflineSeniors();

      // Switch to offline tab to see the new data
      setActiveTab('offline');
    } catch (error) {
      console.error('Failed to create test offline data:', error);
      toast.error('Failed to create test offline data');
    }
  };

  useEffect(() => {
    fetchSeniors();
    fetchOfflineSeniors();
  }, [barangayFilter]);

  // Refresh offline data when sync happens
  useEffect(() => {
    if (effectiveIsOnline) {
      // When coming back online, refresh both online and offline data
      fetchSeniors();
      fetchOfflineSeniors();
    }
  }, [effectiveIsOnline]);

  // Mock data for fallback demonstration (remove when database is fully set up)
  const mockSeniors: SeniorCitizen[] = [
    {
      id: '1',
      userId: 'user1',
      barangay: 'Barangay 1',
      barangayCode: 'BG001',
      dateOfBirth: '1950-03-15',
      gender: 'female',
      address: '123 Main Street, City',
      contactPerson: 'Maria Santos Jr.',
      contactPhone: '+639123456789',
      contactRelationship: 'Daughter',
      medicalConditions: ['Hypertension', 'Diabetes'],
      medications: ['Metformin', 'Amlodipine'],
      emergencyContactName: 'Juan Santos',
      emergencyContactPhone: '+639123456788',
      emergencyContactRelationship: 'Son',
      oscaId: 'OSCA-2024-001',
      seniorIdPhoto:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk9TQ0EgU2VuaW9yIENpdGl6ZW4gSUQ8L3RleHQ+Cjx0ZXh0IHg9IjE1MCIgeT0iMjMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1hcmlhIFNhbnRvczwvdGV4dD4KPHN2Zz4K',
      documents: ['OSCA ID', 'Medical Certificate'],
      status: 'active',
      registrationDate: '2024-01-15',
      lastMedicalCheckup: '2024-01-10',
      notes: 'Regular checkup needed',
      // New fields
      housingCondition: 'owned',
      physicalHealthCondition: 'good',
      monthlyIncome: 25000,
      monthlyPension: 15000,
      livingCondition: 'with_family',
      beneficiaries: [
        {
          id: 'ben1',
          seniorCitizenId: '1',
          name: 'Maria Santos Jr.',
          relationship: 'Daughter',
          dateOfBirth: '1980-05-20',
          gender: 'female',
          address: '123 Main Street, City',
          contactPhone: '+639123456789',
          occupation: 'Teacher',
          monthlyIncome: 35000,
          isDependent: false,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'ben2',
          seniorCitizenId: '1',
          name: 'Juan Santos',
          relationship: 'Son',
          dateOfBirth: '1982-08-15',
          gender: 'male',
          address: '456 Oak Avenue, City',
          contactPhone: '+639123456788',
          occupation: 'Engineer',
          monthlyIncome: 45000,
          isDependent: false,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        }
      ],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      createdBy: 'admin1',
      updatedBy: 'admin1'
    },
    {
      id: '2',
      userId: 'user2',
      barangay: 'Barangay 2',
      barangayCode: 'BG002',
      dateOfBirth: '1945-07-22',
      gender: 'male',
      address: '456 Oak Avenue, City',
      contactPerson: 'Ana Dela Cruz',
      contactPhone: '+639123456787',
      contactRelationship: 'Daughter',
      medicalConditions: ['Arthritis'],
      medications: ['Ibuprofen'],
      emergencyContactName: 'Pedro Dela Cruz',
      emergencyContactPhone: '+639123456786',
      emergencyContactRelationship: 'Son',
      oscaId: 'OSCA-2024-002',
      seniorIdPhoto:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk9TQ0EgU2VuaW9yIENpdGl6ZW4gSUQ8L3RleHQ+Cjx0ZXh0IHg9IjE1MCIgeT0iMjMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkp1YW4gRGVsYSBDcnV6PC90ZXh0Pgo8c3ZnPgo=',
      documents: ['OSCA ID'],
      status: 'active',
      registrationDate: '2024-01-10',
      lastMedicalCheckup: '2024-01-05',
      notes: 'Mobility assistance needed',
      // New fields
      housingCondition: 'rented',
      physicalHealthCondition: 'fair',
      monthlyIncome: 18000,
      monthlyPension: 12000,
      livingCondition: 'independent',
      beneficiaries: [
        {
          id: 'ben3',
          seniorCitizenId: '2',
          name: 'Ana Dela Cruz',
          relationship: 'Daughter',
          dateOfBirth: '1975-03-10',
          gender: 'female',
          address: '789 Pine Street, City',
          contactPhone: '+639123456787',
          occupation: 'Nurse',
          monthlyIncome: 40000,
          isDependent: false,
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z'
        }
      ],
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
      createdBy: 'admin1',
      updatedBy: 'admin1'
    },
    {
      id: '3',
      userId: 'user3',
      barangay: 'Barangay 3',
      barangayCode: 'BG003',
      dateOfBirth: '1955-12-08',
      gender: 'female',
      address: '789 Pine Street, City',
      contactPerson: 'Carlos Reyes',
      contactPhone: '+639123456785',
      contactRelationship: 'Son',
      medicalConditions: ['Heart Disease'],
      medications: ['Aspirin', 'Lisinopril'],
      emergencyContactName: 'Sofia Reyes',
      emergencyContactPhone: '+639123456784',
      emergencyContactRelationship: 'Daughter',
      oscaId: 'OSCA-2024-003',
      seniorIdPhoto:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk9TQ0EgU2VuaW9yIENpdGl6ZW4gSUQ8L3RleHQ+Cjx0ZXh0IHg9IjE1MCIgeT0iMjMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFuYSBSZXllczwvdGV4dD4KPHN2Zz4K',
      documents: ['OSCA ID', 'Medical Certificate', 'Heart Specialist Report'],
      status: 'active',
      registrationDate: '2024-01-08',
      lastMedicalCheckup: '2024-01-03',
      notes: 'Cardiac monitoring required',
      // New fields
      housingCondition: 'with_family',
      physicalHealthCondition: 'poor',
      monthlyIncome: 15000,
      monthlyPension: 10000,
      livingCondition: 'with_caregiver',
      beneficiaries: [
        {
          id: 'ben4',
          seniorCitizenId: '3',
          name: 'Carlos Reyes',
          relationship: 'Son',
          dateOfBirth: '1985-06-25',
          gender: 'male',
          address: '321 Elm Street, City',
          contactPhone: '+639123456785',
          occupation: 'Doctor',
          monthlyIncome: 60000,
          isDependent: false,
          createdAt: '2024-01-08T10:00:00Z',
          updatedAt: '2024-01-08T10:00:00Z'
        },
        {
          id: 'ben5',
          seniorCitizenId: '3',
          name: 'Sofia Reyes',
          relationship: 'Daughter',
          dateOfBirth: '1988-09-12',
          gender: 'female',
          address: '654 Maple Street, City',
          contactPhone: '+639123456784',
          occupation: 'Accountant',
          monthlyIncome: 38000,
          isDependent: false,
          createdAt: '2024-01-08T10:00:00Z',
          updatedAt: '2024-01-08T10:00:00Z'
        }
      ],
      createdAt: '2024-01-08T10:00:00Z',
      updatedAt: '2024-01-08T10:00:00Z',
      createdBy: 'admin1',
      updatedBy: 'admin1'
    }
  ];

  // Calculate dynamic stats from real data (including offline)
  const calculateStats = () => {
    const totalOnline = seniors.length;
    const totalOffline = offlineSeniors.length;
    const totalSeniors = totalOnline + totalOffline;

    const activeOnline = seniors.filter(s => s.status === 'active').length;
    const activeOffline = offlineSeniors.filter(
      s => s.status === 'active'
    ).length;
    const activeSeniors = activeOnline + activeOffline;

    const inactiveOnline = seniors.filter(s => s.status === 'inactive').length;
    const inactiveOffline = offlineSeniors.filter(
      s => s.status === 'inactive'
    ).length;
    const inactiveSeniors = inactiveOnline + inactiveOffline;

    const deceasedOnline = seniors.filter(s => s.status === 'deceased').length;
    const deceasedOffline = offlineSeniors.filter(
      s => s.status === 'deceased'
    ).length;
    const deceasedSeniors = deceasedOnline + deceasedOffline;

    // Calculate new this month (from both online and offline data)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const allSeniors = [...seniors, ...offlineSeniors];
    const newThisMonth = allSeniors.filter(s => {
      const regDate = new Date(s.registrationDate || s.createdAt);
      return (
        regDate.getMonth() === currentMonth &&
        regDate.getFullYear() === currentYear
      );
    }).length;

    return [
      {
        title: 'Total Seniors',
        value: totalSeniors.toLocaleString(),
        change: `${totalOnline} online, ${totalOffline} offline`,
        icon: Users,
        color: primaryColor,
        textColor: primaryColor
      },
      {
        title: 'Active Seniors',
        value: activeSeniors.toLocaleString(),
        change: `${Math.round(
          (activeSeniors / Math.max(totalSeniors, 1)) * 100
        )}%`,
        icon: UserPlus,
        color: primaryColor,
        textColor: primaryColor
      },
      {
        title: 'New This Month',
        value: newThisMonth.toLocaleString(),
        change: `+${newThisMonth}`,
        icon: Calendar,
        color: '#ffd416',
        textColor: '#ffd416'
      },
      {
        title: 'Inactive/Deceased',
        value: (inactiveSeniors + deceasedSeniors).toLocaleString(),
        change: `${inactiveSeniors} inactive, ${deceasedSeniors} deceased`,
        icon: FileText,
        color: '#ef4444', // red-500
        textColor: '#ef4444'
      }
    ];
  };

  const stats = calculateStats();

  const handleAddSenior = () => {
    setModalMode('create');
    setSelectedSenior(null);
    setIsModalOpen(true);
  };

  const handleEditSenior = (senior: SeniorCitizen) => {
    setSelectedSenior(senior);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewSenior = (senior: SeniorCitizen) => {
    setSelectedSenior(senior);
    setIsViewModalOpen(true);
  };

  const handleDeleteSenior = (senior: SeniorCitizen) => {
    setSelectedSenior(senior);
    setIsDeleteDialogOpen(true);
  };

  const handleExportData = () => {
    // Export functionality
    console.log('Exporting senior citizens data...');
  };

  // Get current data based on active tab
  const currentSeniors = activeTab === 'online' ? seniors : offlineSeniors;
  const currentIsLoading =
    activeTab === 'online' ? isLoading : isLoadingOffline;

  // Filter seniors based on search and filters
  const filteredSeniors = currentSeniors.filter(senior => {
    const matchesSearch =
      searchQuery === '' ||
      `${senior.firstName} ${senior.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      senior.oscaId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      senior.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
      senior.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || senior.status === statusFilter;

    const matchesBarangay =
      barangayFilter === 'all' || senior.barangay === barangayFilter;

    return matchesSearch && matchesStatus && matchesBarangay;
  });

  // Get unique barangays for filter dropdown (from both online and offline data)
  const uniqueBarangays = Array.from(
    new Set([...seniors, ...offlineSeniors].map(s => s.barangay))
  ).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">{title}</h1>
          <p className="text-[#666666] mt-2">
            {description}
            {isLoading && (
              <span className="ml-2" style={{ color: primaryColor }}>
                Loading...
              </span>
            )}
            {!isLoading && (
              <span className="ml-2" style={{ color: primaryColor }}>
                ({filteredSeniors.length} records)
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={`text-xs ${
                effectiveIsOnline
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
              {effectiveIsOnline ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  {simulateOffline ? 'Simulated Online' : 'Online'}
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  {simulateOffline ? 'Simulated Offline' : 'Offline'}
                </>
              )}
            </Badge>
            {!effectiveIsOnline &&
              offlineQueue &&
              Array.isArray(offlineQueue) &&
              offlineQueue.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                  {offlineQueue.length} pending sync
                </Badge>
              )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Simulation Controls */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
            <Settings className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Simulation:</span>
            <Switch
              checked={simulateOffline}
              onCheckedChange={setSimulateOffline}
              className="data-[state=checked]:bg-orange-500"
            />
            <span className="text-xs text-gray-600">
              {simulateOffline ? 'Offline' : 'Online'}
            </span>
          </div>

          {/* Test Offline Data Button */}
          {simulateOffline && (
            <Button
              variant="outline"
              onClick={simulateOfflineData}
              className="border-blue-500 text-blue-500 hover:bg-blue-500/10">
              <Plus className="w-4 h-4 mr-2" />
              Test Offline Data
            </Button>
          )}

          {!effectiveIsOnline && (
            <Button
              variant="outline"
              onClick={handleSyncAllData}
              disabled={syncInProgress}
              className="border-orange-500 text-orange-500 hover:bg-orange-500/10">
              {syncInProgress ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Data
                </>
              )}
            </Button>
          )}

          {/* Bulk Sync Button - Show when there are offline entries and online */}
          {effectiveIsOnline && offlineSeniors.length > 0 && (
            <Button
              variant="outline"
              onClick={handleSyncAllData}
              disabled={syncInProgress}
              className="border-green-500 text-green-500 hover:bg-green-500/10">
              {syncInProgress ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing All...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync All Offline ({offlineSeniors.length})
                </>
              )}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={isLoading || filteredSeniors.length === 0}
                className="disabled:opacity-50"
                style={
                  {
                    borderColor: primaryColor,
                    color: primaryColor,
                    '--tw-ring-color': `${primaryColor}40`
                  } as React.CSSProperties & { [key: string]: string }
                }>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportSeniorsToPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportSeniorsToExcel}>
                <FileText className="w-4 h-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportSeniorsToJSON}>
                <FileText className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={handleAddSenior}
            className="text-white shadow-lg hover:shadow-xl transition-all duration-200"
            style={
              {
                backgroundColor: primaryColor,
                '--tw-ring-color': `${primaryColor}40`
              } as React.CSSProperties & { [key: string]: string }
            }>
            <Plus className="w-4 h-4 mr-2" />
            Add Senior Citizen
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#666666] uppercase tracking-wide">
                      {stat.title}
                    </p>
                    {isLoading ? (
                      <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
                    ) : (
                      <p className="text-3xl font-bold text-[#333333] mt-2">
                        {stat.value}
                      </p>
                    )}
                    {isLoading ? (
                      <div className="w-12 h-4 bg-gray-200 rounded animate-pulse mt-1"></div>
                    ) : (
                      <p
                        className="text-sm font-medium mt-1"
                        style={{ color: stat.textColor }}>
                        {stat.change}
                      </p>
                    )}
                  </div>
                  <div
                    className="p-4 rounded-2xl backdrop-blur-sm"
                    style={{ backgroundColor: `${stat.color}1A` }}>
                    <Icon
                      className="w-7 h-7"
                      style={{ color: stat.textColor }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Search */}
      <Card className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#666666] w-5 h-5" />
                <Input
                  placeholder="Search by name, OSCA ID, address, or barangay..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-white transition-all duration-200 placeholder:text-[#999999] hover:border-[#00af8f]/50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] w-4 h-4 z-10" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44 h-14 pl-10 border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-white">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-[#E0DDD8] shadow-lg">
                    <SelectItem
                      value="all"
                      className="rounded-lg hover:bg-[#00af8f]/5">
                      All Status
                    </SelectItem>
                    <SelectItem
                      value="active"
                      className="rounded-lg hover:bg-[#00af8f]/5">
                      Active
                    </SelectItem>
                    <SelectItem
                      value="inactive"
                      className="rounded-lg hover:bg-[#00af8f]/5">
                      Inactive
                    </SelectItem>
                    <SelectItem
                      value="deceased"
                      className="rounded-lg hover:bg-[#00af8f]/5">
                      Deceased
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] w-4 h-4 z-10" />
                <Select
                  value={barangayFilter}
                  onValueChange={setBarangayFilter}>
                  <SelectTrigger className="w-44 h-14 pl-10 border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-white">
                    <SelectValue placeholder="Filter by Barangay" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-[#E0DDD8] shadow-lg">
                    <SelectItem
                      value="all"
                      className="rounded-lg hover:bg-[#00af8f]/5">
                      All Barangays
                    </SelectItem>
                    {uniqueBarangays.map(barangay => (
                      <SelectItem
                        key={barangay}
                        value={barangay}
                        className="rounded-lg hover:bg-[#00af8f]/5">
                        {barangay}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Search Results Summary */}
          {searchQuery && (
            <div className="mt-4 p-3 bg-[#00af8f]/5 rounded-xl border border-[#00af8f]/20">
              <p className="text-sm text-[#00af8f] font-medium">
                Found {filteredSeniors.length} result
                {filteredSeniors.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Senior Citizens Table with Tabs */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 border-b border-[#E0DDD8]/30">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00af8f]/10 rounded-xl">
                <Users className="w-6 h-6 text-[#00af8f]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#333333]">
                  Senior Citizens Database
                </h3>
                <p className="text-sm text-[#666666] mt-1">
                  {currentIsLoading ? (
                    <span className="animate-pulse">Loading records...</span>
                  ) : (
                    `${filteredSeniors.length} of ${currentSeniors.length} records displayed`
                  )}
                </p>
              </div>
            </div>
            {!currentIsLoading && currentSeniors.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-[#00af8f]/10 text-[#00af8f] px-3 py-1">
                {filteredSeniors.length} Records
              </Badge>
            )}
          </CardTitle>

          {/* Tabs for Online/Offline Data */}
          <div className="mt-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="online" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Online Data
                  {seniors.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {seniors.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="offline"
                  className="flex items-center gap-2">
                  <CloudOff className="w-4 h-4" />
                  Offline Data
                  {offlineSeniors.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs bg-orange-100 text-orange-800">
                      {offlineSeniors.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="online" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-[#666666]">
                    <Database className="w-4 h-4" />
                    <span>
                      Online data from server ({seniors.length} records)
                    </span>
                    {!effectiveIsOnline && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs bg-red-100 text-red-800 border-red-200">
                        {simulateOffline ? 'Simulated Offline' : 'Offline'}
                      </Badge>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="offline" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-[#666666]">
                    <CloudOff className="w-4 h-4" />
                    <span>
                      Offline data pending sync ({offlineSeniors.length}{' '}
                      records)
                    </span>
                    {offlineQueue &&
                      Array.isArray(offlineQueue) &&
                      offlineQueue.length > 0 && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-200">
                          {offlineQueue.length} pending sync
                        </Badge>
                      )}
                  </div>
                  {offlineSeniors.length > 0 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        💡 These records were created or modified while offline.
                        They will be synced to the server when you're back
                        online.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-[#333333] mb-2">
                Error Loading Data
              </h3>
              <p className="text-[#666666] mb-4">{error}</p>
              <Button
                onClick={fetchSeniors}
                className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-[#00af8f]/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Users className="w-8 h-8 text-[#00af8f]" />
              </div>
              <h3 className="text-lg font-semibold text-[#333333] mb-2">
                Loading Senior Citizens
              </h3>
              <p className="text-[#666666]">
                Please wait while we fetch the data...
              </p>
              <div className="mt-4 flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#00af8f] rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-[#00af8f] rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}></div>
                  <div
                    className="w-2 h-2 bg-[#00af8f] rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          ) : filteredSeniors.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-[#00af8f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {currentSeniors.length === 0 ? (
                  <UserPlus className="w-8 h-8 text-[#00af8f]" />
                ) : (
                  <Search className="w-8 h-8 text-[#00af8f]" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-[#333333] mb-2">
                {currentSeniors.length === 0
                  ? activeTab === 'online'
                    ? 'No Online Data'
                    : 'No Offline Data'
                  : 'No Results Found'}
              </h3>
              <p className="text-[#666666] mb-4">
                {currentSeniors.length === 0
                  ? activeTab === 'online'
                    ? 'No online senior citizen data available. Check your connection or try switching to offline data.'
                    : 'No offline data available. Data will appear here when you create or edit records while offline.'
                  : searchQuery
                  ? `No senior citizens match "${searchQuery}". Try adjusting your search terms.`
                  : 'No senior citizens match the selected filters. Try changing your filter options.'}
              </p>
              {currentSeniors.length === 0 && activeTab === 'online' ? (
                <Button
                  onClick={handleAddSenior}
                  className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Senior Citizen
                </Button>
              ) : (
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setBarangayFilter('all');
                    }}
                    className="border-[#00af8f] text-[#00af8f] hover:bg-[#00af8f]/5">
                    Clear Filters
                  </Button>
                  <Button
                    onClick={handleAddSenior}
                    className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Senior Citizen
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <SeniorCitizensTable
                seniors={filteredSeniors}
                onEdit={handleEditSenior}
                onView={handleViewSenior}
                onDelete={handleDeleteSenior}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals and Dialogs */}
      <AddSeniorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSenior(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedSenior(null);
          // Refresh data after successful addition/edit
          fetchSeniors();
          fetchOfflineSeniors();
        }}
        mode={modalMode}
        initialData={selectedSenior}
        simulateOffline={simulateOffline}
      />

      {selectedSenior && (
        <>
          <ViewSeniorModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            senior={selectedSenior}
          />

          <DeleteSeniorDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            senior={selectedSenior}
            simulateOffline={simulateOffline}
            onSuccess={() => {
              setIsDeleteDialogOpen(false);
              setSelectedSenior(null);
              // Refresh both online and offline data after successful deletion
              fetchSeniors();
              fetchOfflineSeniors();
            }}
          />
        </>
      )}
    </div>
  );
}
