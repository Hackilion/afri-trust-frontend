import { useQuery } from '@tanstack/react-query';
import { getDashboardKpis, getTrendData, getActivityFeed } from '../services/dashboardService';

export function useDashboardKpis() {
  return useQuery({ queryKey: ['dashboard-kpis'], queryFn: getDashboardKpis });
}

export function useTrendData(days: 7 | 30 | 90 = 30) {
  return useQuery({ queryKey: ['trend-data', days], queryFn: () => getTrendData(days) });
}

export function useActivityFeed() {
  return useQuery({ queryKey: ['activity-feed'], queryFn: getActivityFeed });
}
