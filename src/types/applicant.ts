export type ApplicantStatus =
  | 'verified'
  | 'pending'
  | 'rejected'
  | 'needs_review'
  | 'incomplete';

export type RiskLevel = 'low' | 'medium' | 'high';

export type DocumentType =
  | 'national_id'
  | 'passport'
  | 'voters_card'
  | 'drivers_license'
  | 'nin'
  | 'bvn'
  | 'ghana_card'
  | 'alien_card';

export type AfricanCountry =
  | 'NG'
  | 'GH'
  | 'KE'
  | 'ZA'
  | 'EG'
  | 'ET'
  | 'TZ'
  | 'UG'
  | 'SN'
  | 'CI';

export type VerificationTier = 'basic' | 'standard' | 'enhanced';

/** Persona / onboarding path — drives copy and review rules in the UI */
export type ApplicantKind =
  | 'individual'
  | 'sole_trader'
  | 'minor_dependent'
  | 'foreign_national'
  | 'refugee_or_stateless'
  | 'power_of_attorney'
  | 'corporate_authorized_person';

/** Where the application was captured */
export type IntakeChannel = 'mobile_sdk' | 'web_portal' | 'partner_api' | 'agent_tablet' | 'ussd_flow';

export interface ApplicantDocument {
  id: string;
  type: DocumentType;
  status: 'verified' | 'rejected' | 'pending';
  frontImageUrl?: string;
  backImageUrl?: string;
  selfieImageUrl?: string;
  issueDate?: string;
  expiryDate?: string;
  documentNumber?: string;
  rejectionReason?: string;
}

export interface ApplicantAddress {
  street: string;
  city: string;
  state: string;
  country: AfricanCountry;
  postalCode?: string;
}

export interface Applicant {
  id: string;
  /** Tenant organization that owns this application (workspace scope). */
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: AfricanCountry;
  residenceCountry: AfricanCountry;
  address: ApplicantAddress;
  status: ApplicantStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  tier: VerificationTier;
  documents: ApplicantDocument[];
  submittedAt: string;
  updatedAt: string;
  assignedTo?: string;
  externalReference?: string;
  tags?: string[];
  /** Explicit persona; omitted rows are inferred in the service layer */
  applicantKind?: ApplicantKind;
  intakeChannel?: IntakeChannel;
  gender?: 'female' | 'male' | 'unspecified';
  occupation?: string;
  /** Expected document slots for this journey (e.g. incomplete flows) */
  expectedDocumentSlots?: number;
  /** Optional explicit %; otherwise derived from documents + status */
  verificationProgress?: number;
  /** Last meaningful activity (upload, resubmit, status change) */
  lastActivityAt?: string;
  /** Recorded when an analyst rejects from the console (policy / manual decision). */
  analystRejectionReason?: string;
}

export interface ApplicantListItem {
  id: string;
  organizationId: string;
  organizationName: string;
  firstName: string;
  lastName: string;
  email: string;
  nationality: AfricanCountry;
  residenceCountry: AfricanCountry;
  status: ApplicantStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  tier: VerificationTier;
  submittedAt: string;
  updatedAt: string;
  primaryDocumentType: DocumentType;
  applicantKind: ApplicantKind;
  intakeChannel: IntakeChannel;
  /** 0–100 pipeline completeness */
  verificationProgress: number;
  /** Verified document count vs total attached */
  documentsVerified: number;
  documentsTotal: number;
  tags?: string[];
  crossBorder: boolean;
}

export interface ApplicantFilters {
  status?: ApplicantStatus[];
  country?: AfricanCountry[];
  riskLevel?: RiskLevel[];
  tier?: VerificationTier[];
  applicantKind?: ApplicantKind[];
  intakeChannel?: IntakeChannel[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page: number;
  pageSize: number;
  sortBy: keyof ApplicantListItem;
  sortDirection: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
