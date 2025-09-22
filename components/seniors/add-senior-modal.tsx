'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  PhilippineAddressSelector,
  AddressData
} from '@/components/ui/philippine-address-selector';
import { BarangaySelect } from '@/components/shared-components';
import {
  MultiStepForm,
  Step,
  PersonalInfoStep,
  AddressStep,
  ContactStep,
  EmergencyContactStep,
  MedicalStep,
  LivingConditionsStep,
  BeneficiariesStep
} from './multi-step-form';
import {
  X,
  Plus,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  AlertTriangle,
  Home,
  Users,
  Key
} from 'lucide-react';
import type { SeniorCitizen } from '@/types/property';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const beneficiarySchema = z.object({
  name: z.string().min(2, 'Beneficiary name must be at least 2 characters'),
  relationship: z.string().min(2, 'Relationship is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  occupation: z.string().optional(),
  monthlyIncome: z
    .number()
    .min(0, 'Monthly income must be 0 or greater')
    .optional(),
  isDependent: z.boolean().default(false)
});

const addSeniorSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    dateOfBirth: z
      .string()
      .min(1, 'Date of birth is required')
      .refine(date => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        let calculatedAge = age;
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          calculatedAge--;
        }

        return calculatedAge >= 60;
      }, 'Senior citizen must be at least 60 years old'),
    gender: z.enum(['male', 'female', 'other']),
    barangay: z.string().min(1, 'Barangay is required'),
    barangayCode: z.string().min(1, 'Barangay code is required'),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    addressData: z
      .object({
        region: z
          .object({
            region_code: z.string(),
            region_name: z.string()
          })
          .optional(),
        province: z
          .object({
            province_code: z.string(),
            province_name: z.string()
          })
          .optional(),
        city: z
          .object({
            city_code: z.string(),
            city_name: z.string()
          })
          .optional(),
        barangay: z
          .object({
            brgy_code: z.string(),
            brgy_name: z.string()
          })
          .optional()
      })
      .optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
    contactRelationship: z.string().optional(),
    emergencyContactName: z
      .string()
      .min(2, 'Emergency contact name is required'),
    emergencyContactPhone: z
      .string()
      .min(10, 'Emergency contact phone is required'),
    emergencyContactRelationship: z
      .string()
      .min(2, 'Emergency contact relationship is required'),
    medicalConditions: z.array(z.string()).default([]),
    medications: z.array(z.string()).default([]),
    seniorIdPhoto: z.string().optional(),
    profilePicture: z.string().optional(),
    // New fields
    housingCondition: z.enum([
      'owned',
      'rented',
      'with_family',
      'institution',
      'other'
    ]),
    physicalHealthCondition: z.enum([
      'excellent',
      'good',
      'fair',
      'poor',
      'critical'
    ]),
    monthlyIncome: z.number().min(0, 'Monthly income must be 0 or greater'),
    monthlyPension: z.number().min(0, 'Monthly pension must be 0 or greater'),
    livingCondition: z.enum([
      'independent',
      'with_family',
      'with_caregiver',
      'institution',
      'other'
    ]),
    beneficiaries: z.array(beneficiarySchema).default([]),
    notes: z.string().optional(),
    // Login credentials
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    // .refine(
    //   password => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password),
    //   'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    // ),
    confirmPassword: z.string().min(6, 'Please confirm your password')
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

type AddSeniorFormData = z.infer<typeof addSeniorSchema>;

interface AddSeniorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSeniorModal({
  isOpen,
  onClose,
  onSuccess
}: AddSeniorModalProps) {
  const { authState } = useAuth();
  const { user } = authState;
  const role = user?.role;
  const userBarangay = user?.barangay;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [addressData, setAddressData] = useState<AddressData>({});
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger
  } = useForm<AddSeniorFormData>({
    resolver: zodResolver(addSeniorSchema),
    defaultValues: {
      gender: 'other',
      medicalConditions: [],
      medications: [],
      housingCondition: 'owned',
      physicalHealthCondition: 'good',
      monthlyIncome: 0,
      monthlyPension: 0,
      livingCondition: 'independent',
      beneficiaries: [],
      password: 'SENIOR2025!',
      confirmPassword: 'SENIOR2025!'
    }
  });

  // Auto-select barangay for BASCA users
  useEffect(() => {
    if (role === 'basca' && userBarangay && isOpen) {
      setValue('barangay', userBarangay);
      // Auto-generate barangay code
      const barangayCode = userBarangay.toLowerCase().replace(/\s+/g, '_');
      setValue('barangayCode', barangayCode);
      
      // Update addressData for consistency
      setAddressData({
        region: {
          region_code: '05',
          region_name: 'Region V - Bicol'
        },
        province: {
          province_code: '0517',
          province_name: 'Camarines Sur'
        },
        city: {
          city_code: '051724',
          city_name: 'Pili'
        },
        barangay: {
          brgy_code: barangayCode,
          brgy_name: userBarangay
        }
      });
    }
  }, [role, userBarangay, isOpen, setValue]);

  // Calculate age when date of birth changes
  const watchDateOfBirth = watch('dateOfBirth');

  useEffect(() => {
    if (watchDateOfBirth) {
      const birthDate = new Date(watchDateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [watchDateOfBirth]);

  // Define steps
  const steps: Step[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic personal details',
      icon: User,
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'address',
      title: 'Address Information',
      description: 'Location and address details',
      icon: MapPin,
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'contact',
      title: 'Contact Information',
      description: 'Primary contact details',
      icon: Phone,
      isCompleted: false,
      isRequired: false
    },
    {
      id: 'emergency',
      title: 'Emergency Contact',
      description: 'Emergency contact information',
      icon: AlertTriangle,
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'medical',
      title: 'Medical Information',
      description: 'Health conditions and medications',
      icon: FileText,
      isCompleted: false,
      isRequired: false
    },
    {
      id: 'living',
      title: 'Living Conditions',
      description: 'Housing and income information',
      icon: Home,
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'beneficiaries',
      title: 'Beneficiaries',
      description: 'Family members and dependents',
      icon: Users,
      isCompleted: false,
      isRequired: false
    },
    {
      id: 'credentials',
      title: 'Login Credentials',
      description: 'Email and password setup',
      icon: Key,
      isCompleted: false,
      isRequired: true
    }
  ];

  // Validation functions for each step
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 0: // Personal Information
        return await trigger([
          'firstName',
          'lastName',
          'dateOfBirth',
          'gender'
        ]);
      case 1: // Address Information
        return await trigger(['barangay', 'barangayCode', 'address']);
      case 2: // Contact Information
        return true; // Optional step
      case 3: // Emergency Contact
        return await trigger([
          'emergencyContactName',
          'emergencyContactPhone',
          'emergencyContactRelationship'
        ]);
      case 4: // Medical Information
        return true; // Optional step
      case 5: // Living Conditions
        return await trigger([
          'housingCondition',
          'physicalHealthCondition',
          'monthlyIncome',
          'monthlyPension',
          'livingCondition'
        ]);
      case 6: // Beneficiaries
        return true; // Optional step
      case 7: // Credentials
        return await trigger(['email', 'password', 'confirmPassword']);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const onSubmit = async (data: AddSeniorFormData) => {
    setIsLoading(true);

    try {
      // Import the API
      const { SeniorCitizensAPI } = await import('@/lib/api/senior-citizens');

      // Prepare the data for the API
      const apiData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        barangay: data.barangay,
        barangayCode: data.barangayCode,
        address: data.address,
        addressData,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        contactRelationship: data.contactRelationship,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelationship: data.emergencyContactRelationship,
        medicalConditions,
        medications,
        notes: data.notes,
        housingCondition: data.housingCondition,
        physicalHealthCondition: data.physicalHealthCondition,
        monthlyIncome: data.monthlyIncome,
        monthlyPension: data.monthlyPension,
        livingCondition: data.livingCondition,
        profilePicture,
        seniorIdPhoto: data.seniorIdPhoto,
        beneficiaries,
        // Login credentials
        email: data.email,
        password: data.password
      };

      console.log('Adding senior citizen:', apiData);

      const result = await SeniorCitizensAPI.createSeniorCitizen(apiData);

      if (result.success) {
        console.log('Senior citizen created successfully:', result.data);

        // Reset form and close modal
        reset();
        setMedicalConditions([]);
        setMedications([]);
        setBeneficiaries([]);
        setAddressData({});
        setProfilePicture('');
        setNewCondition('');
        setNewMedication('');
        setCurrentStep(0);
        onSuccess();

        // Show success message with proper styling
        toast.success('Senior citizen registered successfully!', {
          style: {
            background: '#10B981',
            color: '#FFFFFF',
            border: '1px solid #059669'
          },
          duration: 4000
        });
      } else {
        throw new Error('Failed to create senior citizen');
      }
    } catch (error) {
      console.error('Error adding senior citizen:', error);
      toast.error('Failed to add senior citizen', {
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
          border: '1px solid #DC2626'
        },
        duration: 4000
      });
      // alert(
      //   `Error: ${
      //     error instanceof Error
      //       ? error.message
      //       : 'Failed to add senior citizen'
      //   }`
      // );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCondition = () => {
    if (
      newCondition.trim() &&
      !medicalConditions.includes(newCondition.trim())
    ) {
      setMedicalConditions([...medicalConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (condition: string) => {
    setMedicalConditions(medicalConditions.filter(c => c !== condition));
  };

  const handleAddMedication = () => {
    if (newMedication.trim() && !medications.includes(newMedication.trim())) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const handleRemoveMedication = (medication: string) => {
    setMedications(medications.filter(m => m !== medication));
  };

  const handleClose = () => {
    reset();
    setMedicalConditions([]);
    setMedications([]);
    setBeneficiaries([]);
    setAddressData({});
    setProfilePicture('');
    setNewCondition('');
    setNewMedication('');
    setCurrentStep(0);
    onClose();
  };

  // Check if current step can proceed
  const canProceed = (): boolean => {
    const formValues = watch();
    switch (currentStep) {
      case 0: // Personal Information
        return !!(
          formValues.firstName &&
          formValues.lastName &&
          formValues.dateOfBirth &&
          formValues.gender
        );
      case 1: // Address Information
        return !!(
          formValues.barangay &&
          formValues.barangayCode &&
          formValues.address
        );
      case 2: // Contact Information
        return true; // Optional
      case 3: // Emergency Contact
        return !!(
          formValues.emergencyContactName &&
          formValues.emergencyContactPhone &&
          formValues.emergencyContactRelationship
        );
      case 4: // Medical Information
        return true; // Optional
      case 5: // Living Conditions
        return !!(
          formValues.housingCondition &&
          formValues.physicalHealthCondition &&
          formValues.monthlyIncome !== undefined &&
          formValues.monthlyPension !== undefined &&
          formValues.livingCondition
        );
      case 6: // Beneficiaries
        return true; // Optional
      case 7: // Credentials
        return !!(
          formValues.email &&
          formValues.password &&
          formValues.confirmPassword &&
          formValues.password === formValues.confirmPassword
        );
      default:
        return true;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Information
        return (
          <PersonalInfoStep>
            <div className="space-y-6 sm:space-y-8">
              {/* Basic Information */}
              <div className="bg-gradient-to-br from-[#feffff] to-[#ffffff] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-[#E0DDD8]/50">
                <h4 className="text-base sm:text-lg font-semibold text-[#333333] mb-4 sm:mb-6 flex items-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#00af8f] mr-2 flex-shrink-0" />
                  Basic Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* First Name */}
                  <div className="group">
                    <Label
                      htmlFor="firstName"
                      className="text-[#333333] font-semibold text-xs sm:text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        placeholder="Enter first name"
                        className="h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 placeholder:text-[#999999] hover:border-[#00af8f]/50"
                        {...register('firstName')}
                      />
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                    </div>
                    {errors.firstName && (
                      <p className="text-red-500 text-xs sm:text-sm mt-2 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="group">
                    <Label
                      htmlFor="lastName"
                      className="text-[#333333] font-semibold text-xs sm:text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="lastName"
                        placeholder="Enter last name"
                        className="h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 placeholder:text-[#999999] hover:border-[#00af8f]/50"
                        {...register('lastName')}
                      />
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                    </div>
                    {errors.lastName && (
                      <p className="text-red-500 text-xs sm:text-sm mt-2 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="group">
                    <Label
                      htmlFor="dateOfBirth"
                      className="text-[#333333] font-semibold text-xs sm:text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                      Date of Birth <span className="text-red-500">*</span>
                      {calculatedAge !== null && (
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            calculatedAge >= 60
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                          Age: {calculatedAge} years old
                        </span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="dateOfBirth"
                        type="date"
                        className="h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50"
                        {...register('dateOfBirth')}
                      />
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-red-500 text-xs sm:text-sm mt-2 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.dateOfBirth.message}
                      </p>
                    )}
                    {calculatedAge !== null && calculatedAge < 60 && (
                      <p className="text-amber-600 text-xs sm:text-sm mt-2 flex items-center">
                        <span className="w-1 h-1 bg-amber-600 rounded-full mr-2"></span>
                        Person must be at least 60 years old to register as a
                        senior citizen
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="group">
                    <Label
                      htmlFor="gender"
                      className="text-[#333333] font-semibold text-xs sm:text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Select
                        onValueChange={value =>
                          setValue(
                            'gender',
                            value as 'male' | 'female' | 'other'
                          )
                        }>
                        <SelectTrigger className="h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50">
                          <SelectValue
                            placeholder="Select gender"
                            className="text-[#999999]"
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 border-[#E0DDD8] shadow-lg">
                          <SelectItem
                            value="male"
                            className="rounded-lg hover:bg-[#00af8f]/5">
                            Male
                          </SelectItem>
                          <SelectItem
                            value="female"
                            className="rounded-lg hover:bg-[#00af8f]/5">
                            Female
                          </SelectItem>
                          <SelectItem
                            value="other"
                            className="rounded-lg hover:bg-[#00af8f]/5">
                            Other
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                    </div>
                    {errors.gender && (
                      <p className="text-red-500 text-xs sm:text-sm mt-2 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.gender.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo and ID Upload */}
              <div className="bg-gradient-to-br from-[#feffff] to-[#ffffff] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-[#E0DDD8]/50">
                <h4 className="text-base sm:text-lg font-semibold text-[#333333] mb-4 sm:mb-6 flex items-center">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#00af8f] mr-2 flex-shrink-0" />
                  Photos & Identification
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  {/* Profile Picture Upload */}
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-[#333333] font-semibold text-xs sm:text-sm">
                      Profile Picture
                    </Label>
                    <div className="border-2 border-dashed border-[#E0DDD8] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:border-[#00af8f]/50 transition-all duration-200">
                      {profilePicture ? (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                            <img
                              src={profilePicture}
                              alt="Profile preview"
                              className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 p-0 bg-red-500 text-white border-red-500 hover:bg-red-600 rounded-full"
                              onClick={() => {
                                setProfilePicture('');
                                setValue('profilePicture', '');
                              }}>
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-[#00af8f] text-[#00af8f] hover:bg-[#00af8f]/5 h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = e => {
                                const file = (e.target as HTMLInputElement)
                                  .files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = e => {
                                    const result = e.target?.result as string;
                                    setProfilePicture(result);
                                    setValue('profilePicture', result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              };
                              input.click();
                            }}>
                            Change Photo
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#00af8f]/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
                            <User className="w-6 h-6 sm:w-8 sm:h-8 text-[#00af8f]" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-[#333333]">
                              Upload Profile Picture
                            </p>
                            <p className="text-xs text-[#666666] mt-1">
                              JPG, PNG or JPEG (max 5MB)
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-[#00af8f] text-[#00af8f] hover:bg-[#00af8f]/5 h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = e => {
                                const file = (e.target as HTMLInputElement)
                                  .files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = e => {
                                    const result = e.target?.result as string;
                                    setProfilePicture(result);
                                    setValue('profilePicture', result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              };
                              input.click();
                            }}>
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#666666] bg-blue-50 p-2 sm:p-3 rounded-lg border-l-4 border-blue-400">
                      <strong>Optional:</strong> A clear, recent photo of the
                      senior citizen for identification purposes.
                    </p>
                  </div>

                  {/* Valid ID Upload */}
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-[#333333] font-semibold text-xs sm:text-sm">
                      Valid ID Document
                    </Label>
                    <div className="border-2 border-dashed border-[#E0DDD8] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:border-[#00af8f]/50 transition-all duration-200">
                      {watch('seniorIdPhoto') ? (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                            <img
                              src={watch('seniorIdPhoto')}
                              alt="ID preview"
                              className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 p-0 bg-red-500 text-white border-red-500 hover:bg-red-600 rounded-full"
                              onClick={() => {
                                setValue('seniorIdPhoto', '');
                              }}>
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-[#00af8f] text-[#00af8f] hover:bg-[#00af8f]/5 h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = e => {
                                const file = (e.target as HTMLInputElement)
                                  .files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = e => {
                                    const result = e.target?.result as string;
                                    setValue('seniorIdPhoto', result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              };
                              input.click();
                            }}>
                            Change ID
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#00af8f]/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
                            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-[#00af8f]" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-[#333333]">
                              Upload Valid ID
                            </p>
                            <p className="text-xs text-[#666666] mt-1">
                              OSCA ID, Driver's License, etc.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-[#00af8f] text-[#00af8f] hover:bg-[#00af8f]/5 h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = e => {
                                const file = (e.target as HTMLInputElement)
                                  .files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = e => {
                                    const result = e.target?.result as string;
                                    setValue('seniorIdPhoto', result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              };
                              input.click();
                            }}>
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#666666] bg-blue-50 p-2 sm:p-3 rounded-lg border-l-4 border-blue-400">
                      <strong>Optional:</strong> Upload a clear photo of a valid
                      government-issued ID for verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </PersonalInfoStep>

case 1: // Address Information
return (
  <AddressStep>
    <div className="space-y-4 sm:space-y-6">
      {/* Location Selection */}
      <div className="bg-gradient-to-br from-[#feffff] to-[#ffffff] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-[#E0DDD8]/50">
        <h4 className="text-base sm:text-lg font-semibold text-[#333333] mb-4 sm:mb-6 flex items-center">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#00af8f] mr-2 flex-shrink-0" />
          Location Information
        </h4>
              </div>

              {/* Additional Address Details */}
              <div className="group">
                <Label
                  htmlFor="address"
                  className="text-[#333333] font-semibold text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                  Additional Address Details{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Textarea
                    id="address"
                    placeholder="Enter street address, building number, landmarks, or additional details..."
                    className="min-h-[120px] text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-[#feffff] transition-all duration-200 placeholder:text-[#999999] hover:border-[#00af8f]/50 resize-none"
                    {...register('address')}
                  />
                  <div className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                </div>
                {errors.address && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.address.message}
                  </p>
                )}
                <p className="text-xs text-[#666666] mt-2">
                  Please provide specific details such as house number, street
                  name, subdivision, or any landmarks that help identify the
                  exact location.
                </p>
              </div>
            </div>
          </AddressStep>
        );

      case 2: // Contact Information
        return (
          <ContactStep>
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-[#feffff] to-[#ffffff] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-[#E0DDD8]/50">
                <h4 className="text-base sm:text-lg font-semibold text-[#333333] mb-4 sm:mb-6 flex items-center">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#00af8f] mr-2 flex-shrink-0" />
                  Primary Contact Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Contact Person */}
                  <div className="group">
                    <Label
                      htmlFor="contactPerson"
                      className="text-[#333333] font-semibold text-xs sm:text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                      Contact Person
                    </Label>
                    <div className="relative">
                      <Input
                        id="contactPerson"
                        placeholder="Enter contact person name"
                        className="h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 placeholder:text-[#999999] hover:border-[#00af8f]/50"
                        {...register('contactPerson')}
                      />
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                    </div>
                  </div>

                  {/* Contact Phone */}
                  <div className="group">
                    <Label
                      htmlFor="contactPhone"
                      className="text-[#333333] font-semibold text-xs sm:text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                      Contact Phone
                    </Label>
                    <div className="relative">
                      <Input
                        id="contactPhone"
                        placeholder="Enter contact phone number"
                        className="h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 placeholder:text-[#999999] hover:border-[#00af8f]/50"
                        {...register('contactPhone')}
                      />
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                    </div>
                  </div>

                  {/* Contact Relationship */}
                  <div className="group">
                    <Label
                      htmlFor="contactRelationship"
                      className="text-[#333333] font-semibold text-xs sm:text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                      Relationship
                    </Label>
                    <div className="relative">
                      <Input
                        id="contactRelationship"
                        placeholder="e.g., Son, Daughter, Spouse"
                        className="h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 placeholder:text-[#999999] hover:border-[#00af8f]/50"
                        {...register('contactRelationship')}
                      />
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#666666] mt-3 sm:mt-4 bg-blue-50 p-2 sm:p-3 rounded-lg border-l-4 border-blue-400">
                  <strong>Optional:</strong> This contact information is for
                  someone who can be reached if needed regarding the senior
                  citizen's information or care.
                </p>
              </div>
            </div>
          </ContactStep>
        );

      case 3: // Emergency Contact
        return (
          <EmergencyContactStep>
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-[#feffff] to-[#ffffff] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-[#E0DDD8]/50">
                <h4 className="text-base sm:text-lg font-semibold text-[#333333] mb-4 sm:mb-6 flex items-center">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#00af8f] mr-2 flex-shrink-0" />
                  Emergency Contact Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Emergency Contact Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContactName"
                      className="text-[#333333] font-semibold text-xs sm:text-sm transition-colors">
                      Emergency Contact Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="emergencyContactName"
                        placeholder="Enter emergency contact name"
                        className="h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50"
                        {...register('emergencyContactName')}
                      />
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 focus-within:shadow-lg focus-within:shadow-[#00af8f]/20"></div>
                    </div>
                    {errors.emergencyContactName && (
                      <p className="text-red-500 text-xs sm:text-sm flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.emergencyContactName.message}
                      </p>
                    )}
                  </div>

                  {/* Emergency Contact Phone */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContactPhone"
                      className="text-[#333333] font-semibold text-xs sm:text-sm transition-colors">
                      Emergency Contact Phone <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="emergencyContactPhone"
                        placeholder="Enter emergency contact phone"
                        className="h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50"
                        {...register('emergencyContactPhone')}
                      />
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 focus-within:shadow-lg focus-within:shadow-[#00af8f]/20"></div>
                    </div>
                    {errors.emergencyContactPhone && (
                      <p className="text-red-500 text-xs sm:text-sm flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.emergencyContactPhone.message}
                      </p>
                    )}
                  </div>

                  {/* Emergency Contact Relationship */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContactRelationship"
                      className="text-[#333333] font-semibold text-xs sm:text-sm transition-colors">
                      Relationship <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="emergencyContactRelationship"
                        placeholder="e.g., Son, Daughter, Spouse"
                        className="h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50"
                        {...register('emergencyContactRelationship')}
                      />
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 focus-within:shadow-lg focus-within:shadow-[#00af8f]/20"></div>
                    </div>
                    {errors.emergencyContactRelationship && (
                      <p className="text-red-500 text-xs sm:text-sm flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.emergencyContactRelationship.message}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#666666] mt-3 sm:mt-4 bg-amber-50 p-2 sm:p-3 rounded-lg border-l-4 border-amber-400">
                  <strong>Important:</strong> This emergency contact information is
                  crucial for reaching someone in case of medical emergencies or
                  urgent situations regarding the senior citizen.
                </p>
              </div>
            </div>
          </EmergencyContactStep>
        );

      case 4: // Medical Information
        return (
          <MedicalStep>
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-[#feffff] to-[#ffffff] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-[#E0DDD8]/50">
                <h4 className="text-base sm:text-lg font-semibold text-[#333333] mb-4 sm:mb-6 flex items-center">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#00af8f] mr-2 flex-shrink-0" />
                  Medical Information
                </h4>

                {/* Medical Conditions */}
                <div className="space-y-3">
                  <Label className="text-[#333333] font-semibold text-xs sm:text-sm">
                    Medical Conditions
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Add medical condition"
                      value={newCondition}
                      onChange={e => setNewCondition(e.target.value)}
                      className="flex-1 h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50"
                    />
                    <Button
                      type="button"
                      onClick={handleAddCondition}
                      className="bg-[#00af8f] hover:bg-[#00af90] text-white h-10 sm:h-12 lg:h-14 px-4 text-sm sm:text-base rounded-xl sm:rounded-2xl flex-shrink-0">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  {medicalConditions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {medicalConditions.map((condition, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs sm:text-sm px-2 py-1 rounded-lg">
                          {condition}
                          <button
                            type="button"
                            onClick={() => handleRemoveCondition(condition)}
                            className="ml-2 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Medications */}
                <div className="space-y-3">
                  <Label className="text-[#333333] font-semibold text-xs sm:text-sm">
                    Medications
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Add medication"
                      value={newMedication}
                      onChange={e => setNewMedication(e.target.value)}
                      className="flex-1 h-10 sm:h-12 lg:h-14 text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50"
                    />
                    <Button
                      type="button"
                      onClick={handleAddMedication}
                      className="bg-[#00af8f] hover:bg-[#00af90] text-white h-10 sm:h-12 lg:h-14 px-4 text-sm sm:text-base rounded-xl sm:rounded-2xl flex-shrink-0">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  {medications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {medications.map((medication, index) => (
                        <Badge key={index} variant="outline" className="text-xs sm:text-sm px-2 py-1 rounded-lg">
                          {medication}
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(medication)}
                            className="ml-2 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-[#333333] font-semibold text-xs sm:text-sm">
                    Additional Notes
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="notes"
                      placeholder="Enter any additional notes or special requirements"
                      className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl sm:rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50 resize-none"
                      {...register('notes')}
                    />
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none transition-all duration-200 focus-within:shadow-lg focus-within:shadow-[#00af8f]/20"></div>
                  </div>
                </div>

                <p className="text-xs text-[#666666] mt-3 sm:mt-4 bg-blue-50 p-2 sm:p-3 rounded-lg border-l-4 border-blue-400">
                  <strong>Optional:</strong> This information helps healthcare
                  providers and caregivers understand the senior citizen's medical
                  history and current needs.
                </p>
              </div>
            </div>
          </MedicalStep>
        );

      case 5: // Living Conditions & Income
        return (
          <LivingConditionsStep>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="housingCondition"
                  className="text-[#333333] font-medium">
                  Housing Condition *
                </Label>
                <Select
                  onValueChange={value =>
                    setValue('housingCondition', value as any)
                  }>
                  <SelectTrigger className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl">
                    <SelectValue placeholder="Select housing condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">Owned</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="with_family">
                      Living with Family
                    </SelectItem>
                    <SelectItem value="institution">Institution</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.housingCondition && (
                  <p className="text-red-500 text-sm">
                    {errors.housingCondition.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="physicalHealthCondition"
                  className="text-[#333333] font-medium">
                  Physical Health Condition *
                </Label>
                <Select
                  onValueChange={value =>
                    setValue('physicalHealthCondition', value as any)
                  }>
                  <SelectTrigger className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl">
                    <SelectValue placeholder="Select health condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                {errors.physicalHealthCondition && (
                  <p className="text-red-500 text-sm">
                    {errors.physicalHealthCondition.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="monthlyIncome"
                  className="text-[#333333] font-medium">
                  Monthly Income (₱) *
                </Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  placeholder="Enter monthly income"
                  className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                  {...register('monthlyIncome', { valueAsNumber: true })}
                />
                {errors.monthlyIncome && (
                  <p className="text-red-500 text-sm">
                    {errors.monthlyIncome.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="monthlyPension"
                  className="text-[#333333] font-medium">
                  Monthly Pension (₱) *
                </Label>
                <Input
                  id="monthlyPension"
                  type="number"
                  placeholder="Enter monthly pension"
                  className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                  {...register('monthlyPension', { valueAsNumber: true })}
                />
                {errors.monthlyPension && (
                  <p className="text-red-500 text-sm">
                    {errors.monthlyPension.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="livingCondition"
                  className="text-[#333333] font-medium">
                  Living Condition *
                </Label>
                <Select
                  onValueChange={value =>
                    setValue('livingCondition', value as any)
                  }>
                  <SelectTrigger className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl">
                    <SelectValue placeholder="Select living condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">Independent</SelectItem>
                    <SelectItem value="with_family">
                      Living with Family
                    </SelectItem>
                    <SelectItem value="with_caregiver">
                      With Caregiver
                    </SelectItem>
                    <SelectItem value="institution">In Institution</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.livingCondition && (
                  <p className="text-red-500 text-sm">
                    {errors.livingCondition.message}
                  </p>
                )}
              </div>
            </div>
          </LivingConditionsStep>
        );

      case 6: // Beneficiaries
        return (
          <BeneficiariesStep>
            <div className="space-y-4">
              {beneficiaries.map((beneficiary, index) => (
                <div
                  key={index}
                  className="p-4 border-2 border-[#E0DDD8] rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-[#333333]">
                      Beneficiary {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newBeneficiaries = beneficiaries.filter(
                          (_, i) => i !== index
                        );
                        setBeneficiaries(newBeneficiaries);
                      }}
                      className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#333333] font-medium">
                        Name *
                      </Label>
                      <Input
                        placeholder="Enter beneficiary name"
                        value={beneficiary.name || ''}
                        onChange={e => {
                          const newBeneficiaries = [...beneficiaries];
                          newBeneficiaries[index].name = e.target.value;
                          setBeneficiaries(newBeneficiaries);
                        }}
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#333333] font-medium">
                        Relationship *
                      </Label>
                      <Input
                        placeholder="e.g., Son, Daughter, Grandchild"
                        value={beneficiary.relationship || ''}
                        onChange={e => {
                          const newBeneficiaries = [...beneficiaries];
                          newBeneficiaries[index].relationship = e.target.value;
                          setBeneficiaries(newBeneficiaries);
                        }}
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#333333] font-medium">
                        Date of Birth *
                      </Label>
                      <Input
                        type="date"
                        value={beneficiary.dateOfBirth || ''}
                        onChange={e => {
                          const newBeneficiaries = [...beneficiaries];
                          newBeneficiaries[index].dateOfBirth = e.target.value;
                          setBeneficiaries(newBeneficiaries);
                        }}
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#333333] font-medium">
                        Gender *
                      </Label>
                      <Select
                        value={beneficiary.gender || 'other'}
                        onValueChange={value => {
                          const newBeneficiaries = [...beneficiaries];
                          newBeneficiaries[index].gender = value as
                            | 'male'
                            | 'female'
                            | 'other';
                          setBeneficiaries(newBeneficiaries);
                        }}>
                        <SelectTrigger className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#333333] font-medium">
                        Address
                      </Label>
                      <Input
                        placeholder="Enter address"
                        value={beneficiary.address || ''}
                        onChange={e => {
                          const newBeneficiaries = [...beneficiaries];
                          newBeneficiaries[index].address = e.target.value;
                          setBeneficiaries(newBeneficiaries);
                        }}
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#333333] font-medium">
                        Contact Phone
                      </Label>
                      <Input
                        placeholder="Enter contact phone"
                        value={beneficiary.contactPhone || ''}
                        onChange={e => {
                          const newBeneficiaries = [...beneficiaries];
                          newBeneficiaries[index].contactPhone = e.target.value;
                          setBeneficiaries(newBeneficiaries);
                        }}
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#333333] font-medium">
                        Occupation
                      </Label>
                      <Input
                        placeholder="Enter occupation"
                        value={beneficiary.occupation || ''}
                        onChange={e => {
                          const newBeneficiaries = [...beneficiaries];
                          newBeneficiaries[index].occupation = e.target.value;
                          setBeneficiaries(newBeneficiaries);
                        }}
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#333333] font-medium">
                        Monthly Income (₱)
                      </Label>
                      <Input
                        type="number"
                        placeholder="Enter monthly income"
                        value={beneficiary.monthlyIncome || ''}
                        onChange={e => {
                          const newBeneficiaries = [...beneficiaries];
                          newBeneficiaries[index].monthlyIncome =
                            parseFloat(e.target.value) || 0;
                          setBeneficiaries(newBeneficiaries);
                        }}
                        className="h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`dependent-${index}`}
                      checked={beneficiary.isDependent || false}
                      onChange={e => {
                        const newBeneficiaries = [...beneficiaries];
                        newBeneficiaries[index].isDependent = e.target.checked;
                        setBeneficiaries(newBeneficiaries);
                      }}
                      className="w-4 h-4 text-[#00af8f] border-[#E0DDD8] rounded focus:ring-[#00af8f]"
                    />
                    <Label
                      htmlFor={`dependent-${index}`}
                      className="text-[#333333] font-medium">
                      Is Dependent
                    </Label>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                onClick={() => {
                  setBeneficiaries([
                    ...beneficiaries,
                    {
                      name: '',
                      relationship: '',
                      dateOfBirth: '',
                      gender: 'other',
                      address: '',
                      contactPhone: '',
                      occupation: '',
                      monthlyIncome: 0,
                      isDependent: false
                    }
                  ]);
                }}
                className="bg-[#00af8f] hover:bg-[#00af90] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Beneficiary
              </Button>
            </div>
          </BeneficiariesStep>
        );

      case 7: // Credentials
        return (
          <div className="space-y-8">
            {/* Login Credentials */}
            <div className="bg-gradient-to-br from-[#feffff] to-[#ffffff] p-6 rounded-2xl border-2 border-[#E0DDD8]/50">
              <h4 className="text-lg font-semibold text-[#333333] mb-6 flex items-center">
                <Key className="w-5 h-5 text-[#00af8f] mr-2" />
                Login Credentials
              </h4>
              <p className="text-[#666666] text-sm mb-6">
                Set up email and password for the senior citizen to access their
                account.
              </p>

              <div className="space-y-6">
                {/* Email */}
                <div className="group">
                  <Label
                    htmlFor="email"
                    className="text-[#333333] font-semibold text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      className="h-14 text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50"
                      {...register('email')}
                    />
                    <div className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="group">
                  <Label
                    htmlFor="password"
                    className="text-[#333333] font-semibold text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="text"
                      placeholder="Enter password"
                      className="h-14 text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50"
                      {...register('password')}
                    />
                    <div className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="group">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-[#333333] font-semibold text-sm mb-2 block transition-colors group-focus-within:text-[#00af8f]">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type="text"
                      placeholder="Confirm password"
                      className="h-14 text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-[#feffff] transition-all duration-200 hover:border-[#00af8f]/50"
                      {...register('confirmPassword')}
                    />
                    <div className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-200 group-focus-within:shadow-lg group-focus-within:shadow-[#00af8f]/20"></div>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="text-blue-800 font-medium text-sm mb-2">
                    Password Requirements:
                  </h5>
                  <ul className="text-blue-700 text-xs space-y-1">
                    <li>• Minimum 6 characters</li>
                    <li>• At least one uppercase letter (A-Z)</li>
                    <li>• At least one lowercase letter (a-z)</li>
                    <li>• At least one number (0-9)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] lg:w-[85vw] xl:w-[80vw] 2xl:w-[75vw] max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] border-0 shadow-2xl rounded-2xl sm:rounded-3xl">
        <DialogHeader className="pb-4 sm:pb-6 border-b border-[#E0DDD8]/30 px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl lg:text-3xl font-bold text-[#333333]">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-[#00af8f] to-[#00af90] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <User className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <span className="bg-gradient-to-r from-[#00af8f] to-[#00af90] bg-clip-text text-transparent truncate">
                Add New Senior Citizen
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-[#666666] text-sm sm:text-base lg:text-lg mt-2 sm:mt-3 ml-10 sm:ml-12 lg:ml-15 leading-relaxed">
            Register a new senior citizen in the system. Complete all required
            steps to add them to the database.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-180px)] scrollbar-thin scrollbar-thumb-[#E0DDD8] scrollbar-track-transparent">
          <form onSubmit={handleSubmit(onSubmit)} className="p-3 sm:p-4 lg:p-6">
            <MultiStepForm
              steps={steps}
              currentStep={currentStep}
              onStepChange={handleStepChange}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit(onSubmit)}
              isSubmitting={isLoading}
              canProceed={canProceed()}
              submitLabel="Add Senior Citizen">
              {renderStepContent()}
            </MultiStepForm>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
