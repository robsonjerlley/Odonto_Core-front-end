import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { funnelService, type CustomerCreateDTO, type CustomerUpdateDTO, type TicketCreateDTO, type ContactLogCreateDTO } from './funnel.service'
import type { Customer, LeadTicket, ContactLog } from '@/types/models'
import type { TicketStatus } from '@/types/enums'

export const CUSTOMERS_KEY = ['customers'] as const
export const TICKETS_KEY = ['tickets'] as const
const contactLogsKey = (ticketId: string) => ['contact-logs', ticketId] as const

export function useCustomers(enabled = true) {
  return useQuery<Customer[]>({
    queryKey: CUSTOMERS_KEY,
    queryFn: funnelService.findAllCustomers,
    enabled,
  })
}

export function useTickets() {
  return useQuery<LeadTicket[]>({
    queryKey: TICKETS_KEY,
    queryFn: funnelService.findAllTickets,
  })
}

export function useContactLogs(ticketId: string) {
  return useQuery<ContactLog[]>({
    queryKey: contactLogsKey(ticketId),
    queryFn: () => funnelService.findContactLogsByTicket(ticketId),
    enabled: !!ticketId,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CustomerCreateDTO) => funnelService.createCustomer(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  })
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CustomerUpdateDTO) => funnelService.updateCustomer(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: TicketCreateDTO) => funnelService.createTicket(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  })
}

interface ChangeStatusVars {
  id: string
  status: TicketStatus
  lossReason?: string
  returnScheduledAt?: string
}

export function useChangeTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, lossReason, returnScheduledAt }: ChangeStatusVars) =>
      funnelService.changeTicketStatus(id, { status, lossReason, returnScheduledAt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TICKETS_KEY })
      // Backend cria log automático em cada transição — invalida todos contact-logs
      qc.invalidateQueries({ queryKey: ['contact-logs'] })
    },
  })
}

export function useCreateContactLog(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ContactLogCreateDTO) => funnelService.createContactLog(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: contactLogsKey(ticketId) }),
  })
}

export function useRemoveCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => funnelService.removeCustomer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  })
}
