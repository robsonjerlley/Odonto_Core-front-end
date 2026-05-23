import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { funnelService, type CustomerCreateDTO, type TicketCreateDTO, type ContactLogCreateDTO } from './funnel.service'
import type { Customer, LeadTicket, ContactLog } from '@/types/models'
import type { TicketStatus } from '@/types/enums'

export const CUSTOMERS_KEY = ['customers'] as const
export const TICKETS_KEY = ['tickets'] as const
const contactLogsKey = (ticketId: string) => ['contact-logs', ticketId] as const

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: CUSTOMERS_KEY,
    queryFn: funnelService.findAllCustomers,
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

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: TicketCreateDTO) => funnelService.createTicket(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  })
}

export function useChangeTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      funnelService.changeTicketStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  })
}

export function useRemoveTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => funnelService.removeTicket(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  })
}

export function useCreateContactLog(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ContactLogCreateDTO) => funnelService.createContactLog(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: contactLogsKey(ticketId) }),
  })
}

export function useRemoveContactLog(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => funnelService.removeContactLog(id),
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
