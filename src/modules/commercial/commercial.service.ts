import api from '@/lib/api'
import type { Deal, DealDetail } from '@/types/models'

export interface DealProcedureInput {
  name: string
  code?: string
  tableValue: number
  quantity: number
  note?: string
}

export interface DealCreateDTO {
  procedures: DealProcedureInput[]
}

export interface ApplyDiscountDTO {
  discountPct: number
}

export interface CloseDealDTO {
  paymentMethod: string
}

export const commercialService = {
  createDeal: (ticketId: string, dto: DealCreateDTO) =>
    api.post<Deal>(`/api/v1/deal/${ticketId}`, dto).then((r) => r.data),

  updateDeal: (id: string, dto: DealCreateDTO) =>
    api.patch<Deal>(`/api/v1/deal/${id}`, dto).then((r) => r.data),

  applyDiscount: (id: string, dto: ApplyDiscountDTO) =>
    api.patch<Deal>(`/api/v1/deal/${id}/discount`, dto).then((r) => r.data),

  closeDeal: (id: string, dto: CloseDealDTO) =>
    api.patch<Deal>(`/api/v1/deal/${id}/closeDeal`, dto).then((r) => r.data),

  getDealWithHistory: (id: string) =>
    api.get<DealDetail>(`/api/v1/deal/${id}/dealHistory`).then((r) => r.data),
}
