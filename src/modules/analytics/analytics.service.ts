import api from '@/lib/api'
import type {
  GlobalDashBoardResultDTO,
  StageConversionResultDTO,
  SectorDropOffResultDTO,
  UserPerformanceResultDTO,
} from '@/types/models'
import type { Sector } from '@/types/enums'

export interface AnalyticsPeriod {
  from: string
  to: string
}

export const analyticsService = {
  getDashboard: (period: AnalyticsPeriod) =>
    api
      .get<GlobalDashBoardResultDTO>('/api/v1/analytics/dashboard', { params: period })
      .then((r) => r.data),

  getConversion: (sector: Sector, period: AnalyticsPeriod) =>
    api
      .get<StageConversionResultDTO>('/api/v1/analytics/conversion', {
        params: { sector, ...period },
      })
      .then((r) => r.data),

  getDropOff: (period: AnalyticsPeriod) =>
    api
      .get<SectorDropOffResultDTO[]>('/api/v1/analytics/dropoff', { params: period })
      .then((r) => r.data),

  getUserPerformance: (userId: string, period: AnalyticsPeriod) =>
    api
      .get<UserPerformanceResultDTO>(`/api/v1/analytics/user-performance/${userId}`, {
        params: period,
      })
      .then((r) => r.data),
}
