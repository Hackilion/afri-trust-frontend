import type { DashboardKpis, TrendDataPoint, ActivityFeedItem } from '../types';

export const mockKpis: DashboardKpis = {
  totalApplicants: 25,
  verified: 10,
  pending: 6,
  rejected: 4,
  needsReview: 4,
  averageVerificationTimeHours: 18.4,
  approvalRate: 0.71,
  weekOverWeekGrowth: 12.5,
  verificationsToday: 8,
  byTier: [
    { tierProfileId: 'TP-001', tierProfileName: 'KYC Lite', count: 10, approvalRate: 0.80 },
    { tierProfileId: 'TP-002', tierProfileName: 'Standard KYC', count: 12, approvalRate: 0.67 },
    { tierProfileId: 'TP-003', tierProfileName: 'Enhanced Due Diligence', count: 3, approvalRate: 0.50 },
  ],
  byWorkflow: [
    { workflowId: 'WF-001', workflowName: 'Retail Consumer Onboarding', count: 18, approvalRate: 0.78, avgTimeHours: 14.2 },
    { workflowId: 'WF-002', workflowName: 'High-Value Account (EDD)', count: 7, approvalRate: 0.57, avgTimeHours: 28.6 },
  ],
};

function generateTrendData(): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const base = 2 + Math.floor(Math.random() * 4);
    data.push({
      date: d.toISOString().split('T')[0],
      submitted: base + Math.floor(Math.random() * 3),
      verified: Math.max(0, base - 1 + Math.floor(Math.random() * 2)),
      rejected: Math.floor(Math.random() * 2),
    });
  }
  return data;
}

export const mockTrendData = generateTrendData();

export const mockActivityFeed: ActivityFeedItem[] = [
  { id: 'AF-001', applicantId: 'APL-000025', applicantName: 'Precious Okonkwo', eventType: 'submitted', description: 'New application submitted', country: 'NG', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'AF-002', applicantId: 'APL-000023', applicantName: 'Adaeze Obi', eventType: 'approved', description: 'Application approved', country: 'NG', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'AF-003', applicantId: 'APL-000022', applicantName: 'Nadia El-Sayed', eventType: 'status_changed', description: 'Flagged for manual review — adverse media', country: 'EG', createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: 'AF-004', applicantId: 'APL-000019', applicantName: 'Zanele Mokoena', eventType: 'submitted', description: 'New application submitted', country: 'ZA', createdAt: new Date(Date.now() - 18000000).toISOString() },
  { id: 'AF-005', applicantId: 'APL-000015', applicantName: 'Fatima Diallo', eventType: 'submitted', description: 'New application submitted', country: 'SN', createdAt: new Date(Date.now() - 21600000).toISOString() },
  { id: 'AF-006', applicantId: 'APL-000018', applicantName: 'Brian Otieno', eventType: 'rejected', description: 'Application rejected — expired document', country: 'KE', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'AF-007', applicantId: 'APL-000017', applicantName: 'Akosua Darko', eventType: 'status_changed', description: 'Flagged for review — age discrepancy', country: 'GH', createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString() },
  { id: 'AF-008', applicantId: 'APL-000014', applicantName: 'Thabo Nkosi', eventType: 'approved', description: 'Application approved', country: 'ZA', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];
