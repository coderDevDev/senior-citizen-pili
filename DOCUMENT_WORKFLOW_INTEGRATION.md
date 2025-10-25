# Document Form Workflow Integration Guide

## 🎯 Objective

Integrate document forms (Authorization Letter, OSCA Endorsement, NCSS Application, Social Pension) into the document request workflow so that:

1. When a user selects a document type in the dropdown
2. A modal/dialog opens with the appropriate form
3. User fills and submits the form
4. Document request is automatically created and sent to OSCA/BASCA for review

## 📋 Current Setup

### Existing Components

1. **Document Forms** (in `app/documents/`)
   - `authorization-letter-form.tsx`
   - `osca-endorsement-form.tsx`
   - `ncss-application-form.tsx`
   - `social-pension-form.tsx`

2. **Document Request Page** (in `components/shared-components/documents/page.tsx`)
   - Has document type dropdown
   - Creates document requests
   - Sends to OSCA/BASCA for review

3. **New Modal Component** (in `components/documents/document-form-modal.tsx`)
   - Displays the appropriate form based on document type
   - Handles form submission workflow

## 🔄 Proposed Workflow

```
User Action Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Request Document" button                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Modal opens with Document Type dropdown                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User selects document type (e.g., "Social Pension")      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Form component loads in the modal                        │
│    - Authorization Letter Form                               │
│    - OSCA Endorsement Form                                   │
│    - NCSS Application Form                                   │
│    - Social Pension Form                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. User fills out the form fields                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. User clicks "Submit" button                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. System creates document request in database              │
│    - Status: "pending"                                       │
│    - Assigned to: OSCA/BASCA                                 │
│    - Includes form data                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Success notification shown                                │
│    - Modal closes                                            │
│    - Document list refreshes                                 │
│    - User sees new request in "Pending" status               │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Implementation Steps

### Step 1: Update Document Request Modal

Modify `components/shared-components/documents/page.tsx` to integrate the form modal:

```tsx
import DocumentFormModal from '@/components/documents/document-form-modal';

// Add state for form modal
const [showFormModal, setShowFormModal] = useState(false);
const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');

// Modify the document type select handler
const handleDocumentTypeChange = (value: string) => {
  setValue('document_type', value as any);
  
  // Check if this document type has a form
  const formTypes = [
    'authorization_letter',
    'endorsement_letter',
    'osca_endorsement',
    'application_form_ncsc',
    'ncss_application',
    'social_pension',
    'new_registration_senior_citizen'
  ];
  
  if (formTypes.includes(value)) {
    setSelectedDocumentType(value);
    setShowFormModal(true);
  }
};

// Add the modal component
<DocumentFormModal
  isOpen={showFormModal}
  onClose={() => setShowFormModal(false)}
  documentType={selectedDocumentType}
  seniorCitizenId={watch('senior_citizen_id')}
  onSubmitSuccess={(data) => {
    // Handle successful form submission
    handleCreateDocumentRequest(data);
    setShowFormModal(false);
  }}
/>
```

### Step 2: Modify Form Components to Support Submission

Update each form component to accept `onSubmit` callback:

```tsx
// Example: authorization-letter-form.tsx
interface AuthorizationLetterFormProps {
  onSubmit?: (data: any) => void;
  seniorCitizenId?: string;
}

export default function AuthorizationLetterForm({ 
  onSubmit,
  seniorCitizenId 
}: AuthorizationLetterFormProps) {
  const handleFormSubmit = () => {
    // Prepare form data
    const formData = {
      ...formDataState,
      senior_citizen_id: seniorCitizenId,
      document_type: 'authorization_letter',
      status: 'pending'
    };
    
    // Call parent onSubmit if provided
    if (onSubmit) {
      onSubmit(formData);
    } else {
      // Default behavior: just print
      window.print();
    }
  };
  
  return (
    // ... form JSX
    <button onClick={handleFormSubmit}>
      {onSubmit ? 'Submit Request' : 'Print'}
    </button>
  );
}
```

### Step 3: Create Document Request on Form Submission

```tsx
const handleFormSubmission = async (formData: any) => {
  try {
    // Create document request
    const documentRequest = {
      senior_citizen_id: formData.senior_citizen_id,
      document_type: formData.document_type,
      purpose: formData.purpose || 'Form submission',
      notes: JSON.stringify(formData), // Store form data as JSON
      priority_level: 'medium',
      status: 'pending',
      requirements: [],
      follow_up_required: false
    };
    
    // Call API to create request
    const result = await DocumentsAPI.createDocumentRequest(documentRequest);
    
    // Show success message
    toast.success('Document request submitted successfully!');
    
    // Refresh document list
    fetchDocuments();
    
    // Close modal
    setShowFormModal(false);
  } catch (error) {
    toast.error('Failed to submit document request');
    console.error(error);
  }
};
```

## 📝 Document Type Mapping

| Document Type Code | Form Component | Description |
|-------------------|----------------|-------------|
| `authorization_letter` | `AuthorizationLetterForm` | Simple authorization for representatives |
| `endorsement_letter` | `OSCAEndorsementForm` | Official OSCA endorsement |
| `osca_endorsement` | `OSCAEndorsementForm` | OSCA endorsement (alt) |
| `application_form_ncsc` | `NCSSApplicationForm` | NCSS application |
| `ncss_application` | `NCSSApplicationForm` | NCSS application (alt) |
| `social_pension` | `SocialPensionForm` | Social pension application |
| `new_registration_senior_citizen` | `SocialPensionForm` | Senior citizen registration |

## 🎨 UI/UX Considerations

### Modal Design
- **Size**: Large modal (max-w-6xl) to accommodate forms
- **Scrollable**: Forms can be long, ensure scrollability
- **Sticky Header**: Keep document type visible while scrolling
- **Sticky Footer**: Show submit/close buttons at bottom

### Form Behavior
- **Auto-fill**: Pre-fill senior citizen ID if available
- **Validation**: Show validation errors inline
- **Save Draft**: Consider adding "Save as Draft" option
- **Print Option**: Keep print functionality for offline use

### Success Flow
- **Toast Notification**: Show success message
- **Auto-close**: Close modal after submission
- **Refresh List**: Update document list automatically
- **Highlight New**: Highlight the newly created request

## 🔐 Security & Validation

### Form Validation
```tsx
// Validate required fields
const validateForm = (data: any) => {
  const errors = [];
  
  if (!data.senior_citizen_id) {
    errors.push('Senior citizen must be selected');
  }
  
  if (!data.document_type) {
    errors.push('Document type is required');
  }
  
  // Add more validations as needed
  
  return errors;
};
```

### Data Storage
```tsx
// Store form data securely
const storeFormData = async (data: any) => {
  // Sanitize data
  const sanitized = {
    ...data,
    // Remove sensitive fields if any
    // Encrypt if needed
  };
  
  // Store in database
  await supabase
    .from('document_requests')
    .insert({
      ...sanitized,
      form_data: JSON.stringify(sanitized), // Store full form as JSON
      created_at: new Date().toISOString()
    });
};
```

## 📊 Database Schema

### document_requests table
```sql
-- Add form_data column to store complete form information
ALTER TABLE document_requests 
ADD COLUMN form_data JSONB;

-- Add index for faster queries
CREATE INDEX idx_document_requests_form_data 
ON document_requests USING GIN (form_data);
```

## 🚀 Testing Checklist

- [ ] Modal opens when document type is selected
- [ ] Correct form loads for each document type
- [ ] Form validation works properly
- [ ] Submit button creates document request
- [ ] Document request appears in list with "pending" status
- [ ] OSCA/BASCA can see the request
- [ ] Form data is stored correctly
- [ ] Print functionality still works
- [ ] Mobile responsive design
- [ ] Error handling works

## 📱 Mobile Considerations

```tsx
// Make modal full-screen on mobile
<DialogContent className="max-w-6xl md:max-h-[90vh] h-full md:h-auto">
  {/* Form content */}
</DialogContent>
```

## 🔄 Alternative Approaches

### Approach 1: Inline Form (Current)
✅ Pros: Seamless experience, no navigation
❌ Cons: Complex modal, large component

### Approach 2: Separate Page
✅ Pros: More space, better for complex forms
❌ Cons: Requires navigation, breaks flow

### Approach 3: Hybrid
✅ Pros: Best of both worlds
❌ Cons: More complex to implement

**Recommendation**: Use Approach 1 (Inline Form in Modal) for better UX

## 📚 Next Steps

1. **Phase 1**: Implement modal integration
2. **Phase 2**: Update form components with onSubmit
3. **Phase 3**: Test workflow end-to-end
4. **Phase 4**: Add draft saving feature
5. **Phase 5**: Implement form data viewing for OSCA/BASCA

## 🎯 Success Metrics

- Reduce document request time by 50%
- Increase form completion rate
- Reduce errors in document requests
- Improve user satisfaction scores

---

**Created**: October 25, 2025
**Status**: 📋 Implementation Guide Ready
**Priority**: High
