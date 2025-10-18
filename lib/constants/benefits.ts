// Benefit Types for the system
export const BENEFIT_TYPES = [
  'social_pension',
  'birthday_cash_gift',
  'centenarian',
  'legal_assistance'
] as const;

export type BenefitType = typeof BENEFIT_TYPES[number];

// Benefit Type Display Names
export const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
  social_pension: 'Social Pension',
  birthday_cash_gift: 'Birthday Cash Gift',
  centenarian: 'Centenarian',
  legal_assistance: 'Legal Assistance'
};

// Get benefit type label
export function getBenefitTypeLabel(type: string): string {
  return BENEFIT_TYPE_LABELS[type as BenefitType] || type;
}
