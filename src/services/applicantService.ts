import { mockApplicants } from '../mocks/applicants';
import { mockOrganizations } from '../mocks/organizations';
import { getChecksForApplicant, getTimelineForApplicant } from '../mocks/verificationChecks';
import {
  deriveVerificationProgress,
  inferApplicantKind,
  inferIntakeChannel,
} from '../lib/applicantPresentation';
import { isLiveApi } from '../lib/apiConfig';
import { apiFetch } from '../lib/apiClient';
import { useSessionStore } from '../store/sessionStore';
import {
  backendGetApplicantDetail,
  backendGetKycSummary,
  backendListApplicants,
  backendSubmitReview,
  buildTimelineFromKycSummary,
} from './backendApplicantsService';
import type {
  ApplicantFilters,
  ApplicantListItem,
  Applicant,
  PaginatedResponse,
  ApplicantStatus,
} from '../types';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

export function organizationNameById(organizationId: string): string {
  if (isLiveApi()) {
    const u = useSessionStore.getState().user;
    if (u?.orgId === organizationId && u.orgDisplayName) return u.orgDisplayName;
    if (u?.orgDisplayName) return u.orgDisplayName;
  }
  return mockOrganizations.find(o => o.id === organizationId)?.name ?? organizationId;
}

function toListItem(a: Applicant): ApplicantListItem {
  const kind = inferApplicantKind(a);
  const channel = inferIntakeChannel(a);
  const progress = deriveVerificationProgress(a);
  const documentsTotal = Math.max(a.documents.length, a.expectedDocumentSlots ?? 0, 1);
  const documentsVerified = a.documents.filter(d => d.status === 'verified').length;

  return {
    id: a.id,
    organizationId: a.organizationId,
    organizationName: organizationNameById(a.organizationId),
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
    nationality: a.nationality,
    residenceCountry: a.residenceCountry,
    status: a.status,
    riskLevel: a.riskLevel,
    riskScore: a.riskScore,
    tier: a.tier,
    submittedAt: a.submittedAt,
    updatedAt: a.updatedAt,
    primaryDocumentType: a.documents[0]?.type ?? 'national_id',
    applicantKind: kind,
    intakeChannel: channel,
    verificationProgress: progress,
    documentsVerified,
    documentsTotal,
    tags: a.tags,
    crossBorder: a.nationality !== a.residenceCountry,
  };
}

function compareListItems(
  a: ApplicantListItem,
  b: ApplicantListItem,
  sortBy: keyof ApplicantListItem,
  dir: 'asc' | 'desc'
): number {
  const va = a[sortBy];
  const vb = b[sortBy];
  const mul = dir === 'asc' ? 1 : -1;
  if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mul;
  if (sortBy === 'submittedAt' || sortBy === 'updatedAt') {
    return (new Date(String(va)).getTime() - new Date(String(vb)).getTime()) * mul;
  }
  return String(va ?? '').localeCompare(String(vb ?? '')) * mul;
}

export async function getApplicants(
  filters: ApplicantFilters,
  workspaceOrgId: string | null
): Promise<PaginatedResponse<ApplicantListItem>> {
  if (isLiveApi() && workspaceOrgId) {
    const u = useSessionStore.getState().user;
    const orgName = u?.orgDisplayName ?? organizationNameById(workspaceOrgId);
    const page = await backendListApplicants(filters, workspaceOrgId, orgName);
    let { data } = page;
    if (filters.country?.length) {
      data = data.filter(
        a => filters.country!.includes(a.nationality) || filters.country!.includes(a.residenceCountry)
      );
    }
    if (filters.riskLevel?.length) {
      data = data.filter(a => filters.riskLevel!.includes(a.riskLevel));
    }
    if (filters.tier?.length) {
      data = data.filter(a => filters.tier!.includes(a.tier));
    }
    if (filters.applicantKind?.length) {
      data = data.filter(a => filters.applicantKind!.includes(a.applicantKind));
    }
    if (filters.intakeChannel?.length) {
      data = data.filter(a => filters.intakeChannel!.includes(a.intakeChannel));
    }
    data.sort((a, b) => compareListItems(a, b, filters.sortBy, filters.sortDirection));
    return { ...page, data };
  }

  await delay();

  if (!workspaceOrgId) {
    return {
      data: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 1,
    };
  }

  let results = mockApplicants.filter(a => a.organizationId === workspaceOrgId);

  if (filters.search) {
    const q = filters.search.toLowerCase().replace(/\s+/g, ' ');
    results = results.filter(a => {
      const name = `${a.firstName} ${a.lastName}`.toLowerCase();
      const tagHit = a.tags?.some(t => t.toLowerCase().includes(q));
      return (
        name.includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        (a.externalReference?.toLowerCase().includes(q) ?? false) ||
        tagHit
      );
    });
  }

  if (filters.status?.length) {
    results = results.filter(a => filters.status!.includes(a.status));
  }

  if (filters.country?.length) {
    results = results.filter(
      a => filters.country!.includes(a.nationality) || filters.country!.includes(a.residenceCountry)
    );
  }

  if (filters.riskLevel?.length) {
    results = results.filter(a => filters.riskLevel!.includes(a.riskLevel));
  }

  if (filters.tier?.length) {
    results = results.filter(a => filters.tier!.includes(a.tier));
  }

  if (filters.applicantKind?.length) {
    results = results.filter(a => filters.applicantKind!.includes(inferApplicantKind(a)));
  }

  if (filters.intakeChannel?.length) {
    results = results.filter(a => filters.intakeChannel!.includes(inferIntakeChannel(a)));
  }

  if (filters.dateFrom) {
    results = results.filter(a => a.submittedAt >= filters.dateFrom!);
  }

  if (filters.dateTo) {
    results = results.filter(a => a.submittedAt <= filters.dateTo!);
  }

  const listItems = results.map(toListItem);
  listItems.sort((a, b) => compareListItems(a, b, filters.sortBy, filters.sortDirection));

  const total = listItems.length;
  const start = (filters.page - 1) * filters.pageSize;
  const paged = listItems.slice(start, start + filters.pageSize);

  return {
    data: paged,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 1,
  };
}

export type ApplicantPipelineStats = {
  total: number;
  byStatus: Record<ApplicantStatus, number>;
  needsReview: number;
  openHighRisk: number;
  crossBorder: number;
  avgRiskScore: number;
  inProgressPct: number;
};

export async function getApplicantPipelineStats(workspaceOrgId: string | null): Promise<ApplicantPipelineStats> {
  if (!workspaceOrgId) {
    return {
      total: 0,
      byStatus: { verified: 0, pending: 0, rejected: 0, needs_review: 0, incomplete: 0 },
      needsReview: 0,
      openHighRisk: 0,
      crossBorder: 0,
      avgRiskScore: 0,
      inProgressPct: 0,
    };
  }

  if (isLiveApi()) {
    const stats = await apiFetch<{
      total_applicants: number;
      by_status: Record<string, number>;
      approval_rate_30d: number | null;
    }>('/v1/dashboard/stats');

    const byStatus: Record<ApplicantStatus, number> = {
      verified: 0,
      pending: 0,
      rejected: 0,
      needs_review: 0,
      incomplete: 0,
    };
    for (const [raw, count] of Object.entries(stats.by_status ?? {})) {
      const k = String(raw).toLowerCase();
      if (k === 'approved') byStatus.verified += count;
      else if (k === 'rejected') byStatus.rejected += count;
      else if (k === 'needs_review') byStatus.needs_review += count;
      else if (k === 'pending' || k === 'null' || k === 'none') byStatus.pending += count;
      else byStatus.incomplete += count;
    }
    const total = stats.total_applicants ?? 0;
    const inProgressPct =
      stats.approval_rate_30d != null ? Math.round(100 - stats.approval_rate_30d) : 45;
    return {
      total,
      byStatus,
      needsReview: byStatus.needs_review,
      openHighRisk: 0,
      crossBorder: 0,
      avgRiskScore: 42,
      inProgressPct: Math.min(100, Math.max(0, inProgressPct)),
    };
  }

  await delay(120);
  const list = mockApplicants.filter(a => a.organizationId === workspaceOrgId).map(toListItem);
  const byStatus: Record<ApplicantStatus, number> = {
    verified: 0,
    pending: 0,
    rejected: 0,
    needs_review: 0,
    incomplete: 0,
  };
  for (const a of list) {
    byStatus[a.status]++;
  }
  const open = list.filter(a => a.status !== 'verified' && a.status !== 'rejected');
  const openHighRisk = open.filter(a => a.riskLevel === 'high').length;
  const crossBorder = list.filter(a => a.crossBorder).length;
  const avgRiskScore =
    list.length === 0 ? 0 : Math.round(list.reduce((s, a) => s + a.riskScore, 0) / list.length);
  const inProgressPct =
    list.length === 0
      ? 0
      : Math.round((list.reduce((s, a) => s + a.verificationProgress, 0) / list.length));
  return {
    total: list.length,
    byStatus,
    needsReview: byStatus.needs_review,
    openHighRisk,
    crossBorder,
    avgRiskScore,
    inProgressPct,
  };
}

export async function getApplicantById(id: string, workspaceOrgId: string | null): Promise<Applicant | null> {
  if (isLiveApi() && workspaceOrgId) {
    const a = await backendGetApplicantDetail(id, workspaceOrgId);
    if (!a) return null;
    if (a.organizationId !== workspaceOrgId) return null;
    return a;
  }

  await delay();
  if (!workspaceOrgId) return null;
  const a = mockApplicants.find(x => x.id === id);
  if (!a || a.organizationId !== workspaceOrgId) return null;
  return a;
}

export async function getApplicantChecks(id: string, workspaceOrgId: string | null) {
  if (isLiveApi()) {
    await delay(50);
    const applicant =
      workspaceOrgId ? await backendGetApplicantDetail(id, workspaceOrgId).catch(() => null) : null;
    return getChecksForApplicant(id, applicant ?? undefined);
  }

  await delay(200);
  const applicant =
    workspaceOrgId ? mockApplicants.find(a => a.id === id && a.organizationId === workspaceOrgId) : undefined;
  return getChecksForApplicant(id, applicant);
}

export async function getApplicantTimeline(id: string) {
  if (isLiveApi()) {
    try {
      const kyc = await backendGetKycSummary(id);
      const built = buildTimelineFromKycSummary(id, kyc);
      if (built.length > 0) return built;
    } catch {
      /* fall through */
    }
    await delay(50);
    return getTimelineForApplicant(id);
  }
  await delay(200);
  return getTimelineForApplicant(id);
}

export async function updateApplicantStatus(
  id: string,
  status: ApplicantStatus,
  note: string | undefined,
  workspaceOrgId: string | null
): Promise<Applicant> {
  if (isLiveApi() && workspaceOrgId) {
    if (status === 'verified' || status === 'rejected') {
      await backendSubmitReview(id, status, note);
    }
    const fresh = await backendGetApplicantDetail(id, workspaceOrgId);
    if (!fresh) throw new Error(`Applicant ${id} not found`);
    if (status === 'rejected' && note?.trim()) {
      return { ...fresh, analystRejectionReason: note.trim() };
    }
    return fresh;
  }

  await delay();
  const applicant = mockApplicants.find(a => a.id === id);
  if (!applicant || !workspaceOrgId || applicant.organizationId !== workspaceOrgId) {
    throw new Error(`Applicant ${id} not found in this workspace`);
  }
  applicant.status = status;
  applicant.updatedAt = new Date().toISOString();
  if (status === 'rejected' && note?.trim()) {
    applicant.analystRejectionReason = note.trim();
  }
  if (status === 'verified') {
    delete applicant.analystRejectionReason;
  }
  return { ...applicant };
}
