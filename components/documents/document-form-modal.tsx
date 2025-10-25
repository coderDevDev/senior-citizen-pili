'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';

// Import all document forms
import AuthorizationLetterForm from '@/app/documents/authorization-letter-form';
import OSCAEndorsementForm from '@/app/documents/osca-endorsement-form';
import NCSSApplicationForm from '@/app/documents/ncss-application-form';
import SocialPensionForm from '@/app/documents/social-pension-form';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  seniorCitizenId?: string;
  onSubmitSuccess?: (data: any) => void;
}

export default function DocumentFormModal({
  isOpen,
  onClose,
  documentType,
  seniorCitizenId,
  onSubmitSuccess
}: DocumentFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map document types to their form components
  const getFormComponent = () => {
    switch (documentType) {
      case 'authorization_letter':
        return <AuthorizationLetterForm />;
      
      case 'endorsement_letter':
      case 'osca_endorsement':
        return <OSCAEndorsementForm />;
      
      case 'application_form_ncsc':
      case 'ncss_application':
        return <NCSSApplicationForm />;
      
      case 'social_pension':
      case 'new_registration_senior_citizen':
        return <SocialPensionForm />;
      
      default:
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600">
              Form for "{documentType}" is not yet available.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please use the standard document request form.
            </p>
          </div>
        );
    }
  };

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      authorization_letter: 'Authorization Letter',
      endorsement_letter: 'Endorsement Letter',
      osca_endorsement: 'OSCA Endorsement',
      application_form_ncsc: 'NCSS Application Form',
      ncss_application: 'NCSS Application',
      social_pension: 'Social Pension Form',
      new_registration_senior_citizen: 'Senior Citizen Registration',
      osca_id: 'OSCA ID',
      medical_certificate: 'Medical Certificate',
      barangay_clearance: 'Barangay Clearance',
      cancellation_letter: 'Cancellation Letter'
    };
    return labels[type] || type.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 bg-white z-10 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {getDocumentTypeLabel(documentType)}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Fill out the form below. After submission, your request will be sent to OSCA/BASCA for review.
          </p>
        </DialogHeader>

        <div className="px-6 py-4">
          {getFormComponent()}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Note:</span> Make sure all information is accurate before submitting.
            </p>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
