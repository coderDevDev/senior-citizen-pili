export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'emergency' | 'benefit' | 'birthday';
  targetBarangay?: string;
  isUrgent: boolean;
  expiresAt?: string;
  smsSent: boolean;
  recipientCount?: number;
  createdAt: string;
  updatedAt?: string;
  status: 'active' | 'expired' | 'draft';
  createdBy?: string;
}

export interface Barangay {
  code: string;
  name: string;
  region?: string;
  province?: string;
  city?: string;
}
