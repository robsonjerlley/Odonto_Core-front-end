import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  commercialService,
  type DealCreateDTO,
  type ApplyDiscountDTO,
  type CloseDealDTO,
} from './commercial.service'
import type { Deal, DealDetail } from '@/types/models'

const dealTicketKey = (ticketId: string) => ['deal-ticket', ticketId] as const
const dealDetailKey = (id: string) => ['deal-detail', id] as const

export function useDealForTicket(ticketId: string) {
  return useQuery<Deal | null>({
    queryKey: dealTicketKey(ticketId),
    queryFn: () => commercialService.findByTicket(ticketId),
    enabled: !!ticketId,
  })
}

export function useDealDetail(id: string) {
  return useQuery<DealDetail>({
    queryKey: dealDetailKey(id),
    queryFn: () => commercialService.getDealWithHistory(id),
    enabled: !!id,
  })
}

export function useCreateDeal(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: DealCreateDTO) => commercialService.createDeal(ticketId, dto),
    onSuccess: (deal) => {
      qc.setQueryData(dealTicketKey(ticketId), deal)
      qc.invalidateQueries({ queryKey: dealDetailKey(deal.id) })
    },
  })
}

export function useUpdateDeal(dealId: string, ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: DealCreateDTO) => commercialService.updateDeal(dealId, dto),
    onSuccess: (deal) => {
      qc.setQueryData(dealTicketKey(ticketId), deal)
      qc.invalidateQueries({ queryKey: dealDetailKey(dealId) })
    },
  })
}

export function useApplyDiscount(dealId: string, ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ApplyDiscountDTO) => commercialService.applyDiscount(dealId, dto),
    onSuccess: (deal) => {
      qc.setQueryData(dealTicketKey(ticketId), deal)
      qc.invalidateQueries({ queryKey: dealDetailKey(dealId) })
    },
  })
}

export function useCloseDeal(dealId: string, ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CloseDealDTO) => commercialService.closeDeal(dealId, dto),
    onSuccess: (deal) => {
      qc.setQueryData(dealTicketKey(ticketId), deal)
      qc.invalidateQueries({ queryKey: dealDetailKey(dealId) })
    },
  })
}
