import { apiFetch } from '../lib/apiClient';
import type {
  Applicant,
  ApplicantFilters,
  ApplicantListItem,
  ApplicantStatus,
  DocumentType,
  PaginatedResponse,
} from '../types';
import type {
  CheckCatalogueId,
  SessionStatus,
  SessionStep,
  SessionStepCheckStatus,
  VerificationSession,
} from '../types';
import type { CheckStatus, TimelineEvent, TimelineEventType } from '../types/verification';

/** Backend `PaginatedResponse` shape */
type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

type ApplicantListRow = {
  id: string;
  external_id: string | null;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  verification_status: string | null;
  tier_reached: string | null;
  last_verified_at: string | null;
  created_at: string;
};

type KycDoc = {
  id: string;
  document_type: string;
  original_filename: string | null;
  confidence_score: number | null;
  created_at: string;
};

type KycBio = {
  id: string;
  check_type: string;
  passed: boolean;
  score: number | null;
  created_at: string;
};

type KycStep = {
  step_order: number;
  tier_profile_name: string | null;
  status: string;
  checks_completed: Record<string, unknown>;
  attributes_collected: Record<string, unknown>;
  documents: KycDoc[];
  biometrics: KycBio[];
};

type KycSession = {
  session_id: string;
  workflow_id?: string;
  workflow_name: string | null;
  status: string;
  result: string;
  current_step_order: number;
  total_steps: number;
  started_at: string | null;
  completed_at: string | null;
  steps: KycStep[];
};

export type KycSummary = {
  applicant_id: string;
  external_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  metadata: Record<string, unknown>;
  sessions: KycSession[];
  active_consents: number;
};

const DEFAULT_COUNTRY = 'NG' as const;

function splitFullName(full: string | null | undefined): { firstName: string; lastName: string } {
  if (!full?.trim()) return { firstName: 'Unknown', lastName: 'Applicant' };
  const p = full.trim().split(/\s+/);
  if (p.length === 1) return { firstName: p[0], lastName: '' };
  return { firstName: p[0], lastName: p.slice(1).join(' ') };
}

function mapVerificationResultToStatus(sessions: KycSession[]): ApplicantStatus {
  const latest = sessions[0];
  if (!latest) return 'incomplete';
  if (latest.result === 'approved') return 'verified';
  if (latest.result === 'rejected') return 'rejected';
  if (latest.result === 'needs_review') return 'needs_review';
  return 'pending';
}

function mapDocBackendType(t: string): DocumentType {
  const m: Record<string, DocumentType> = {
    passport: 'passport',
    national_id: 'national_id',
    drivers_license: 'drivers_license',
    voter_card: 'voters_card',
    voters_card: 'voters_card',
    residence_permit: 'alien_card',
    address_proof: 'national_id',
    other: 'national_id',
  };
  return m[t] ?? 'national_id';
}

function mapCheckKey(key: string): CheckCatalogueId {
  const k = key.toLowerCase().replace(/-/g, '_');
  const allowed: CheckCatalogueId[] = [
    'liveness',
    'video_selfie',
    'face_match',
    'selfie_capture',
    'document_authenticity',
    'document_expiry',
    'registry_document',
    'watchlist',
    'pep',
    'adverse_media',
    'address_verification',
    'phone_verification',
    'email_verification',
    'biometric_dedup',
    'database_lookup',
  ];
  if (allowed.includes(k as CheckCatalogueId)) return k as CheckCatalogueId;
  if (k.includes('liveness')) return 'liveness';
  if (k.includes('face')) return 'face_match';
  if (k.includes('email')) return 'email_verification';
  if (k.includes('phone')) return 'phone_verification';
  if (k.includes('watch') || k.includes('aml')) return 'watchlist';
  return 'document_authenticity';
}

export function checksFromCompleted(obj: Record<string, unknown>): SessionStepCheckStatus[] {
  const rows: SessionStepCheckStatus[] = [];
  for (const [key, val] of Object.entries(obj)) {
    let status: CheckStatus = 'pending';
    if (val === true || val === 'passed' || val === 'complete') status = 'passed';
    else if (val === false || val === 'failed') status = 'failed';
    else if (val === 'not_applicable' || val === 'skipped') status = 'not_applicable';
    rows.push({ checkId: mapCheckKey(key), status });
  }
  return rows;
}

export function mapStepStatus(s: string): SessionStep['status'] {
  const v = s.toLowerCase();
  if (v === 'passed' || v === 'complete') return 'passed';
  if (v === 'failed') return 'failed';
  if (v === 'awaiting_review') return 'awaiting_review';
  if (v === 'not_started') return 'not_started';
  if (v === 'pending') return 'pending';
  return 'in_progress';
}

function mapSessionTopStatus(sess: KycSession): SessionStatus {
  const st = sess.status.toLowerCase();
  if (st === 'approved' || sess.result === 'approved') return 'approved';
  if (st === 'rejected' || sess.result === 'rejected') return 'rejected';
  if (st === 'awaiting_review' || sess.result === 'needs_review') return 'awaiting_review';
  if (st === 'processing') return 'processing';
  if (st === 'in_progress') return 'in_progress';
  if (st === 'created') return 'created';
  return 'in_progress';
}

export function mapKycSessionsToVerificationSessions(
  applicantId: string,
  orgId: string,
  kyc: KycSummary
): VerificationSession[] {
  return kyc.sessions.map(sess => {
    const steps: SessionStep[] = sess.steps.map(st => ({
      order: st.step_order,
      tierProfileName: st.tier_profile_name ?? undefined,
      status: mapStepStatus(st.status),
      checks: checksFromCompleted(st.checks_completed ?? {}),
      startedAt: st.step_order ? undefined : undefined,
    }));

    return {
      id: String(sess.session_id),
      applicantId,
      workflowId: sess.workflow_id ? String(sess.workflow_id) : orgId,
      workflowName: sess.workflow_name ?? 'Verification',
      workflowVersion: 1,
      status: mapSessionTopStatus(sess),
      currentStepOrder: sess.current_step_order,
      steps,
      createdAt: sess.started_at ?? new Date().toISOString(),
      updatedAt: sess.completed_at ?? sess.started_at ?? new Date().toISOString(),
      completedAt: sess.completed_at ?? undefined,
    };
  });
}

export function kycSummaryToApplicant(kyc: KycSummary, organizationId: string): Applicant {
  const { firstName, lastName } = splitFullName(kyc.full_name);
  const status = mapVerificationResultToStatus(kyc.sessions);
  const latest = kyc.sessions[0];
  const docsFlat: { doc: KycDoc; stepOrder: number }[] = [];
  for (const s of kyc.sessions) {
    for (const st of s.steps) {
      for (const d of st.documents) {
        docsFlat.push({ doc: d, stepOrder: st.step_order });
      }
    }
  }
  const documents = docsFlat.map(({ doc }) => ({
    id: String(doc.id),
    type: mapDocBackendType(doc.document_type),
    status: 'verified' as const,
    frontImageUrl: undefined,
    documentNumber: undefined,
    issueDate: undefined,
    expiryDate: undefined,
  }));

  const metaRisk = kyc.metadata?.risk_score;
  const riskScore =
    typeof metaRisk === 'number' ? Math.min(100, Math.max(0, metaRisk)) : status === 'rejected' ? 72 : 28;

  return {
    id: String(kyc.applicant_id),
    organizationId,
    firstName,
    lastName,
    email: kyc.email ?? '—',
    phone: kyc.phone ?? '—',
    dateOfBirth: '1990-01-01',
    nationality: DEFAULT_COUNTRY,
    residenceCountry: DEFAULT_COUNTRY,
    address: {
      street: '—',
      city: '—',
      state: '—',
      country: DEFAULT_COUNTRY,
    },
    status,
    riskLevel: riskScore >= 60 ? 'high' : riskScore >= 35 ? 'medium' : 'low',
    riskScore,
    tier: 'standard',
    documents: documents.length ? documents : [],
    submittedAt: latest?.started_at ?? new Date().toISOString(),
    updatedAt: latest?.completed_at ?? latest?.started_at ?? new Date().toISOString(),
    externalReference: kyc.external_id ?? undefined,
    analystRejectionReason:
      typeof kyc.metadata?.analyst_rejection_reason === 'string'
        ? kyc.metadata.analyst_rejection_reason
        : undefined,
  };
}

function listStatusToApplicantStatus(v: string | null): ApplicantStatus {
  if (!v || v === 'not_started') return 'incomplete';
  if (v === 'approved') return 'verified';
  if (v === 'rejected') return 'rejected';
  if (v === 'needs_review') return 'needs_review';
  return 'pending';
}

export function mapListRowToListItem(row: ApplicantListRow, organizationId: string, orgName: string): ApplicantListItem {
  const { firstName, lastName } = splitFullName(row.full_name);
  const st = listStatusToApplicantStatus(row.verification_status);
  return {
    id: String(row.id),
    organizationId,
    organizationName: orgName,
    firstName,
    lastName,
    email: row.email ?? '—',
    nationality: DEFAULT_COUNTRY,
    residenceCountry: DEFAULT_COUNTRY,
    status: st,
    riskLevel: st === 'rejected' ? 'high' : 'low',
    riskScore: st === 'verified' ? 15 : st === 'rejected' ? 80 : 40,
    tier: 'standard',
    submittedAt: row.created_at,
    updatedAt: row.last_verified_at ?? row.created_at,
    primaryDocumentType: 'national_id',
    applicantKind: 'individual',
    intakeChannel: 'web_portal',
    verificationProgress: st === 'verified' ? 100 : st === 'incomplete' ? 10 : 55,
    documentsVerified: st === 'verified' ? 1 : 0,
    documentsTotal: 1,
    crossBorder: false,
  };
}

function sortFieldForBackend(sortBy: keyof ApplicantListItem): string {
  const m: Partial<Record<keyof ApplicantListItem, string>> = {
    submittedAt: 'created_at',
    updatedAt: 'created_at',
    email: 'email',
    lastName: 'full_name',
    firstName: 'full_name',
  };
  return m[sortBy] ?? 'created_at';
}

export async function backendListApplicants(
  filters: ApplicantFilters,
  organizationId: string,
  orgName: string
): Promise<PaginatedResponse<ApplicantListItem>> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page));
  params.set('page_size', String(filters.pageSize));
  params.set('sort_by', sortFieldForBackend(filters.sortBy));
  params.set('sort_order', filters.sortDirection);

  const q = params.toString();
  const page = await apiFetch<Page<ApplicantListRow>>(`/v1/applicants?${q}`);
  let items = page.items.map(r => mapListRowToListItem(r, organizationId, orgName));

  if (filters.status?.length) {
    items = items.filter(a => filters.status!.includes(a.status));
  }

  return {
    data: items,
    total: page.total,
    page: page.page,
    pageSize: page.page_size,
    totalPages: page.pages || 1,
  };
}

export async function backendGetKycSummary(applicantId: string): Promise<KycSummary> {
  return apiFetch<KycSummary>(`/v1/applicants/${applicantId}/kyc-summary`);
}

export async function backendGetApplicantDetail(
  applicantId: string,
  organizationId: string
): Promise<Applicant | null> {
  try {
    const kyc = await backendGetKycSummary(applicantId);
    return kycSummaryToApplicant(kyc, organizationId);
  } catch (e: unknown) {
    const err = e as { status?: number };
    if (err.status === 404) return null;
    throw e;
  }
}

/** Activity feed for applicant detail when using live KYC summary. */
export function buildTimelineFromKycSummary(applicantId: string, kyc: KycSummary): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let seq = 0;
  const push = (type: TimelineEventType, description: string, createdAt: string) => {
    events.push({
      id: `tl-${applicantId}-${seq++}`,
      applicantId,
      type,
      description,
      performedBy: 'system',
      createdAt,
    });
  };

  const sessions = [...kyc.sessions].sort(
    (a, b) =>
      new Date(a.started_at ?? 0).getTime() - new Date(b.started_at ?? 0).getTime()
  );

  for (const s of sessions) {
    const wf = s.workflow_name?.trim() || 'Verification workflow';
    if (s.started_at) {
      push('submitted', `${wf} — session started`, s.started_at);
    }
    for (const st of s.steps) {
      const label = st.tier_profile_name?.trim() || `Step ${st.step_order}`;
      const stAt = st.documents[0]?.created_at ?? st.biometrics[0]?.created_at ?? s.started_at;
      if (stAt) {
        push(
          'check_completed',
          `${label}: ${String(st.status).replace(/_/g, ' ')}`,
          stAt
        );
      }
    }
    if (s.completed_at) {
      const r = String(s.result || s.status || '').toLowerCase();
      if (r === 'approved') push('approved', `${wf} — approved`, s.completed_at);
      else if (r === 'rejected') push('rejected', `${wf} — rejected`, s.completed_at);
      else if (r === 'needs_review')
        push('status_changed', `${wf} — needs manual review`, s.completed_at);
      else push('status_changed', `${wf} — ${String(s.status).replace(/_/g, ' ')}`, s.completed_at);
    }
  }

  events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return events;
}

/** Raw `GET /v1/verifications/{session_id}` response (snake_case JSON). */
export type VerificationDetailApi = {
  id: string;
  org_id: string;
  applicant_id: string;
  workflow_id: string;
  workflow_version: number;
  current_step_order: number;
  status: string;
  result: string;
  result_details?: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  workflow_name: string | null;
  applicant_name: string | null;
  steps: Array<{
    id: string;
    session_id: string;
    workflow_step_id: string;
    tier_profile_id: string;
    tier_profile_name: string | null;
    step_order: number;
    status: string;
    checks_completed: Record<string, unknown>;
    attributes_collected: Record<string, unknown>;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
  }>;
};

function mapDetailTopStatus(row: VerificationDetailApi): SessionStatus {
  if (row.result === 'approved') return 'approved';
  if (row.result === 'rejected') return 'rejected';
  const st = (row.status ?? '').toLowerCase();
  if (st === 'awaiting_review' || row.result === 'needs_review') return 'awaiting_review';
  if (st === 'processing') return 'processing';
  if (st === 'created') return 'created';
  if (st === 'in_progress') return 'in_progress';
  return 'in_progress';
}

function rejectionReasonFromDetails(details: Record<string, unknown> | undefined): string | undefined {
  if (!details || typeof details !== 'object') return undefined;
  const r = details.reason ?? details.rejection_reason ?? details.reject_reason;
  return typeof r === 'string' && r.trim() ? r : undefined;
}

export function mapVerificationDetailToSession(row: VerificationDetailApi): VerificationSession {
  const steps: SessionStep[] = (row.steps ?? []).map(st => ({
    order: st.step_order,
    tierProfileName: st.tier_profile_name ?? undefined,
    status: mapStepStatus(st.status),
    checks: checksFromCompleted(st.checks_completed ?? {}),
    startedAt: st.started_at ?? undefined,
    completedAt: st.completed_at ?? undefined,
  }));

  return {
    id: String(row.id),
    applicantId: String(row.applicant_id),
    workflowId: String(row.workflow_id),
    workflowName: row.workflow_name?.trim() || 'Verification',
    workflowVersion: row.workflow_version,
    status: mapDetailTopStatus(row),
    currentStepOrder: row.current_step_order,
    steps,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    rejectionReason: rejectionReasonFromDetails(row.result_details),
  };
}

/** `GET /v1/verifications/{id}` — JWT or API key (same as other verification routes). */
export async function backendGetVerificationDetail(sessionId: string): Promise<VerificationSession | null> {
  try {
    const row = await apiFetch<VerificationDetailApi>(`/v1/verifications/${sessionId}`);
    return mapVerificationDetailToSession(row);
  } catch (e: unknown) {
    const err = e as { status?: number };
    if (err.status === 404) return null;
    throw e;
  }
}

export async function backendSubmitReview(
  applicantId: string,
  status: ApplicantStatus,
  note: string | undefined
): Promise<void> {
  const kyc = await backendGetKycSummary(applicantId);
  const reviewable = kyc.sessions.find(
    s =>
      s.result === 'pending' ||
      s.result === 'needs_review' ||
      s.status.toLowerCase() === 'awaiting_review'
  );
  const target = reviewable ?? kyc.sessions[0];
  if (!target) throw new Error('No verification session found for this applicant.');

  const decision = status === 'verified' ? 'approve' : 'reject';
  await apiFetch(`/v1/verifications/${target.session_id}/review`, {
    method: 'POST',
    body: JSON.stringify({
      decision,
      reason: note?.trim() || null,
    }),
  });
}
