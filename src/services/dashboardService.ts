import { isLiveApi } from '../lib/apiConfig';
import { mockKpis, mockTrendData, mockActivityFeed } from '../mocks/dashboardStats';
import * as live from './dashboardLiveService';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

export async function getDashboardKpis() {
  if (isLiveApi()) return live.apiGetDashboardKpis();
  await delay();
  return { ...mockKpis };
}

export async function getTrendData(days: 7 | 30 | 90 = 30) {
  if (isLiveApi()) return live.apiGetTrendData(days);
  await delay(300);
  return mockTrendData.slice(-days);
}

export async function getActivityFeed() {
  if (isLiveApi()) return live.apiGetActivityFeed();
  await delay(200);
  return [...mockActivityFeed];
}

export async function getFunnelStats(days: number, workflowId?: string) {
  if (isLiveApi()) return live.apiGetFunnel(days, workflowId);
  await delay(250);
  return {
    period_days: days,
    funnel: {
      created: 120,
      started: 98,
      completed: 72,
      approved: 58,
      rejected: 14,
      drop_off_rate: 40,
    },
    by_step: [
      { step_order: 1, tier_name: 'Lite', completed: 90, in_progress: 8 },
      { step_order: 2, tier_name: 'Standard', completed: 76, in_progress: 12 },
    ],
  } satisfies live.DashboardFunnelResponse;
}

export async function getDocumentReportStats() {
  if (isLiveApi()) return live.apiGetDocumentStats();
  await delay(200);
  return {
    total_documents: 48,
    by_document_type: { passport: 22, national_id: 18, drivers_license: 8 },
    biometrics: {
      liveness: { total: 40, passed: 36, failed: 4, avg_score: 0.92 },
      face_match: { total: 38, passed: 35, failed: 3, avg_score: 0.88 },
    },
  } satisfies live.DashboardDocumentStatsResponse;
}
