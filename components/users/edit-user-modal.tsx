'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Edit,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  FileText,
  AlertCircle,
  Activity
} from 'lucide-react';
import { BascaMembersAPI } from '@/lib/api/basca-members';
import { toast } from 'sonner';
import type { BascaMember, UpdateBascaMemberData } from '@/types/basca';

// Zod schema for form validation
const editUserSchema = z.object({
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
  employeeId: z.string().optional(),
  isActive: z.boolean(),
  notes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  lastTrainingDate: z.string().optional(),
  nextTrainingDate: z.string().optional(),
  attendanceRate: z.number().min(0).max(100).optional(),
  totalMeetingsAttended: z.number().min(0).optional(),
  totalMeetingsConducted: z.number().min(0).optional()
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: BascaMember | null;
  onSuccess: () => void;
}

// All barangays in Pili, Camarines Sur
const piliBarangays = [
  { id: 'bagong-sirang', name: 'Bagong Sirang', code: 'BS001' },
  { id: 'barangay-1', name: 'Barangay 1 (Poblacion)', code: 'BG001' },
  { id: 'barangay-2', name: 'Barangay 2 (Poblacion)', code: 'BG002' },
  { id: 'barangay-3', name: 'Barangay 3 (Poblacion)', code: 'BG003' },
  { id: 'barangay-4', name: 'Barangay 4 (Poblacion)', code: 'BG004' },
  { id: 'barangay-5', name: 'Barangay 5 (Poblacion)', code: 'BG005' },
  { id: 'barangay-6', name: 'Barangay 6 (Poblacion)', code: 'BG006' },
  { id: 'barangay-7', name: 'Barangay 7 (Poblacion)', code: 'BG007' },
  { id: 'barangay-8', name: 'Barangay 8 (Poblacion)', code: 'BG008' },
  { id: 'anayan', name: 'Anayan', code: 'AY001' },
  { id: 'bagacay', name: 'Bagacay', code: 'BY001' },
  { id: 'banga', name: 'Banga', code: 'BA001' },
  { id: 'binanuahan', name: 'Binanuahan', code: 'BN001' },
  { id: 'bolo', name: 'Bolo', code: 'BL001' },
  { id: 'buenavista', name: 'Buenavista', code: 'BV001' },
  { id: 'cadlan', name: 'Cadlan', code: 'CD001' },
  { id: 'caima-gimaga', name: 'Caima Gimaga', code: 'CG001' },
  { id: 'cale', name: 'Cale', code: 'CL001' },
  { id: 'curry', name: 'Curry', code: 'CR001' },
  { id: 'dita', name: 'Dita', code: 'DT001' },
  { id: 'kyamko', name: 'Kyamko', code: 'KY001' },
  {
    id: 'moises-r-espinosa',
    name: 'Moises R. Espinosa (Pinit)',
    code: 'MR001'
  },
  { id: 'palestina', name: 'Palestina', code: 'PL001' },
  { id: 'pawili', name: 'Pawili', code: 'PW001' },
  { id: 'sagrada-familia', name: 'Sagrada Familia', code: 'SF001' },
  { id: 'san-antonio', name: 'San Antonio', code: 'SA001' },
  { id: 'san-isidro', name: 'San Isidro', code: 'SI001' },
  { id: 'san-jose', name: 'San Jose', code: 'SJ001' },
  { id: 'san-juan', name: 'San Juan', code: 'SJ002' },
  { id: 'san-rafael-a', name: 'San Rafael A', code: 'SR001' },
  { id: 'san-rafael-b', name: 'San Rafael B', code: 'SR002' },
  { id: 'san-roque', name: 'San Roque', code: 'SQ001' },
  { id: 'san-vicente', name: 'San Vicente', code: 'SV001' },
  { id: 'santa-cruz-norte', name: 'Santa Cruz Norte', code: 'SC001' },
  { id: 'santa-cruz-sur', name: 'Santa Cruz Sur', code: 'SC002' },
  { id: 'santo-niño', name: 'Santo Niño', code: 'SN001' },
  { id: 'himaao', name: 'Himaao', code: 'HM001' }
];

const positionOptions = [
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice President' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'member', label: 'Member' },
  { value: 'coordinator', label: 'Coordinator' }
];

export function EditUserModal({
  isOpen,
  onClose,
  user,
  onSuccess
}: EditUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      barangay: '',
      barangayCode: '',
      address: '',
      position: 'member',
      department: '',
      employeeId: '',
      isActive: true,
      notes: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      lastTrainingDate: '',
      nextTrainingDate: '',
      attendanceRate: 0,
      totalMeetingsAttended: 0,
      totalMeetingsConducted: 0
    }
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        barangay: user.barangay,
        barangayCode: user.barangayCode,
        address: user.address,
        position: user.position,
        department: user.department || '',
        employeeId: user.employeeId || '',
        isActive: user.isActive,
        notes: user.notes || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        emergencyContactRelationship: user.emergencyContactRelationship || '',
        lastTrainingDate: user.lastTrainingDate
          ? user.lastTrainingDate.split('T')[0]
          : '',
        nextTrainingDate: user.nextTrainingDate
          ? user.nextTrainingDate.split('T')[0]
          : '',
        attendanceRate: user.attendanceRate || 0,
        totalMeetingsAttended: user.totalMeetingsAttended || 0,
        totalMeetingsConducted: user.totalMeetingsConducted || 0
      });

      // Find and set the selected barangay
      const barangay = piliBarangays.find(b => b.name === user.barangay);
      if (barangay) {
        setSelectedBarangay(barangay.id);
      }
    }
  }, [user, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateBascaMemberData = {
        id: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        barangay: data.barangay,
        barangayCode: data.barangayCode,
        address: data.address,
        position: data.position,
        department: data.department,
        employeeId: data.employeeId,
        isActive: data.isActive,
        notes: data.notes,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelationship: data.emergencyContactRelationship,
        lastTrainingDate: data.lastTrainingDate,
        nextTrainingDate: data.nextTrainingDate,
        attendanceRate: data.attendanceRate,
        totalMeetingsAttended: data.totalMeetingsAttended,
        totalMeetingsConducted: data.totalMeetingsConducted
      };

      const result = await BascaMembersAPI.updateBascaMember(updateData);

      if (result) {
        toast.success('✅ BASCA member updated successfully');
        onSuccess();
      } else {
        throw new Error('Failed to update BASCA member');
      }
    } catch (error) {
      console.error('Error updating BASCA member:', error);
      toast.error(
        `❌ Failed to update BASCA member: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedBarangay('');
    onClose();
  };

  const handleBarangayChange = (barangayId: string) => {
    setSelectedBarangay(barangayId);
    const barangay = piliBarangays.find(b => b.id === barangayId);
    if (barangay) {
      setValue('barangay', barangay.name);
      setValue('barangayCode', barangay.code);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <Edit className="w-5 h-5 mr-2 text-[#00af8f]" />
            Edit BASCA Member
          </DialogTitle>
          <DialogDescription>
            Update information for {user.firstName} {user.lastName}
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
                </div>

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
                  <Label
                    htmlFor="barangay"
                    className="text-sm font-medium text-gray-700">
                    Barangay *
                  </Label>
                  <Select
                    value={selectedBarangay}
                    onValueChange={handleBarangayChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select barangay" />
                    </SelectTrigger>
                    <SelectContent>
                      {piliBarangays.map(barangay => (
                        <SelectItem key={barangay.id} value={barangay.id}>
                          {barangay.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.barangay && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.barangay.message}
                    </p>
                  )}
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
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={watch('isActive')}
                    onCheckedChange={checked =>
                      setValue('isActive', checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="isActive"
                    className="text-sm font-medium text-gray-700">
                    Active Member
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-[#00af8f]" />
                Performance Metrics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label
                    htmlFor="attendanceRate"
                    className="text-sm font-medium text-gray-700">
                    Attendance Rate (%)
                  </Label>
                  <Input
                    id="attendanceRate"
                    type="number"
                    min="0"
                    max="100"
                    {...register('attendanceRate', { valueAsNumber: true })}
                    className="mt-1"
                    placeholder="0"
                  />
                  {errors.attendanceRate && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.attendanceRate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="totalMeetingsAttended"
                    className="text-sm font-medium text-gray-700">
                    Meetings Attended
                  </Label>
                  <Input
                    id="totalMeetingsAttended"
                    type="number"
                    min="0"
                    {...register('totalMeetingsAttended', {
                      valueAsNumber: true
                    })}
                    className="mt-1"
                    placeholder="0"
                  />
                  {errors.totalMeetingsAttended && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.totalMeetingsAttended.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="totalMeetingsConducted"
                    className="text-sm font-medium text-gray-700">
                    Meetings Conducted
                  </Label>
                  <Input
                    id="totalMeetingsConducted"
                    type="number"
                    min="0"
                    {...register('totalMeetingsConducted', {
                      valueAsNumber: true
                    })}
                    className="mt-1"
                    placeholder="0"
                  />
                  {errors.totalMeetingsConducted && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.totalMeetingsConducted.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#00af8f]" />
                Training Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="lastTrainingDate"
                    className="text-sm font-medium text-gray-700">
                    Last Training Date
                  </Label>
                  <Input
                    id="lastTrainingDate"
                    type="date"
                    {...register('lastTrainingDate')}
                    className="mt-1"
                  />
                  {errors.lastTrainingDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.lastTrainingDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="nextTrainingDate"
                    className="text-sm font-medium text-gray-700">
                    Next Training Date
                  </Label>
                  <Input
                    id="nextTrainingDate"
                    type="date"
                    {...register('nextTrainingDate')}
                    className="mt-1"
                  />
                  {errors.nextTrainingDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.nextTrainingDate.message}
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
                <FileText className="w-5 h-5 mr-2 text-[#00af8f]" />
                Additional Information
              </h3>

              <div className="space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label
                      htmlFor="emergencyContactName"
                      className="text-sm font-medium text-gray-700">
                      Emergency Contact Name
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
                      Emergency Contact Phone
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
                  Updating Member...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update BASCA Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
