import type { Organization } from '../types/rbac';

export let mockOrganizations: Organization[] = [
  {
    id: 'org-gh-bank',
    name: 'Ghana Commerce Bank',
    slug: 'gh-commerce-bank',
    plan: 'enterprise',
    status: 'active',
    region: 'West Africa',
    createdAt: '2024-06-12T08:00:00Z',
    memberCount: 12,
    applicantsThisMonth: 342,
  },
  {
    id: 'org-nairobi-pay',
    name: 'Nairobi Pay Ltd',
    slug: 'nairobi-pay',
    plan: 'growth',
    status: 'active',
    region: 'East Africa',
    createdAt: '2025-01-20T10:00:00Z',
    memberCount: 6,
    applicantsThisMonth: 128,
  },
  {
    id: 'org-lagos-lend',
    name: 'Lagos Lend Microfinance',
    slug: 'lagos-lend',
    plan: 'starter',
    status: 'trial',
    region: 'West Africa',
    createdAt: '2026-02-01T14:00:00Z',
    memberCount: 3,
    applicantsThisMonth: 41,
  },
];
