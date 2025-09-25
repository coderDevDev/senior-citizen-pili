'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Trash2,
  AlertTriangle,
  User,
  Shield,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { BascaMembersAPI } from '@/lib/api/basca-members';
import { toast } from 'sonner';
import type { BascaMember } from '@/types/basca';

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: BascaMember | null;
  onSuccess: () => void;
}

export function DeleteUserDialog({
  isOpen,
  onClose,
  user,
  onSuccess
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const result = await BascaMembersAPI.deleteBascaMember(user.id);

      if (result.success) {
        toast.success('✅ BASCA member deleted successfully');
        onSuccess();
      } else {
        throw new Error(result.message || 'Failed to delete BASCA member');
      }
    } catch (error) {
      console.error('Error deleting BASCA member:', error);
      toast.error(
        `❌ Failed to delete BASCA member: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setIsDeleting(false);
    }
  };

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

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Delete BASCA Member
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Are you sure you want to delete this BASCA member? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* User Details Card */}
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-[#00af8f] to-[#00af90] rounded-full flex items-center justify-center text-white font-bold text-xl">
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-[#333333]">
                    {user.firstName} {user.lastName}
                  </h3>
                  <Badge
                    className={
                      user.isActive
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#666666]" />
                      <span className="text-[#666666]">
                        <strong>Position:</strong>{' '}
                        {getPositionDisplayName(user.position)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#666666]" />
                      <span className="text-[#666666]">
                        <strong>Barangay:</strong> {user.barangay}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#666666]" />
                      <span className="text-[#666666]">
                        <strong>Email:</strong> {user.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#666666]" />
                      <span className="text-[#666666]">
                        <strong>Phone:</strong> {user.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {user.employeeId && (
                  <div className="mt-3">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200">
                      ID: {user.employeeId}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">
                Warning: This action is permanent
              </p>
              <p>
                Deleting this BASCA member will permanently remove their account
                and all associated data, including meeting records, training
                history, and contact information. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Data that will be deleted:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Personal information and contact details</li>
            <li>• Position and department assignments</li>
            <li>
              • Meeting attendance records ({user.totalMeetingsAttended || 0}{' '}
              meetings)
            </li>
            <li>• Training certifications and history</li>
            <li>• Performance metrics and statistics</li>
            <li>• Emergency contact information</li>
            <li>• All notes and additional data</li>
          </ul>
        </div>

        <AlertDialogFooter className="flex gap-3">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              disabled={isDeleting}
              className="border-gray-300">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete BASCA Member
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}






