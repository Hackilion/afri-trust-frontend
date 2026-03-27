import { mockKpis, mockTrendData, mockActivityFeed } from '../mocks/dashboardStats';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

export async function getDashboardKpis() {
  await delay();
  return { ...mockKpis };
}

export async function getTrendData(days: 7 | 30 | 90 = 30) {
  await delay(300);
  return mockTrendData.slice(-days);
}

export async function getActivityFeed() {
  await delay(200);
  return [...mockActivityFeed];
}
