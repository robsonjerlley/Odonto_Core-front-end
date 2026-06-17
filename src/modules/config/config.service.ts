import api from '@/lib/api'
import type { Sector, Role, AdsChannel } from '@/types/enums'
import type { RecycleConfigResponse, BonusConfigResponse, AdsInvestmentResponse } from '@/types/models'

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

  // GET — leitura da config vigente (§7.7). Retorna 200 + null quando sem config (ADR-020/M1, v1.9).
  getRecycleConfig: () =>
    api.get<RecycleConfigResponse | null>('/api/v1/config/recycle').then((r) => r.data),

  getBonusConfigs: (sector: Sector) =>
    api.get<BonusConfigResponse[]>('/api/v1/config/bonus', { params: { sector } }).then((r) => r.data),

  getAdsInvestments: (channel: AdsChannel) =>
    api.get<AdsInvestmentResponse[]>('/api/v1/config/ads-investment', { params: { channel } }).then((r) => r.data),
}
