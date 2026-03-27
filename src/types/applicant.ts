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
}

export interface ApplicantListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  nationality: AfricanCountry;
  status: ApplicantStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  tier: VerificationTier;
  submittedAt: string;
  primaryDocumentType: DocumentType;
}

export interface ApplicantFilters {
  status?: ApplicantStatus[];
  country?: AfricanCountry[];
  riskLevel?: RiskLevel[];
  tier?: VerificationTier[];
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
