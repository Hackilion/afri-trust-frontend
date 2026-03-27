import type { ConsentGrant } from '../types';

const future = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const past = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export let mockConsentGrants: ConsentGrant[] = [
  {
    id: 'CG-001',
    applicantId: 'APL-000001',
    grantedAttributes: ['full_name', 'date_of_birth', 'nationality', 'document_number'],
    grantedTo: 'PayStack Financial Services',
    grantedToDescription: 'Payment processing provider for Emeka Okafor account',
    expiresAt: future(60),
    isActive: true,
    createdAt: past(10),
  },
  {
    id: 'CG-002',
    applicantId: 'APL-000001',
    grantedAttributes: ['full_name', 'email', 'phone'],
    grantedTo: 'Lagos State Revenue Service',
    grantedToDescription: 'Tax identity verification',
    expiresAt: future(30),
    isActive: true,
    createdAt: past(5),
  },
  {
    id: 'CG-003',
    applicantId: 'APL-000003',
    grantedAttributes: ['full_name', 'date_of_birth', 'nationality'],
    grantedTo: 'Equity Bank Kenya',
    grantedToDescription: 'Account opening KYC data share',
    expiresAt: past(5),
    revokedAt: past(14),
    isActive: false,
    createdAt: past(30),
  },
  {
    id: 'CG-004',
    applicantId: 'APL-000002',
    grantedAttributes: ['full_name', 'date_of_birth', 'address', 'document_number'],
    grantedTo: 'Fido Micro-Credit Ghana',
    grantedToDescription: 'Loan eligibility verification',
    expiresAt: future(45),
    isActive: true,
    createdAt: past(7),
  },
  {
    id: 'CG-005',
    applicantId: 'APL-000014',
    grantedAttributes: ['full_name', 'nationality', 'document_number', 'face_image'],
    grantedTo: 'Standard Bank South Africa',
    grantedToDescription: 'Premium account identity verification',
    expiresAt: future(90),
    isActive: true,
    createdAt: past(3),
  },
  {
    id: 'CG-006',
    applicantId: 'APL-000010',
    grantedAttributes: ['full_name', 'email', 'phone', 'address'],
    grantedTo: 'Orange Money Egypt',
    grantedToDescription: 'Mobile money account verification',
    expiresAt: past(1),
    isActive: false,
    createdAt: past(45),
  },
];
