import api from '@/lib/api'
import type { Customer, LeadTicket, ContactLog } from '@/types/models'
import type { CustomerSource, AdsChannel, Sector, TicketStatus, ContactChannel } from '@/types/enums'

export interface CustomerCreateDTO {
  name: string
  cpf: string
  phone: string
  email?: string
  source: CustomerSource
  adChannel?: AdsChannel
  adCampaign?: string
  referredBy?: string
}

export interface CustomerUpdateDTO {
  name?: string
  phone?: string
  email?: string
  adCampaign?: string
}

export interface TicketCreateDTO {
  customerId: string
  currentSector: Sector
  assignedTo?: string
  scheduledAt?: string
}

export interface TicketChangeStatusDTO {
  status: TicketStatus
}

export interface ContactLogCreateDTO {
  ticketId: string
  channel: ContactChannel
  note: string
  occurredAt: string
}

export const funnelService = {
  findAllCustomers: () =>
    api.get<Customer[]>('/api/v1/customers').then((r) => r.data),

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
    api.get<LeadTicket[]>('/api/v1/tickets').then((r) => r.data),

  findTicketById: (id: string) =>
    api.get<LeadTicket>(`/api/v1/tickets/${id}`).then((r) => r.data),

  findTicketsByCustomer: (customerId: string) =>
    api.get<LeadTicket[]>(`/api/v1/tickets/findByCustomer/${customerId}`).then((r) => r.data),

  createTicket: (dto: TicketCreateDTO) =>
    api.post<LeadTicket>('/api/v1/tickets', dto).then((r) => r.data),

  changeTicketStatus: (id: string, dto: TicketChangeStatusDTO) =>
    api.patch<LeadTicket>(`/api/v1/tickets/${id}/status`, dto).then((r) => r.data),

  removeTicket: (id: string) =>
    api.delete(`/api/v1/tickets/${id}`),

  findContactLogsByTicket: (ticketId: string) =>
    api.get<ContactLog[]>(`/api/v1/contact-logs/findByTicketId/${ticketId}`).then((r) => r.data),

  createContactLog: (dto: ContactLogCreateDTO) =>
    api.post<ContactLog>('/api/v1/contact-logs', dto).then((r) => r.data),

  removeContactLog: (id: string) =>
    api.delete(`/api/v1/contact-logs/${id}`),
}
