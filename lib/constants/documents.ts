// Document Types for the system
export const DOCUMENT_TYPES = [
  'osca_id',
  'medical_certificate',
  'endorsement_letter',
  'application_form_ncsc',
  'new_registration_senior_citizen',
  'cancellation_letter',
  'authorization_letter'
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];

// Document Type Display Names
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  osca_id: 'OSCA ID',
  medical_certificate: 'Medical Certificate',
  endorsement_letter: 'Endorsement Letter',
  application_form_ncsc: 'Application Form for NCSC',
  new_registration_senior_citizen: 'New Registration of Senior Citizen',
  cancellation_letter: 'Cancellation Letter',
  authorization_letter: 'Authorization Letter'
};

// Get document type label
export function getDocumentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type as DocumentType] || type;
}
