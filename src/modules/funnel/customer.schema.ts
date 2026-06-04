import { z } from 'zod'
import { CustomerSource, AdsChannel, ContactChannel } from '@/types/enums'

export const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  // CPF é opcional (US-FUND-01) — quando informado, deve ter 11 dígitos.
  // Obrigatório só na formalização do agendamento (validado no backend).
  cpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos')
    .or(z.literal(''))
    .optional(),
  phone: z.string().min(10, 'Telefone inválido'),
  phone2: z.string().optional(),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  initialNote: z.string().optional(),
  channel: z
    .enum(Object.values(ContactChannel) as [ContactChannel, ...ContactChannel[]])
    .optional(),
  source: z.enum(Object.values(CustomerSource) as [CustomerSource, ...CustomerSource[]]),
  adChannel: z
    .enum(Object.values(AdsChannel) as [AdsChannel, ...AdsChannel[]])
    .optional(),
  adCampaign: z.string().optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>
