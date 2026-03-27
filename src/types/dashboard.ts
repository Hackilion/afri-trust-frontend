import type { AfricanCountry } from './applicant';
import type { TimelineEventType } from './verification';

export interface TierBreakdown {
  tierProfileId: string;
  tierProfileName: string;
  count: number;
  approvalRate: number;
}

export interface WorkflowBreakdown {
  workflowId: string;
  workflowName: string;
  count: number;
  approvalRate: number;
  avgTimeHours: number;
}

export interface DashboardKpis {
  totalApplicants: number;
  verified: number;
  pending: number;
  rejected: number;
  needsReview: number;
  averageVerificationTimeHours: number;
  approvalRate: number;
  weekOverWeekGrowth: number;
  verificationsToday: number;
  byTier: TierBreakdown[];
  byWorkflow: WorkflowBreakdown[];
}

export interface TrendDataPoint {
  date: string;
  submitted: number;
  verified: number;
  rejected: number;
}

export interface ActivityFeedItem {
  id: string;
  applicantId: string;
  applicantName: string;
  eventType: TimelineEventType;
  description: string;
  country: AfricanCountry;
  createdAt: string;
}
