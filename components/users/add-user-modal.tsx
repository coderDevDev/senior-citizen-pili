'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react';
import { BascaMembersAPI } from '@/lib/api/basca-members';
import { toast } from 'sonner';
import { BarangaySelect } from '@/components/shared-components';
import type { CreateBascaMemberData } from '@/types/basca';

// Zod schema for form validation
const createUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  barangay: z.string().min(1, 'Please select a barangay'),
  barangayCode: z.string().min(1, 'Barangay code is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  position: z.enum([
    'president',
    'vice_president',
    'secretary',
    'treasurer',
    'member',
    'coordinator'
  ]),
  department: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  joinDate: z.string().min(1, 'Join date is required'),
  notes: z.string().optional(),
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z
    .string()
    .min(10, 'Emergency contact phone is required'),
  emergencyContactRelationship: z
    .string()
    .min(1, 'Emergency contact relationship is required')
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Barangay codes mapping for form submission
const getBarangayCode = (barangayName: string): string => {
  const codeMap: { [key: string]: string } = {
    'Anayan': 'AY001',
    'Bagong Sirang': 'BS001',
    'Binanwaanan': 'BW001',
    'Binobong': 'BI001',
    'Cadlan': 'CD001',
    'Caroyroyan': 'CR001',
    'Curry': 'CU001',
    'Del Rosario': 'DR001',
    'Himaao': 'HI001',
    'La Purisima': 'LP001',
    'New San Roque': 'NSR001',
    'Old San Roque (Poblacion)': 'OSR001',
    'Palestina': 'PA001',
    'Pawili': 'PW001',
    'Sagrada': 'SG001',
    'Sagurong': 'SR001',
    'San Agustin': 'SA001',
    'San Antonio (Poblacion)': 'ST001',
    'San Isidro (Poblacion)': 'SI001',
    'San Jose': 'SJ001',
    'San Juan (Poblacion)': 'SN001',
    'San Vicente (Poblacion)': 'SV001',
    'Santiago (Poblacion)': 'SG002',
    'Santo Niño': 'SN002',
    'Tagbong': 'TB001',
    'Tinangis': 'TI001'
  };
  return codeMap[barangayName] || 'UNKNOWN';
};


const positionOptions = [
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice President' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'member', label: 'Member' },
  { value: 'coordinator', label: 'Coordinator' }
];

export function AddUserModal({
  isOpen,
  onClose,
  onSuccess
}: AddUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    phone?: string;
    employeeId?: string;
  }>({});

  // Function to check if email exists
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const result = await BascaMembersAPI.getAllBascaMembers();
      if (result) {
        return result.some(
          (member: any) => member.email.toLowerCase() === email.toLowerCase()
        );
      }
      return false;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  // Function to check if phone exists
  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    try {
      const result = await BascaMembersAPI.getAllBascaMembers();
      if (result) {
        return result.some((member: any) => member.phone === phone);
      }
      return false;
    } catch (error) {
      console.error('Error checking phone:', error);
      return false;
    }
  };

  // Function to check if employee ID exists
  const checkEmployeeIdExists = async (
    employeeId: string
  ): Promise<boolean> => {
    try {
      const result = await BascaMembersAPI.getAllBascaMembers();
      if (result) {
        return result.some((member: any) => member.employeeId === employeeId);
      }
      return false;
    } catch (error) {
      console.error('Error checking employee ID:', error);
      return false;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      barangay: '',
      barangayCode: '',
      address: '',
      position: 'member',
      department: 'OSCA',
      employeeId: '',
      joinDate: new Date().toISOString().split('T')[0],
      notes: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: ''
    }
  });

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // Validate unique fields
      const validationPromises = [];
      const newValidationErrors: typeof validationErrors = {};

      // Check email uniqueness
      if (data.email) {
        validationPromises.push(
          checkEmailExists(data.email).then(exists => {
            if (exists) {
              newValidationErrors.email = 'Email address already exists';
            }
          })
        );
      }

      // Check phone uniqueness
      if (data.phone) {
        validationPromises.push(
          checkPhoneExists(data.phone).then(exists => {
            if (exists) {
              newValidationErrors.phone = 'Phone number already exists';
            }
          })
        );
      }

      // Check employee ID uniqueness (only if provided)
      if (data.employeeId && data.employeeId.trim()) {
        validationPromises.push(
          checkEmployeeIdExists(data.employeeId).then(exists => {
            if (exists) {
              newValidationErrors.employeeId = 'Employee ID already exists';
            }
          })
        );
      }

      // Wait for all validation checks
      await Promise.all(validationPromises);

      // If there are validation errors, stop submission
      if (Object.keys(newValidationErrors).length > 0) {
        setValidationErrors(newValidationErrors);
        setIsSubmitting(false);
        toast.error('❌ Please fix validation errors before submitting');
        return;
      }

      const userData: CreateBascaMemberData = {
        ...data,
        idPhoto:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk9TQ0EgQkFTQ0E8L3RleHQ+Cjx0ZXh0IHg9IjE1MCIgeT0iMjMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1lbWJlcjwvdGV4dD4KPHN2Zz4K'
      };

      const result = await BascaMembersAPI.createBascaMember(userData);

      if (result) {
        toast.success(
          `✅ BASCA member added successfully!\nLogin: ${userData.email}\nPassword: BASCA2025!`,
          { duration: 8000 }
        );
        reset();
        setValidationErrors({});
        onSuccess();
      } else {
        throw new Error('Failed to create BASCA member');
      }
    } catch (error) {
      console.error('Error creating BASCA member:', error);
      toast.error(
        `❌ Failed to add BASCA member: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setValidationErrors({});
    onClose();
  };

  const handleBarangayChange = (barangayName: string) => {
    setValue('barangay', barangayName);
    setValue('barangayCode', getBarangayCode(barangayName));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-[#00af8f]" />
            Add New BASCA Member
          </DialogTitle>
          <DialogDescription>
            Create a new BASCA member account with login credentials. All fields marked with * are
            required. Please provide an email address and the system will set a default password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-[#00af8f]" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-700">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    className="mt-1"
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-700">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    className="mt-1"
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                {/* Email will be auto-generated as firstname.lastname.employeeid@basca.pili.gov.ph */}

                <div>
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    className="mt-1"
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                  {validationErrors.phone && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.phone}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#00af8f]" />
                Location Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <BarangaySelect
                    id="barangay"
                    label="Barangay"
                    value={watch('barangay')}
                    onValueChange={handleBarangayChange}
                    placeholder="Select barangay"
                    required
                    error={errors.barangay?.message}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium text-gray-700">
                    Complete Address *
                  </Label>
                  <Textarea
                    id="address"
                    {...register('address')}
                    className="mt-1"
                    placeholder="Enter complete address"
                    rows={3}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position and Department */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-[#00af8f]" />
                Position & Department
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label
                    htmlFor="position"
                    className="text-sm font-medium text-gray-700">
                    Position *
                  </Label>
                  <Select
                    value={watch('position')}
                    onValueChange={value => setValue('position', value as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions.map(position => (
                        <SelectItem key={position.value} value={position.value}>
                          {position.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.position && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.position.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="department"
                    className="text-sm font-medium text-gray-700">
                    Department
                  </Label>
                  <Input
                    id="department"
                    {...register('department')}
                    className="mt-1"
                    placeholder="Enter department"
                  />
                  {errors.department && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.department.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="employeeId"
                    className="text-sm font-medium text-gray-700">
                    Employee ID
                  </Label>
                  <Input
                    id="employeeId"
                    {...register('employeeId')}
                    className="mt-1"
                    placeholder="Enter employee ID"
                  />
                  {errors.employeeId && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.employeeId.message}
                    </p>
                  )}
                  {validationErrors.employeeId && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.employeeId}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#00af8f]" />
                Additional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="joinDate"
                    className="text-sm font-medium text-gray-700">
                    Join Date *
                  </Label>
                  <Input
                    id="joinDate"
                    type="date"
                    {...register('joinDate')}
                    className="mt-1"
                  />
                  {errors.joinDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.joinDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="notes"
                    className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    className="mt-1"
                    placeholder="Enter any additional notes"
                    rows={3}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.notes.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-[#00af8f]" />
                Emergency Contact (Optional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label
                    htmlFor="emergencyContactName"
                    className="text-sm font-medium text-gray-700">
                    Contact Name
                  </Label>
                  <Input
                    id="emergencyContactName"
                    {...register('emergencyContactName')}
                    className="mt-1"
                    placeholder="Enter emergency contact name"
                  />
                  {errors.emergencyContactName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.emergencyContactName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="emergencyContactPhone"
                    className="text-sm font-medium text-gray-700">
                    Contact Phone
                  </Label>
                  <Input
                    id="emergencyContactPhone"
                    {...register('emergencyContactPhone')}
                    className="mt-1"
                    placeholder="Enter emergency contact phone"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.emergencyContactPhone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="emergencyContactRelationship"
                    className="text-sm font-medium text-gray-700">
                    Relationship
                  </Label>
                  <Input
                    id="emergencyContactRelationship"
                    {...register('emergencyContactRelationship')}
                    className="mt-1"
                    placeholder="Enter relationship"
                  />
                  {errors.emergencyContactRelationship && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.emergencyContactRelationship.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-[#00af8f]" />
                Account Information
              </h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Login Credentials</p>
                    <p className="text-sm text-blue-700 mt-1">
                      These credentials will be created for the BASCA member to access the system.
                      Please provide a valid email address.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="mt-1"
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                  {validationErrors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Default Password
                  </Label>
                  <Input
                    value="BASCA2025!"
                    className="mt-1 bg-gray-50"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Member can change this password after first login
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
                  Adding Member...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add BASCA Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
