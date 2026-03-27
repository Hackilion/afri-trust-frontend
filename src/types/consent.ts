export type ConsentAttribute =
  | 'full_name'
  | 'date_of_birth'
  | 'nationality'
  | 'address'
  | 'phone'
  | 'email'
  | 'document_number'
  | 'face_image';

export interface ConsentGrant {
  id: string;
  applicantId: string;
  grantedAttributes: ConsentAttribute[];
  grantedTo: string;
  grantedToDescription?: string;
  expiresAt: string;
  revokedAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AccessToken {
  id: string;
  consentGrantId: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}
