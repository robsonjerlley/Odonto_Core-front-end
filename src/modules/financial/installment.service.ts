import api from '@/lib/api'
import type { Installment, CashflowMonth, Page } from '@/types/models'
import type { PaymentStatus } from '@/types/enums'

export interface PayDTO {
  paidAmount: number
  paidAt: string          // "YYYY-MM-DD"
}

const BASE = '/api/v1/installments'

export const installmentService = {
  /** Parcelas de um mês (yyyy-MM). `status` opcional filtra EXPECTED/PAID. */
  findByMonth: (month: string, status?: PaymentStatus) =>
    api
      .get<Page<Installment>>(BASE, { params: { month, ...(status ? { status } : {}) } })
      .then((r) => r.data.content),

  /** Histórico de parcelas de um paciente (todos os meses). */
  findByCustomer: (customerId: string) =>
    api.get<Page<Installment>>(BASE, { params: { customerId } }).then((r) => r.data.content),

  /** Projeção de caixa por mês (from/to = yyyy-MM). */
  cashflow: (from: string, to: string) =>
    api.get<CashflowMonth[]>(`${BASE}/cashflow`, { params: { from, to } }).then((r) => r.data),

  pay: (id: string, dto: PayDTO) =>
    api.patch<Installment>(`${BASE}/${id}/pay`, dto).then((r) => r.data),

  /** 200 sem corpo — estornar. */
  unpay: (id: string) => api.patch<void>(`${BASE}/${id}/unpay`).then(() => undefined),
}
