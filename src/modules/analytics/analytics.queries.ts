import { useQuery } from '@tanstack/react-query'
import { analyticsService, type AnalyticsPeriod } from './analytics.service'
import type { Sector } from '@/types/enums'

export function useDashboard(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['analytics-dashboard', period.from, period.to],
    queryFn: () => analyticsService.getDashboard(period),
  })
}

export function useConversion(sector: Sector | '', period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['analytics-conversion', sector, period.from, period.to],
    queryFn: () => analyticsService.getConversion(sector as Sector, period),
    enabled: !!sector,
  })
}

export function useUserPerformance(userId: string, period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['analytics-user-performance', userId, period.from, period.to],
    queryFn: () => analyticsService.getUserPerformance(userId, period),
    enabled: !!userId,
  })
}
