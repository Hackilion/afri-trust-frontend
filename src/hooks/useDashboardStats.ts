import { useQuery } from '@tanstack/react-query';
import {
  getActivityFeed,
  getDashboardKpis,
  getDocumentReportStats,
  getFunnelStats,
  getTrendData,
} from '../services/dashboardService';

export function useDashboardKpis() {
  return useQuery({ queryKey: ['dashboard-kpis'], queryFn: getDashboardKpis });
}

export function useTrendData(days: 7 | 30 | 90 = 30) {
  return useQuery({ queryKey: ['trend-data', days], queryFn: () => getTrendData(days) });
}

export function useActivityFeed() {
  return useQuery({ queryKey: ['activity-feed'], queryFn: getActivityFeed });
}

export function useFunnelStats(days: number, workflowId?: string) {
  return useQuery({
    queryKey: ['dashboard-funnel', days, workflowId ?? ''],
    queryFn: () => getFunnelStats(days, workflowId),
  });
}

export function useDocumentReportStats() {
  return useQuery({ queryKey: ['dashboard-documents'], queryFn: getDocumentReportStats });
}
