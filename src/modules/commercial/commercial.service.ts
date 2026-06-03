import api from '@/lib/api'
import type { Deal, DealDetail } from '@/types/models'
import type { PaymentMethod } from '@/types/enums'

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
  paymentMethod: PaymentMethod
}

export const commercialService = {
  findByTicket: async (ticketId: string): Promise<Deal | null> => {
    const r = await api.get<Deal>(`/api/v1/deals/ticketId/${ticketId}`)
    return r.status === 204 || !r.data ? null : r.data
  },

  createDeal: (ticketId: string, dto: DealCreateDTO) =>
    api.post<Deal>(`/api/v1/deals/${ticketId}`, dto).then((r) => r.data),

  updateDeal: (id: string, dto: DealCreateDTO) =>
    api.patch<Deal>(`/api/v1/deals/${id}`, dto).then((r) => r.data),

  applyDiscount: (id: string, dto: ApplyDiscountDTO) =>
    api.patch<Deal>(`/api/v1/deals/${id}/discount`, dto).then((r) => r.data),

  closeDeal: (id: string, dto: CloseDealDTO) =>
    api.patch<Deal>(`/api/v1/deals/${id}/status`, dto).then((r) => r.data),

  getDealWithHistory: (id: string) =>
    api.get<DealDetail>(`/api/v1/deals/${id}/dealHistory`).then((r) => r.data),
}
