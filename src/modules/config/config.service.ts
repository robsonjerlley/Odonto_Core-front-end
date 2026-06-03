import api from '@/lib/api'
import type { Sector, Role, AdsChannel } from '@/types/enums'

// Backend RecycleConfigRequestDTO aceita apenas afterDays
export interface RecycleConfigDTO {
  afterDays: number
}

export interface BonusConfigDTO {
  sector: Sector
  role: Role
  metricKey: string
  bonusPct: number
  targetValue?: number
  periodRef: string
}

export interface AdsInvestmentDTO {
  channel: AdsChannel
  campaign?: string
  amount: number
  periodStart: string
  periodEnd: string
}

export const configService = {
  setRecycleConfig: (dto: RecycleConfigDTO) =>
    api.post('/api/v1/config/recycle', dto).then((r) => r.data),

  setBonusConfig: (dto: BonusConfigDTO) =>
    api.post('/api/v1/config/bonus', dto).then((r) => r.data),

  registerAdsInvestment: (dto: AdsInvestmentDTO) =>
    api.post('/api/v1/config/ads-investment', dto).then((r) => r.data),
}
