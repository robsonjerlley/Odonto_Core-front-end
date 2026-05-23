import { z } from 'zod'
import { Sector } from '@/types/enums'

export const ticketSchema = z.object({
  customerId: z.string().uuid('Selecione um cliente'),
  currentSector: z.enum(Object.values(Sector) as [Sector, ...Sector[]]),
  assignedTo: z.string().uuid('ID inválido').or(z.literal('')).optional(),
  scheduledAt: z.string().optional(),
})

export type TicketFormData = z.infer<typeof ticketSchema>
