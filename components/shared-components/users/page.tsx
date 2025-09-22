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
  Shield,
  Activity,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { BascaMembersAPI } from '@/lib/api/basca-members';
import {
  AddUserModal,
  EditUserModal,
  ViewUserModal,
  DeleteUserDialog
} from '@/components/users';
import { BarangayFilter } from '@/components/shared-components';
import type { BascaMember } from '@/types/basca';

interface SharedUsersPageProps {
  role?: 'osca' | 'basca';
  primaryColor?: string;
  userBarangay?: string;
  title?: string;
  description?: string;
}

export default function SharedUsersPage({
  role = 'osca',
  primaryColor = '#00af8f',
  userBarangay,
  title = 'BASCA Accounts',
  description = 'Manage BASCA member accounts and permissions'
}: SharedUsersPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [barangayFilter, setBarangayFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BascaMember | null>(null);
  const [users, setUsers] = useState<BascaMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch BASCA users data from the database
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await BascaMembersAPI.getAllBascaMembers(
        role === 'basca' && userBarangay
          ? userBarangay
          : barangayFilter !== 'all'
          ? barangayFilter
          : undefined
      );
      console.log({ result });
      if (result) {
        setUsers(result);
        setIsLoading(false);
      } else {
        throw new Error('Failed to fetch BASCA users data');
      }
    } catch (error) {
      console.error('Error fetching BASCA users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Export functions
  const exportUsersToPDF = async () => {
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
      pdf.text('BASCA Members Report', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        30,
        { align: 'center' }
      );

      // Table headers
      const headers = ['Name', 'Email', 'Barangay', 'Position', 'Status'];
      const colWidths = [50, 50, 30, 25, 25];
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
      filteredUsers.forEach(user => {
        if (y > 250) {
          pdf.addPage();
          y = 30;
        }

        const rowData = [
          `${user.firstName} ${user.lastName}`,
          user.email,
          user.barangay,
          user.position,
          user.isActive ? 'Active' : 'Inactive'
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
        `basca-members-report-${new Date().toISOString().split('T')[0]}.pdf`
      );
      toast.success('✅ PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('❌ Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportUsersToExcel = () => {
    try {
      setIsExporting(true);
      const data = filteredUsers.map(user => ({
        Name: `${user.firstName} ${user.lastName}`,
        Email: user.email,
        Phone: user.phone || '',
        Barangay: user.barangay,
        Position: user.position,
        Department: user.department || '',
        'Employee ID': user.employeeId || '',
        Status: user.isActive ? 'Active' : 'Inactive',
        'Join Date': user.joinDate
          ? new Date(user.joinDate).toLocaleDateString()
          : '',
        'Emergency Contact': user.emergencyContactName || '',
        'Emergency Phone': user.emergencyContactPhone || '',
        'Emergency Relationship': user.emergencyContactRelationship || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BASCA Members');
      XLSX.writeFile(
        wb,
        `basca-members-report-${new Date().toISOString().split('T')[0]}.xlsx`
      );
      toast.success('✅ Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('❌ Failed to export Excel file');
    } finally {
      setIsExporting(false);
    }
  };

  const exportUsersToJSON = () => {
    try {
      const data = {
        title: 'BASCA Members Report',
        generatedAt: new Date().toISOString(),
        filters: {
          barangay:
            role === 'basca' && userBarangay ? userBarangay : barangayFilter
        },
        users: filteredUsers.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          barangay: user.barangay,
          position: user.position,
          status: user.isActive ? 'Active' : 'Inactive',
          employeeId: user.employeeId,
          emergencyContact: user.emergencyContactName,
          createdAt: user.created_at
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `basca-members-report-${
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

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [barangayFilter]);

  // All data now comes from the database via BascaMembersAPI

  // Stats calculation
  const stats = [
    {
      title: 'Total BASCA Members',
      value: users.length.toString(),
      change: 'All registered members',
      icon: Users,
      color: primaryColor,
      textColor: primaryColor
    },
    {
      title: 'Active Members',
      value: users.filter(u => u.isActive).length.toString(),
      change: 'Currently active',
      icon: CheckCircle,
      color: '#10b981', // green-500
      textColor: '#10b981'
    },
    {
      title: 'Inactive Members',
      value: users.filter(u => !u.isActive).length.toString(),
      change: 'Require attention',
      icon: AlertTriangle,
      color: '#f97316', // orange-500
      textColor: '#f97316'
    },
    {
      title: 'Recent Additions',
      value: users
        .filter(u => {
          if (!u.created_at) return false;
          const created = new Date(u.created_at);
          const now = new Date();
          const daysAgo = Math.ceil(
            (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysAgo <= 30;
        })
        .length.toString(),
      change: 'Added this month',
      icon: UserPlus,
      color: '#8b5cf6', // violet-500
      textColor: '#8b5cf6'
    }
  ];

  // Event handlers
  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  const handleEditUser = (user: BascaMember) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleViewUser = (user: BascaMember) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleDeleteUser = (user: BascaMember) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleExportData = () => {
    // Export functionality
    console.log('Exporting BASCA users data...');
    toast.success('Export functionality will be implemented');
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      searchQuery === '' ||
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    const matchesBarangay =
      barangayFilter === 'all' || user.barangay === barangayFilter;

    const matchesPosition =
      positionFilter === 'all' || user.position === positionFilter;

    return matchesSearch && matchesStatus && matchesBarangay && matchesPosition;
  });

  // Get unique barangays and positions for filter dropdowns
  const uniqueBarangays = Array.from(
    new Set(users.map(u => u.barangay))
  ).sort();

  const uniquePositions = Array.from(
    new Set(users.map(u => u.position))
  ).sort();

  // Get position display name
  const getPositionDisplayName = (position: string) => {
    const positionNames: { [key: string]: string } = {
      president: 'President',
      vice_president: 'Vice President',
      secretary: 'Secretary',
      treasurer: 'Treasurer',
      member: 'Member',
      coordinator: 'Coordinator'
    };
    return positionNames[position] || position;
  };

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
                ({filteredUsers.length} records)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
                onClick={exportUsersToPDF}
                disabled={isExporting}
                className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                Export as PDF
              </DropdownMenuItem> */}
              <DropdownMenuItem
                onClick={exportUsersToExcel}
                disabled={isExporting}
                className="cursor-pointer">
                <BarChart3 className="w-4 h-4 mr-2 text-green-500" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportUsersToJSON}
                disabled={isExporting}
                className="cursor-pointer">
                <Download className="w-4 h-4 mr-2 text-blue-500" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleAddUser}
            className="text-white shadow-lg hover:shadow-xl transition-all duration-200"
            style={
              {
                backgroundColor: primaryColor,
                '--tw-ring-color': `${primaryColor}40`
              } as React.CSSProperties & { [key: string]: string }
            }>
            <Plus className="w-4 h-4 mr-2" />
            Add BASCA Member
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
                  placeholder="Search by name, email, employee ID, address, or barangay..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-white transition-all duration-200 placeholder:text-[#999999] hover:border-[#00af8f]/50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              {/* <div className="relative">
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
                  </SelectContent>
                </Select>
              </div> */}
              <BarangayFilter
                value={barangayFilter}
                onValueChange={setBarangayFilter}
                placeholder="Filter by Barangay"
                iconType="mappin"
              />
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] w-4 h-4 z-10" />
                <Select
                  value={positionFilter}
                  onValueChange={setPositionFilter}>
                  <SelectTrigger className="w-44 h-14 pl-10 border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-white">
                    <SelectValue placeholder="Filter by Position" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-[#E0DDD8] shadow-lg">
                    <SelectItem
                      value="all"
                      className="rounded-lg hover:bg-[#00af8f]/5">
                      All Positions
                    </SelectItem>
                    {uniquePositions.map(position => (
                      <SelectItem
                        key={position}
                        value={position}
                        className="rounded-lg hover:bg-[#00af8f]/5">
                        {getPositionDisplayName(position)}
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
                Found {filteredUsers.length} result
                {filteredUsers.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BASCA Users Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 border-b border-[#E0DDD8]/30">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00af8f]/10 rounded-xl">
                <Users className="w-6 h-6 text-[#00af8f]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#333333]">
                  BASCA Members Database
                </h3>
                <p className="text-sm text-[#666666] mt-1">
                  {isLoading ? (
                    <span className="animate-pulse">Loading records...</span>
                  ) : (
                    `${filteredUsers.length} of ${users.length} records displayed`
                  )}
                </p>
              </div>
            </div>
            {!isLoading && users.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-[#00af8f]/10 text-[#00af8f] px-3 py-1">
                {filteredUsers.length} Records
              </Badge>
            )}
          </CardTitle>
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
                onClick={fetchUsers}
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
                Loading BASCA Members
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
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-[#00af8f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {users.length === 0 ? (
                  <UserPlus className="w-8 h-8 text-[#00af8f]" />
                ) : (
                  <Search className="w-8 h-8 text-[#00af8f]" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-[#333333] mb-2">
                {users.length === 0
                  ? 'No BASCA Members Yet'
                  : 'No Results Found'}
              </h3>
              <p className="text-[#666666] mb-4">
                {users.length === 0
                  ? 'Start by adding your first BASCA member to the database.'
                  : searchQuery
                  ? `No BASCA members match "${searchQuery}". Try adjusting your search terms.`
                  : 'No BASCA members match the selected filters. Try changing your filter options.'}
              </p>
              {users.length === 0 ? (
                <Button
                  onClick={handleAddUser}
                  className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First BASCA Member
                </Button>
              ) : (
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setBarangayFilter('all');
                      setPositionFilter('all');
                    }}
                    className="border-[#00af8f] text-[#00af8f] hover:bg-[#00af8f]/5">
                    Clear Filters
                  </Button>
                  <Button
                    onClick={handleAddUser}
                    className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add BASCA Member
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-[#333333]">
                        Member
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#333333]">
                        Position
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#333333]">
                        Barangay
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#333333]">
                        Contact
                      </th>
                      {/* <th className="text-left py-3 px-4 font-semibold text-[#333333]">
                        Status
                      </th> */}
                      <th className="text-left py-3 px-4 font-semibold text-[#333333]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#00af8f] to-[#00af90] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-[#333333]">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-[#666666]">
                                {user.employeeId || 'No ID'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {getPositionDisplayName(user.position)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#666666]" />
                            <span className="text-sm text-[#666666]">
                              {user.barangay}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-[#666666]" />
                              <span className="text-xs text-[#666666]">
                                {user.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-[#666666]" />
                              <span className="text-xs text-[#666666]">
                                {user.phone}
                              </span>
                            </div>
                          </div>
                        </td>
                        {/* <td className="py-4 px-4">
                          <Badge
                            className={
                              user.isActive
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td> */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#00af8f] hover:text-[#00af90] hover:bg-[#00af8f]/5 h-8 w-8 p-0"
                              onClick={() => handleViewUser(user)}
                              title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 h-8 w-8 p-0"
                              onClick={() => handleEditUser(user)}
                              title="Edit Member">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              onClick={() => handleDeleteUser(user)}
                              title="Delete Member">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals and Dialogs */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          // Refresh data after successful addition
          fetchUsers();
        }}
      />

      {selectedUser && (
        <>
          <EditUserModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={selectedUser}
            onSuccess={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
              // Refresh data after successful edit
              fetchUsers();
            }}
          />

          <ViewUserModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            user={selectedUser}
            onEdit={() => {
              setIsViewModalOpen(false);
              setIsEditModalOpen(true);
            }}
          />

          <DeleteUserDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            user={selectedUser}
            onSuccess={() => {
              setIsDeleteDialogOpen(false);
              setSelectedUser(null);
              // Refresh data after successful deletion
              fetchUsers();
            }}
          />
        </>
      )}
    </div>
  );
}
