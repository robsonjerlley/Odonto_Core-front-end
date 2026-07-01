import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { installmentService, type PayDTO } from './installment.service'
import type { Installment, CashflowMonth } from '@/types/models'
import type { PaymentStatus } from '@/types/enums'

export const INSTALLMENTS_KEY = ['installments'] as const

const monthKey = (month: string, status?: PaymentStatus) =>
  ['installments', 'month', month, status ?? 'ALL'] as const
const customerKey = (customerId: string) => ['installments', 'customer', customerId] as const
const cashflowKey = (from: string, to: string) => ['installments', 'cashflow', from, to] as const

export function useInstallmentsByMonth(month: string, status?: PaymentStatus, enabled = true) {
  return useQuery<Installment[]>({
    queryKey: monthKey(month, status),
    queryFn: () => installmentService.findByMonth(month, status),
    enabled,
  })
}

export function useInstallmentsByCustomer(customerId: string | undefined, enabled = true) {
  return useQuery<Installment[]>({
    queryKey: customerKey(customerId ?? ''),
    queryFn: () => installmentService.findByCustomer(customerId!),
    enabled: enabled && !!customerId,
  })
}

export function useCashflow(from: string, to: string, enabled = true) {
  return useQuery<CashflowMonth[]>({
    queryKey: cashflowKey(from, to),
    queryFn: () => installmentService.cashflow(from, to),
    enabled,
  })
}

function useInvalidateInstallments() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: INSTALLMENTS_KEY })
}

export function usePayInstallment() {
  const invalidate = useInvalidateInstallments()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PayDTO }) => installmentService.pay(id, dto),
    onSuccess: invalidate,
  })
}

export function useUnpayInstallment() {
  const invalidate = useInvalidateInstallments()
  return useMutation({
    mutationFn: (id: string) => installmentService.unpay(id),
    onSuccess: invalidate,
  })
}
