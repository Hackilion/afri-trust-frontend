import type { Applicant, ApplicantKind, IntakeChannel } from '../types';

export const APPLICANT_KIND_LABELS: Record<ApplicantKind, string> = {
  individual: 'Individual',
  sole_trader: 'Sole trader',
  minor_dependent: 'Minor / dependent',
  foreign_national: 'Foreign national',
  refugee_or_stateless: 'Refugee / stateless',
  power_of_attorney: 'Power of attorney',
  corporate_authorized_person: 'Corporate authorised person',
};

export const APPLICANT_KIND_SHORT: Record<ApplicantKind, string> = {
  individual: 'Individual',
  sole_trader: 'Sole trader',
  minor_dependent: 'Minor',
  foreign_national: 'Cross-border',
  refugee_or_stateless: 'Refugee',
  power_of_attorney: 'PoA',
  corporate_authorized_person: 'Corp rep',
};

export const INTAKE_CHANNEL_LABELS: Record<IntakeChannel, string> = {
  mobile_sdk: 'Mobile SDK',
  web_portal: 'Web portal',
  partner_api: 'Partner API',
  agent_tablet: 'Agent tablet',
  ussd_flow: 'USSD',
};

const CHANNELS_ROTATION: IntakeChannel[] = [
  'mobile_sdk',
  'web_portal',
  'partner_api',
  'agent_tablet',
  'ussd_flow',
];

function idHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function inferApplicantKind(a: Applicant): ApplicantKind {
  if (a.applicantKind) return a.applicantKind;
  if (a.tags?.some(t => t.includes('age') || t.includes('minor'))) return 'minor_dependent';
  if (a.tags?.some(t => t.includes('pep') || t.includes('sanction'))) return 'individual';
  if (a.nationality !== a.residenceCountry) return 'foreign_national';
  if (a.tags?.some(t => t.includes('refugee') || t.includes('stateless'))) return 'refugee_or_stateless';
  return 'individual';
}

export function inferIntakeChannel(a: Applicant): IntakeChannel {
  if (a.intakeChannel) return a.intakeChannel;
  return CHANNELS_ROTATION[idHash(a.id) % CHANNELS_ROTATION.length];
}

export function deriveVerificationProgress(a: Applicant): number {
  if (a.verificationProgress != null) return Math.min(100, Math.max(0, a.verificationProgress));
  if (a.status === 'verified') return 100;
  if (a.status === 'rejected') return 100;
  const totalSlots = a.expectedDocumentSlots ?? Math.max(a.documents.length, a.status === 'incomplete' ? 3 : 1);
  const verified = a.documents.filter(d => d.status === 'verified').length;
  const pending = a.documents.filter(d => d.status === 'pending').length;
  const rejected = a.documents.filter(d => d.status === 'rejected').length;
  if (totalSlots === 0) return a.status === 'incomplete' ? 15 : 40;
  const docRatio = (verified * 1 + pending * 0.55 + rejected * 0.2) / totalSlots;
  const statusBoost =
    a.status === 'needs_review' ? 8 : a.status === 'pending' ? 5 : a.status === 'incomplete' ? -10 : 0;
  return Math.min(100, Math.round(18 + docRatio * 72 + statusBoost));
}

export function listLastActivity(a: Applicant): string {
  return a.lastActivityAt ?? a.updatedAt;
}
