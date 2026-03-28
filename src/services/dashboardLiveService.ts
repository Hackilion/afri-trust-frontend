import { apiFetch } from '../lib/apiClient';
import type { ActivityFeedItem, DashboardKpis, TrendDataPoint } from '../types';
import type { AfricanCountry } from '../types/applicant';
import type { TimelineEventType } from '../types/verification';

const DEFAULT_COUNTRY: AfricanCountry = 'NG';

type StatsOut = {
  total_applicants: number;
  total_verifications: number;
  verifications_today: number;
  approval_rate_30d: number | null;
  avg_time_to_verify_seconds: number | null;
  by_status: Record<string, number>;
  by_tier: Record<string, Record<string, number>>;
  by_workflow: Record<string, Record<string, number>>;
};

type TimeseriesOut = { days: number; data: Array<Record<string, string | number | undefined | null>> };

type ApplicantFeedRow = {
  id: string;
  full_name: string | null;
  verification_status: string | null;
  created_at: string;
};

type ApplicantPage = { items: ApplicantFeedRow[] };

export type DashboardFunnelResponse = {
  period_days: number;
  funnel: {
    created: number;
    started: number;
    completed: number;
    approved: number;
    rejected: number;
    drop_off_rate: number;
  };
  by_step: Array<Record<string, string | number | undefined | null>>;
};

export type DashboardDocumentStatsResponse = {
  total_documents: number;
  by_document_type: Record<string, number>;
  biometrics: Record<
    string,
    { total: number; passed: number; failed: number; avg_score: number | null }
  >;
};

function partitionByStatus(byStatus: Record<string, number>) {
  let verified = 0;
  let rejected = 0;
  let needsReview = 0;
  let pending = 0;
  for (const [k, v] of Object.entries(byStatus)) {
    if (k === 'approved') verified += v;
    else if (k === 'rejected') rejected += v;
    else if (k === 'needs_review' || k === 'awaiting_review') needsReview += v;
    else pending += v;
  }
  return { verified, rejected, needsReview, pending };
}

function mapTimeseriesRow(row: Record<string, string | number | undefined | null>): TrendDataPoint {
  const date = String(row.date ?? '').slice(0, 10);
  const total = Number(row.total ?? 0);
  const approved = Number(row.approved ?? 0);
  const rej = Number(row.rejected ?? 0);
  return {
    date,
    submitted: total,
    verified: approved,
    rejected: rej,
  };
}

function fillTrendRange(days: number, points: TrendDataPoint[]): TrendDataPoint[] {
  const byDay = new Map(points.map(p => [p.date.slice(0, 10), p]));
  const out: TrendDataPoint[] = [];
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(byDay.get(key) ?? { date: key, submitted: 0, verified: 0, rejected: 0 });
  }
  return out;
}

function weekOverWeekFromTrend(points: TrendDataPoint[]): number | undefined {
  if (points.length < 14) return undefined;
  const last7 = points.slice(-7);
  const prev7 = points.slice(-14, -7);
  const sumSubmitted = (xs: TrendDataPoint[]) => xs.reduce((s, d) => s + d.submitted, 0);
  const a = sumSubmitted(last7);
  const b = sumSubmitted(prev7);
  if (b === 0) return a > 0 ? 100 : undefined;
  return Math.round(((a - b) / b) * 1000) / 10;
}

function mapTierBreakdown(byTier: StatsOut['by_tier']): DashboardKpis['byTier'] {
  return Object.entries(byTier).map(([name, results], i) => {
    const approved = results.approved ?? 0;
    const rejected = results.rejected ?? 0;
    const completed = approved + rejected;
    const count = Object.values(results).reduce((acc, n) => acc + n, 0);
    return {
      tierProfileId: `tier-${i}`,
      tierProfileName: name,
      count,
      approvalRate: completed > 0 ? approved / completed : 0,
    };
  });
}

function mapWorkflowBreakdown(byWf: StatsOut['by_workflow']): DashboardKpis['byWorkflow'] {
  return Object.entries(byWf).map(([name, results], i) => {
    const approved = results.approved ?? 0;
    const rejected = results.rejected ?? 0;
    const completed = approved + rejected;
    const count = Object.values(results).reduce((acc, n) => acc + n, 0);
    return {
      workflowId: `wf-${i}`,
      workflowName: name,
      count,
      approvalRate: completed > 0 ? approved / completed : 0,
      avgTimeHours: 0,
    };
  });
}

function statusToEvent(status: string | null): TimelineEventType {
  const s = (status ?? 'not_started').toLowerCase();
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'needs_review' || s === 'awaiting_review') return 'status_changed';
  return 'submitted';
}

function statusDescription(status: string | null): string {
  const s = status ?? 'not_started';
  const labels: Record<string, string> = {
    not_started: 'Not started',
    pending: 'In progress',
    approved: 'Approved',
    rejected: 'Rejected',
    needs_review: 'Needs review',
    awaiting_review: 'Awaiting review',
  };
  const label = labels[s] ?? s.replace(/_/g, ' ');
  return `Verification: ${label}`;
}

export async function apiGetDashboardKpis(): Promise<DashboardKpis> {
  const [stats, ts14] = await Promise.all([
    apiFetch<StatsOut>('/v1/dashboard/stats'),
    apiFetch<TimeseriesOut>('/v1/dashboard/stats/timeseries?days=14'),
  ]);

  const trend14 = fillTrendRange(
    14,
    (ts14.data ?? []).map(r => mapTimeseriesRow(r))
  );
  const wow = weekOverWeekFromTrend(trend14);

  const { verified, rejected, needsReview, pending } = partitionByStatus(stats.by_status ?? {});
  const approvalPct = stats.approval_rate_30d ?? 0;

  return {
    totalApplicants: stats.total_applicants,
    verified,
    pending,
    rejected,
    needsReview,
    averageVerificationTimeHours:
      stats.avg_time_to_verify_seconds != null ? stats.avg_time_to_verify_seconds / 3600 : 0,
    approvalRate: approvalPct / 100,
    weekOverWeekGrowth: wow,
    verificationsToday: stats.verifications_today,
    byTier: mapTierBreakdown(stats.by_tier ?? {}),
    byWorkflow: mapWorkflowBreakdown(stats.by_workflow ?? {}),
  };
}

export async function apiGetTrendData(days: 7 | 30 | 90): Promise<TrendDataPoint[]> {
  const ts = await apiFetch<TimeseriesOut>(`/v1/dashboard/stats/timeseries?days=${days}`);
  const mapped = (ts.data ?? []).map(r => mapTimeseriesRow(r));
  return fillTrendRange(days, mapped);
}

export async function apiGetActivityFeed(): Promise<ActivityFeedItem[]> {
  const params = new URLSearchParams({
    page: '1',
    page_size: '12',
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const page = await apiFetch<ApplicantPage>(`/v1/applicants?${params.toString()}`);
  return (page.items ?? []).map(row => {
    const name = row.full_name?.trim() || 'Applicant';
    const st = row.verification_status;
    return {
      id: `${row.id}-${row.created_at}`,
      applicantId: row.id,
      applicantName: name,
      eventType: statusToEvent(st),
      description: statusDescription(st),
      country: DEFAULT_COUNTRY,
      createdAt: row.created_at,
    };
  });
}

export async function apiGetFunnel(days: number, workflowId?: string): Promise<DashboardFunnelResponse> {
  const q = new URLSearchParams({ days: String(days) });
  if (workflowId) q.set('workflow_id', workflowId);
  return apiFetch<DashboardFunnelResponse>(`/v1/dashboard/stats/funnel?${q.toString()}`);
}

export async function apiGetDocumentStats(): Promise<DashboardDocumentStatsResponse> {
  return apiFetch<DashboardDocumentStatsResponse>('/v1/dashboard/stats/documents');
}
