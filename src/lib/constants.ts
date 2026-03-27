import type { AfricanCountry, ApplicantStatus, DocumentType, RiskLevel, VerificationTier } from '../types';

export const COUNTRY_NAMES: Record<AfricanCountry, string> = {
  NG: 'Nigeria',
  GH: 'Ghana',
  KE: 'Kenya',
  ZA: 'South Africa',
  EG: 'Egypt',
  ET: 'Ethiopia',
  TZ: 'Tanzania',
  UG: 'Uganda',
  SN: 'Senegal',
  CI: "Côte d'Ivoire",
};

export const COUNTRY_FLAGS: Record<AfricanCountry, string> = {
  NG: '🇳🇬',
  GH: '🇬🇭',
  KE: '🇰🇪',
  ZA: '🇿🇦',
  EG: '🇪🇬',
  ET: '🇪🇹',
  TZ: '🇹🇿',
  UG: '🇺🇬',
  SN: '🇸🇳',
  CI: '🇨🇮',
};

export const STATUS_LABELS: Record<ApplicantStatus, string> = {
  verified: 'Verified',
  pending: 'Pending',
  rejected: 'Rejected',
  needs_review: 'Needs Review',
  incomplete: 'Incomplete',
};

export const STATUS_COLORS: Record<ApplicantStatus, string> = {
  verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  needs_review: 'bg-blue-100 text-blue-700 border-blue-200',
  incomplete: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'text-emerald-600 bg-emerald-50',
  medium: 'text-amber-600 bg-amber-50',
  high: 'text-red-600 bg-red-50',
};

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  national_id: 'National ID',
  passport: 'Passport',
  voters_card: "Voter's Card",
  drivers_license: "Driver's License",
  nin: 'NIN',
  bvn: 'BVN',
  ghana_card: 'Ghana Card',
  alien_card: 'Alien Card',
};

export const TIER_LABELS: Record<VerificationTier, string> = {
  basic: 'Basic',
  standard: 'Standard',
  enhanced: 'Enhanced',
};

export const TIER_COLORS: Record<VerificationTier, string> = {
  basic: 'bg-slate-100 text-slate-600',
  standard: 'bg-indigo-100 text-indigo-700',
  enhanced: 'bg-purple-100 text-purple-700',
};
