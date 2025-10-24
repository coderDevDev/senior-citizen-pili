// Benefit Types Configuration

export const BENEFIT_TYPES = {
  SOCIAL_PENSION: 'social_pension',
  CENTENARIAN: 'centenarian',
  BIRTHDAY_GIFT: 'birthday_gift',
  LEGAL_ASSISTANCE: 'legal_assistance'
} as const;

export type BenefitType = typeof BENEFIT_TYPES[keyof typeof BENEFIT_TYPES];

export interface BenefitTypeConfig {
  id: BenefitType;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiredDocuments: string[];
  formFields: FormField[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'file';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helperText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export const BENEFIT_CONFIGS: Record<BenefitType, BenefitTypeConfig> = {
  [BENEFIT_TYPES.SOCIAL_PENSION]: {
    id: BENEFIT_TYPES.SOCIAL_PENSION,
    name: 'Social Pension',
    description: 'Monthly financial assistance for indigent senior citizens',
    icon: '💰',
    color: 'blue',
    requiredDocuments: [
      'Valid ID',
      'Proof of Income',
      'Barangay Indigency Certificate'
    ],
    formFields: [
      {
        name: 'monthlyIncome',
        label: 'Monthly Income',
        type: 'number',
        required: true,
        placeholder: '0.00',
        helperText: 'Enter your total monthly income in pesos',
        validation: { min: 0 }
      },
      {
        name: 'incomeSource',
        label: 'Source of Income',
        type: 'select',
        required: true,
        options: [
          'Pension from Children',
          'Government Pension',
          'Business/Self-Employed',
          'Rental Income',
          'No Income',
          'Other'
        ]
      },
      {
        name: 'livingArrangement',
        label: 'Living Arrangement',
        type: 'select',
        required: true,
        options: [
          'Living Alone',
          'Living with Spouse',
          'Living with Children',
          'Living with Relatives',
          'Other'
        ]
      },
      {
        name: 'bankAccount',
        label: 'Bank Account Number',
        type: 'text',
        required: true,
        placeholder: 'Enter account number',
        helperText: 'For pension disbursement'
      },
      {
        name: 'bankName',
        label: 'Bank Name',
        type: 'select',
        required: true,
        options: [
          'BDO',
          'BPI',
          'Metrobank',
          'Landbank',
          'PNB',
          'UnionBank',
          'Security Bank',
          'Other'
        ]
      }
    ]
  },

  [BENEFIT_TYPES.CENTENARIAN]: {
    id: BENEFIT_TYPES.CENTENARIAN,
    name: 'Centenarian Authorization',
    description: 'Special recognition and cash gift for senior citizens turning 100 years old',
    icon: '🎂',
    color: 'purple',
    requiredDocuments: [
      'Birth Certificate',
      'Valid ID',
      'Proof of Age'
    ],
    formFields: [
      {
        name: 'birthDate',
        label: 'Date of Birth',
        type: 'date',
        required: true,
        helperText: 'Must be 100 years old or turning 100'
      },
      {
        name: 'purposeOfAuthorization',
        label: 'Purpose of Authorization',
        type: 'textarea',
        required: true,
        placeholder: 'Please specify the purpose...',
        helperText: 'Explain why you need this authorization'
      },
      {
        name: 'preferredClaimDate',
        label: 'Preferred Claim Date',
        type: 'date',
        required: false,
        helperText: 'When would you like to claim the benefit?'
      },
      {
        name: 'authorizedRepresentative',
        label: 'Authorized Representative (if any)',
        type: 'text',
        required: false,
        placeholder: 'Full name of representative'
      },
      {
        name: 'representativeRelation',
        label: 'Relationship to Representative',
        type: 'select',
        required: false,
        options: [
          'Spouse',
          'Son/Daughter',
          'Grandchild',
          'Sibling',
          'Other Relative',
          'Caregiver'
        ]
      }
    ]
  },

  [BENEFIT_TYPES.BIRTHDAY_GIFT]: {
    id: BENEFIT_TYPES.BIRTHDAY_GIFT,
    name: 'Birthday Cash Gift',
    description: 'Annual birthday cash gift for senior citizens',
    icon: '🎁',
    color: 'pink',
    requiredDocuments: [
      'Valid ID',
      'Proof of Birthday'
    ],
    formFields: [
      {
        name: 'birthDate',
        label: 'Birthday',
        type: 'date',
        required: true,
        helperText: 'Your date of birth'
      },
      {
        name: 'contactNumber',
        label: 'Contact Number',
        type: 'text',
        required: true,
        placeholder: '09XX XXX XXXX',
        helperText: 'For notification purposes'
      },
      {
        name: 'preferredClaimDate',
        label: 'Preferred Claim Date',
        type: 'date',
        required: true,
        helperText: 'When would you like to claim your gift?'
      },
      {
        name: 'claimMethod',
        label: 'Claim Method',
        type: 'select',
        required: true,
        options: [
          'Pick up at OSCA Office',
          'Home Delivery',
          'Bank Transfer'
        ]
      },
      {
        name: 'specialRequests',
        label: 'Special Requests (Optional)',
        type: 'textarea',
        required: false,
        placeholder: 'Any special requests or notes...'
      }
    ]
  },

  [BENEFIT_TYPES.LEGAL_ASSISTANCE]: {
    id: BENEFIT_TYPES.LEGAL_ASSISTANCE,
    name: 'Legal Assistance',
    description: 'Free legal consultation and assistance for senior citizens',
    icon: '⚖️',
    color: 'green',
    requiredDocuments: [
      'Valid ID',
      'Related Legal Documents (if any)'
    ],
    formFields: [
      {
        name: 'legalIssueType',
        label: 'Type of Legal Issue',
        type: 'select',
        required: true,
        options: [
          'Property Dispute',
          'Family Matter',
          'Contract Issue',
          'Elder Abuse',
          'Pension/Benefits',
          'Estate Planning',
          'Other'
        ]
      },
      {
        name: 'issueDescription',
        label: 'Description of Legal Issue',
        type: 'textarea',
        required: true,
        placeholder: 'Please describe your legal concern in detail...',
        helperText: 'Provide as much detail as possible'
      },
      {
        name: 'urgencyLevel',
        label: 'Urgency Level',
        type: 'select',
        required: true,
        options: [
          'Urgent (within 1 week)',
          'Moderate (within 1 month)',
          'Not Urgent'
        ]
      },
      {
        name: 'preferredContactMethod',
        label: 'Preferred Contact Method',
        type: 'select',
        required: true,
        options: [
          'Phone Call',
          'SMS',
          'Email',
          'In-Person Meeting'
        ]
      },
      {
        name: 'contactNumber',
        label: 'Contact Number',
        type: 'text',
        required: true,
        placeholder: '09XX XXX XXXX'
      },
      {
        name: 'previousLegalAction',
        label: 'Have you taken any legal action on this matter?',
        type: 'select',
        required: true,
        options: [
          'Yes',
          'No'
        ]
      },
      {
        name: 'previousActionDetails',
        label: 'If yes, please provide details',
        type: 'textarea',
        required: false,
        placeholder: 'Describe previous legal actions taken...'
      }
    ]
  }
};

// Helper function to get benefit config
export const getBenefitConfig = (benefitType: BenefitType): BenefitTypeConfig => {
  return BENEFIT_CONFIGS[benefitType];
};

// Helper function to get all benefit types as array
export const getAllBenefitTypes = (): BenefitTypeConfig[] => {
  return Object.values(BENEFIT_CONFIGS);
};

// Application status
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

// Status display config
export const STATUS_CONFIG = {
  [APPLICATION_STATUS.PENDING]: {
    label: 'Pending Review',
    color: 'yellow',
    icon: '⏳'
  },
  [APPLICATION_STATUS.APPROVED]: {
    label: 'Approved',
    color: 'green',
    icon: '✅'
  },
  [APPLICATION_STATUS.REJECTED]: {
    label: 'Rejected',
    color: 'red',
    icon: '❌'
  }
};
