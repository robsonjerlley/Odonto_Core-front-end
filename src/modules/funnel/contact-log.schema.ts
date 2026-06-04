import { z } from 'zod'
import { ContactChannel } from '@/types/enums'

export const contactLogSchema = z.object({
  // Canal só é coletado na fase de contato (NEW/IN_CONTACT); depois é "Outro".
  channel: z
    .enum(Object.values(ContactChannel) as [ContactChannel, ...ContactChannel[]])
    .optional(),
  note: z.string().min(1, 'A observação é obrigatória'),
  // occurredAt é preenchido automaticamente com o horário de Brasília no submit.
})

export type ContactLogFormData = z.infer<typeof contactLogSchema>
