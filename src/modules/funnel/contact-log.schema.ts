import { z } from 'zod'
import { ContactChannel } from '@/types/enums'

export const contactLogSchema = z.object({
  channel: z.enum(Object.values(ContactChannel) as [ContactChannel, ...ContactChannel[]]),
  note: z.string().min(1, 'Escreva uma observação'),
  occurredAt: z.string().min(1, 'Informe a data/hora'),
})

export type ContactLogFormData = z.infer<typeof contactLogSchema>
