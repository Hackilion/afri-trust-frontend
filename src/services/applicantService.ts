import { mockApplicants } from '../mocks/applicants';
import { getChecksForApplicant, getTimelineForApplicant } from '../mocks/verificationChecks';
import type { ApplicantFilters, ApplicantListItem, Applicant, PaginatedResponse, ApplicantStatus } from '../types';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

function toListItem(a: Applicant): ApplicantListItem {
  return {
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
    nationality: a.nationality,
    status: a.status,
    riskLevel: a.riskLevel,
    riskScore: a.riskScore,
    tier: a.tier,
    submittedAt: a.submittedAt,
    primaryDocumentType: a.documents[0]?.type ?? 'national_id',
  };
}

export async function getApplicants(filters: ApplicantFilters): Promise<PaginatedResponse<ApplicantListItem>> {
  await delay();

  let results = [...mockApplicants];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(a =>
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  }

  if (filters.status?.length) {
    results = results.filter(a => filters.status!.includes(a.status));
  }

  if (filters.country?.length) {
    results = results.filter(a => filters.country!.includes(a.nationality));
  }

  if (filters.riskLevel?.length) {
    results = results.filter(a => filters.riskLevel!.includes(a.riskLevel));
  }

  if (filters.tier?.length) {
    results = results.filter(a => filters.tier!.includes(a.tier));
  }

  if (filters.dateFrom) {
    results = results.filter(a => a.submittedAt >= filters.dateFrom!);
  }

  if (filters.dateTo) {
    results = results.filter(a => a.submittedAt <= filters.dateTo!);
  }

  // Sort
  results.sort((a, b) => {
    const aVal = a[filters.sortBy as keyof Applicant];
    const bVal = b[filters.sortBy as keyof Applicant];
    const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
    return filters.sortDirection === 'asc' ? cmp : -cmp;
  });

  const total = results.length;
  const start = (filters.page - 1) * filters.pageSize;
  const paged = results.slice(start, start + filters.pageSize);

  return {
    data: paged.map(toListItem),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  };
}

export async function getApplicantById(id: string): Promise<Applicant | null> {
  await delay();
  return mockApplicants.find(a => a.id === id) ?? null;
}

export async function getApplicantChecks(id: string) {
  await delay(200);
  return getChecksForApplicant(id);
}

export async function getApplicantTimeline(id: string) {
  await delay(200);
  return getTimelineForApplicant(id);
}

export async function updateApplicantStatus(id: string, status: ApplicantStatus, _note?: string): Promise<Applicant> {
  await delay();
  const applicant = mockApplicants.find(a => a.id === id);
  if (!applicant) throw new Error(`Applicant ${id} not found`);
  applicant.status = status;
  applicant.updatedAt = new Date().toISOString();
  return { ...applicant };
}
