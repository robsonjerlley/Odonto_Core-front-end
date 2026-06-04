import api from '@/lib/api'
import type { Customer, LeadTicket, ContactLog, Page } from '@/types/models'
import type { CustomerSource, AdsChannel, Sector, TicketStatus, ContactChannel } from '@/types/enums'

export interface CustomerCreateDTO {
  name: string
  cpf?: string
  phone: string
  phone2?: string
  email?: string
  initialNote?: string
  source: CustomerSource
  adChannel?: AdsChannel
  adCampaign?: string
  referredBy?: string
  channel?: ContactChannel   // canal do ContactLog inicial (quando há initialNote)
}

export interface CustomerUpdateDTO {
  id: string
  name: string
  cpf?: string        // opcional (US-FUND-01) — só obrigatório na formalização do agendamento
  phone: string
  phone2?: string
  email?: string
}

export interface TicketCreateDTO {
  customerId: string
  currentSector: Sector
  assignedTo?: string
  scheduledAt?: string
}

export interface TicketChangeStatusDTO {
  status: TicketStatus
  returnScheduledAt?: string
  lossReason?: string
}

export interface ContactLogCreateDTO {
  ticketId: string
  channel: ContactChannel
  note: string
  occurredAt: string
}

export const funnelService = {
  findAllCustomers: () =>
    api.get<Page<Customer>>('/api/v1/customers').then((r) => r.data.content),

  findCustomerById: (id: string) =>
    api.get<Customer>(`/api/v1/customers/${id}`).then((r) => r.data),

  findCustomerByCpf: (cpf: string) =>
    api.get<Customer>(`/api/v1/customers/cpf/${cpf}`).then((r) => r.data),

  createCustomer: (dto: CustomerCreateDTO) =>
    api.post<Customer>('/api/v1/customers', dto).then((r) => r.data),

  updateCustomer: (id: string, dto: CustomerUpdateDTO) =>
    api.patch<Customer>(`/api/v1/customers/${id}`, dto).then((r) => r.data),

  removeCustomer: (id: string) =>
    api.delete(`/api/v1/customers/${id}`),

  findAllTickets: () =>
    api.get<Page<LeadTicket>>('/api/v1/tickets').then((r) => r.data.content),

  findTicketById: (id: string) =>
    api.get<LeadTicket>(`/api/v1/tickets/${id}`).then((r) => r.data),

  findTicketsByCustomer: (customerId: string) =>
    api.get<Page<LeadTicket>>('/api/v1/tickets', { params: { customerId } }).then((r) => r.data.content),

  createTicket: (dto: TicketCreateDTO) =>
    api.post<LeadTicket>('/api/v1/tickets', dto).then((r) => r.data),

  changeTicketStatus: (id: string, dto: TicketChangeStatusDTO) =>
    api.patch<LeadTicket>(`/api/v1/tickets/${id}/status`, dto).then((r) => r.data),

  findContactLogsByTicket: (ticketId: string) =>
    api.get<Page<ContactLog>>('/api/v1/contact-logs', { params: { ticketId } }).then((r) => r.data.content),

  createContactLog: (dto: ContactLogCreateDTO) =>
    api.post<ContactLog>('/api/v1/contact-logs', dto).then((r) => r.data),
}
