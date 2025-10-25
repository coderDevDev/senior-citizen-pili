// ============================================================================
// INTEGRATION EXAMPLE: How to add Document Form Modal to SharedDocumentsPage
// ============================================================================
// File: components/shared-components/documents/page.tsx
//
// This shows the key changes needed to integrate the document form workflow
// ============================================================================

// 1. ADD IMPORT at the top of the file
import DocumentFormModal from '@/components/documents/document-form-modal';

// 2. ADD STATE VARIABLES (around line 180, with other useState declarations)
const [showFormModal, setShowFormModal] = useState(false);
const [selectedFormType, setSelectedFormType] = useState<string>('');

// 3. ADD HELPER FUNCTION to check if document type has a form
const hasFormComponent = (documentType: string): boolean => {
  const formTypes = [
    'authorization_letter',
    'endorsement_letter',
    'osca_endorsement',
    'application_form_ncsc',
    'ncss_application',
    'social_pension',
    'new_registration_senior_citizen'
  ];
  return formTypes.includes(documentType);
};

// 4. MODIFY THE DOCUMENT TYPE SELECT HANDLER (around line 1800)
// FIND THIS CODE:
/*
<Select
  value={watch('document_type')}
  onValueChange={value =>
    setValue('document_type', value as any)
  }>
*/

// REPLACE WITH:
<Select
  value={watch('document_type')}
  onValueChange={(value) => {
    setValue('document_type', value as any);
    
    // Check if this document type has a dedicated form
    if (hasFormComponent(value)) {
      setSelectedFormType(value);
      setShowFormModal(true);
    }
  }}>
  <SelectTrigger>
    <SelectValue placeholder="Select document type" />
  </SelectTrigger>
  <SelectContent>
    {DOCUMENT_TYPES.map(type => (
      <SelectItem key={type.value} value={type.value}>
        <div className="flex items-center gap-2">
          <span>{type.label}</span>
          {hasFormComponent(type.value) && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
              Has Form
            </span>
          )}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// 5. ADD FORM SUBMISSION HANDLER
const handleFormSubmit = async (formData: any) => {
  try {
    setIsSubmitting(true);
    
    // Prepare document request data
    const documentRequest = {
      senior_citizen_id: watch('senior_citizen_id'),
      document_type: selectedFormType,
      purpose: formData.purpose || 'Form submission via document form',
      notes: JSON.stringify(formData), // Store complete form data
      priority_level: watch('priority_level') || 'medium',
      required_by_date: watch('required_by_date'),
      requirements: watch('requirements') || [],
      follow_up_required: watch('follow_up_required') || false
    };
    
    // Create the document request
    const result = await DocumentsAPI.createDocumentRequest(documentRequest);
    
    // Success!
    toast.success('✅ Document request submitted successfully!', {
      description: 'Your request has been sent to OSCA/BASCA for review.'
    });
    
    // Close modal and refresh
    setShowFormModal(false);
    setIsCreateDialogOpen(false);
    reset();
    fetchDocuments();
    
  } catch (error) {
    console.error('Error submitting form:', error);
    toast.error('❌ Failed to submit document request', {
      description: error instanceof Error ? error.message : 'Please try again'
    });
  } finally {
    setIsSubmitting(false);
  }
};

// 6. ADD THE MODAL COMPONENT (at the end of the return statement, before closing </div>)
{/* Document Form Modal */}
<DocumentFormModal
  isOpen={showFormModal}
  onClose={() => {
    setShowFormModal(false);
    setSelectedFormType('');
  }}
  documentType={selectedFormType}
  seniorCitizenId={watch('senior_citizen_id')}
  onSubmitSuccess={handleFormSubmit}
/>

// ============================================================================
// COMPLETE EXAMPLE: Full Dialog with Form Integration
// ============================================================================

// This is how the complete "Create Document Request" dialog would look:

<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Create Document Request</DialogTitle>
      <DialogDescription>
        Fill in the details to create a new document request
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Senior Citizen Selection */}
      <div>
        <Label htmlFor="senior_citizen_id">Senior Citizen *</Label>
        <Select
          value={watch('senior_citizen_id')}
          onValueChange={value => setValue('senior_citizen_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select senior citizen" />
          </SelectTrigger>
          <SelectContent>
            {seniorCitizens.map(senior => (
              <SelectItem key={senior.id} value={senior.id}>
                {senior.first_name} {senior.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document Type Selection with Form Integration */}
      <div>
        <Label htmlFor="document_type">Document Type *</Label>
        <Select
          value={watch('document_type')}
          onValueChange={(value) => {
            setValue('document_type', value as any);
            
            // Open form modal if document type has a form
            if (hasFormComponent(value)) {
              setSelectedFormType(value);
              setShowFormModal(true);
            }
          }}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{type.label}</span>
                  {hasFormComponent(type.value) && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-2">
                      📝 Form Available
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFormComponent(watch('document_type')) && (
          <p className="text-sm text-green-600 mt-1">
            ✓ This document type has a fillable form
          </p>
        )}
      </div>

      {/* Other fields... */}
      <div>
        <Label htmlFor="purpose">Purpose *</Label>
        <Textarea {...register('purpose')} />
      </div>

      {/* Submit Button */}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsCreateDialogOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Request'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

{/* Document Form Modal - Opens when user selects a document type with a form */}
<DocumentFormModal
  isOpen={showFormModal}
  onClose={() => {
    setShowFormModal(false);
    setSelectedFormType('');
  }}
  documentType={selectedFormType}
  seniorCitizenId={watch('senior_citizen_id')}
  onSubmitSuccess={handleFormSubmit}
/>

// ============================================================================
// BENEFITS INTEGRATION (for /dashboard/senior/benefits/)
// ============================================================================

// Similar approach for the Benefits page:

// 1. Import the modal
import DocumentFormModal from '@/components/documents/document-form-modal';

// 2. Add state
const [showBenefitFormModal, setShowBenefitFormModal] = useState(false);
const [selectedBenefitType, setSelectedBenefitType] = useState<string>('');

// 3. Handle benefit type selection
const handleBenefitTypeChange = (value: string) => {
  setValue('benefit_type', value);
  
  // Map benefit types to document types
  const benefitToDocumentMap: Record<string, string> = {
    'social_pension': 'social_pension',
    'medical_assistance': 'endorsement_letter',
    'burial_assistance': 'endorsement_letter',
    // Add more mappings as needed
  };
  
  const documentType = benefitToDocumentMap[value];
  if (documentType) {
    setSelectedBenefitType(documentType);
    setShowBenefitFormModal(true);
  }
};

// 4. Add the modal
<DocumentFormModal
  isOpen={showBenefitFormModal}
  onClose={() => setShowBenefitFormModal(false)}
  documentType={selectedBenefitType}
  seniorCitizenId={currentSeniorId}
  onSubmitSuccess={handleBenefitFormSubmit}
/>

// ============================================================================
// SUMMARY
// ============================================================================

/*
Key Integration Points:

1. ✅ Import DocumentFormModal component
2. ✅ Add state for modal visibility and selected document type
3. ✅ Modify document type select to detect form-enabled types
4. ✅ Open modal when form-enabled type is selected
5. ✅ Handle form submission to create document request
6. ✅ Close modal and refresh list on success

Benefits:
- Seamless user experience
- No navigation required
- Form data automatically creates document request
- Goes directly to OSCA/BASCA for review
- Maintains print functionality as fallback
*/
