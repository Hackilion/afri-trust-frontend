export type CheckStatus = 'passed' | 'failed' | 'pending' | 'not_applicable';

export type VerificationCheckType =
  | 'liveness'
  | 'face_match'
  | 'document_authenticity'
  | 'document_expiry'
  | 'watchlist'
  | 'pep'
  | 'adverse_media'
  | 'address_verification'
  | 'phone_verification'
  | 'email_verification';

export interface VerificationCheck {
  id: string;
  applicantId: string;
  type: VerificationCheckType;
  status: CheckStatus;
  score?: number;
  details: string;
  failureReason?: string;
  performedAt: string;
  provider?: string;
}

export type TimelineEventType =
  | 'submitted'
  | 'document_uploaded'
  | 'check_completed'
  | 'status_changed'
  | 'note_added'
  | 'approved'
  | 'rejected'
  | 'info_requested'
  | 'resubmitted';

export interface TimelineEvent {
  id: string;
  applicantId: string;
  type: TimelineEventType;
  description: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
