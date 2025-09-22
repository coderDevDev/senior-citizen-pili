'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  FileText,
  AlertCircle,
  Activity,
  CheckCircle,
  Clock,
  Users,
  Award,
  TrendingUp,
  Edit
} from 'lucide-react';
import type { BascaMember } from '@/types/basca';

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: BascaMember | null;
  onEdit?: () => void;
}

export function ViewUserModal({
  isOpen,
  onClose,
  user,
  onEdit
}: ViewUserModalProps) {
  if (!user) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilTraining = () => {
    if (!user.nextTrainingDate) return null;
    const nextTraining = new Date(user.nextTrainingDate);
    const now = new Date();
    const daysUntil = Math.ceil(
      (nextTraining.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil;
  };

  const daysUntilTraining = getDaysUntilTraining();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-[#00af8f]" />
            BASCA Member Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Profile */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-r from-[#00af8f] to-[#00af90] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-[#333333]">
                      {user.firstName} {user.lastName}
                    </h2>
                    {/* <Badge
                      className={
                        user.isActive
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge> */}
                  </div>
                  <p className="text-lg text-[#666666] mb-1">
                    {getPositionDisplayName(user.position)}
                  </p>
                  <p className="text-sm text-[#666666]">
                    {user.department && `${user.department} • `}
                    {user.employeeId && `ID: ${user.employeeId}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-[#333333]">
                  {user.attendanceRate || 0}%
                </p>
                <p className="text-sm text-[#666666]">Attendance Rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-[#333333]">
                  {user.totalMeetingsAttended || 0}
                </p>
                <p className="text-sm text-[#666666]">Meetings Attended</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-[#333333]">
                  {user.totalMeetingsConducted || 0}
                </p>
                <p className="text-sm text-[#666666]">Meetings Conducted</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-[#333333]">
                  {user.trainingCertifications?.length || 0}
                </p>
                <p className="text-sm text-[#666666]">Certifications</p>
              </CardContent>
            </Card>
          </div> */}

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-[#00af8f]" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Email Address
                  </Label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Phone Number
                  </Label>
                  <p className="text-gray-900">{user.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Barangay
                  </Label>
                  <p className="text-gray-900">{user.barangay}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Address
                  </Label>
                  <p className="text-gray-900">{user.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position and Department */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-[#00af8f]" />
                Position & Department
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Position
                  </Label>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {getPositionDisplayName(user.position)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Department
                  </Label>
                  <p className="text-gray-900">
                    {user.department || 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Employee ID
                  </Label>
                  <p className="text-gray-900">
                    {user.employeeId || 'Not assigned'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2 text-[#00af8f]" />
                Training Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Last Training Date
                  </Label>
                  <p className="text-gray-900">
                    {user.lastTrainingDate
                      ? formatDate(user.lastTrainingDate)
                      : 'No training recorded'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Next Training Date
                  </Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">
                      {user.nextTrainingDate
                        ? formatDate(user.nextTrainingDate)
                        : 'Not scheduled'}
                    </p>
                    {daysUntilTraining !== null && daysUntilTraining <= 30 && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        {daysUntilTraining} days
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {user.trainingCertifications &&
                user.trainingCertifications.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Certifications
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.trainingCertifications.map((cert, index) => (
                        <Badge
                          key={index}
                          className="bg-green-100 text-green-800 border-green-200">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Membership Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#00af8f]" />
                Membership Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Join Date
                  </Label>
                  <p className="text-gray-900">{formatDate(user.joinDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Member Since
                  </Label>
                  <p className="text-gray-900">
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(user.joinDate).getTime()) /
                        (1000 * 60 * 60 * 24 * 365)
                    )}{' '}
                    years
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Created
                  </Label>
                  <p className="text-gray-900">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Last Updated
                  </Label>
                  <p className="text-gray-900">{formatDate(user.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {(user.emergencyContactName ||
            user.emergencyContactPhone ||
            user.emergencyContactRelationship) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-[#00af8f]" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Contact Name
                    </Label>
                    <p className="text-gray-900">
                      {user.emergencyContactName || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Phone Number
                    </Label>
                    <p className="text-gray-900">
                      {user.emergencyContactPhone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Relationship
                    </Label>
                    <p className="text-gray-900">
                      {user.emergencyContactRelationship || 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {user.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-[#00af8f]" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {user.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-3 pt-6">
          {onEdit && (
            <Button
              onClick={onEdit}
              className="bg-[#00af8f] hover:bg-[#00af90] text-white">
              <Edit className="w-4 h-4 mr-2" />
              Edit Member
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for Label
function Label({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={className}>{children}</label>;
}
