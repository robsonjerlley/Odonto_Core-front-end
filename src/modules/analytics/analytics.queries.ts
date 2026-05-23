import { useQuery } from '@tanstack/react-query'
import { analyticsService, type AnalyticsPeriod } from './analytics.service'
import type { AdsChannel, Sector } from '@/types/enums'

export function useDashboard(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['analytics-dashboard', period.startDate, period.endDate],
    queryFn: () => analyticsService.getDashboard(period),
  })
}

export function useAdsRoi(channel: AdsChannel | '', period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['analytics-ads-roi', channel, period.startDate, period.endDate],
    queryFn: () => analyticsService.getAdsRoi(channel as AdsChannel, period),
    enabled: !!channel,
  })
}

export function useConversion(sector: Sector | '', period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['analytics-conversion', sector, period.startDate, period.endDate],
    queryFn: () => analyticsService.getConversion(sector as Sector, period),
    enabled: !!sector,
  })
}

export function useUserPerformance(userId: string, period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['analytics-user-performance', userId, period.startDate, period.endDate],
    queryFn: () => analyticsService.getUserPerformance(userId, period),
    enabled: !!userId,
  })
}

export function useBonus(userId: string, periodRef: string) {
  return useQuery({
    queryKey: ['analytics-bonus', userId, periodRef],
    queryFn: () => analyticsService.getBonus(userId, periodRef),
    enabled: !!userId && !!periodRef,
  })
}
