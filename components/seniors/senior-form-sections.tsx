'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Camera, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  FileText, 
  Home, 
  Users, 
  Plus, 
  X 
} from 'lucide-react';

interface SeniorFormSectionsProps {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  isEditing: boolean;
  seniorData?: any;
  beneficiaries: any[];
  setBeneficiaries: (beneficiaries: any[]) => void;
  calculatedAge?: number | null;
}

export function SeniorFormSections({
  register,
  errors,
  watch,
  setValue,
  isEditing,
  seniorData,
  beneficiaries,
  setBeneficiaries,
  calculatedAge
}: SeniorFormSectionsProps) {
  return (
    <div className="space-y-6">
      {/* 1. Personal Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 border-b border-[#E0DDD8]/30">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#00af8f]" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                disabled={!isEditing}
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                {...register('middle_name')}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                disabled={!isEditing}
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
                disabled={!isEditing}
                className={errors.date_of_birth ? 'border-red-500' : ''}
              />
              {errors.date_of_birth && (
                <p className="text-red-500 text-sm mt-1">{errors.date_of_birth.message}</p>
              )}
              {calculatedAge && (
                <p className="text-sm text-[#666666] mt-1">Age: {calculatedAge} years old</p>
              )}
            </div>
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select 
                disabled={!isEditing}
                value={watch('gender')}
                onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}
              >
                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
              )}
            </div>
          </div>

          {seniorData?.osca_id && (
            <div>
              <Label>OSCA ID</Label>
              <div className="flex items-center gap-2">
                <Input value={seniorData.osca_id} disabled />
                <Badge className="bg-[#00af8f] text-white">Verified</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Continue with other sections... */}
    </div>
  );
}
