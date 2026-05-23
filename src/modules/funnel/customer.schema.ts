import { z } from 'zod'
import { CustomerSource, AdsChannel } from '@/types/enums'

export const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z
    .string()
    .length(11, 'CPF deve ter 11 dígitos')
    .regex(/^\d+$/, 'Apenas números, sem pontos ou traços'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  source: z.enum(Object.values(CustomerSource) as [CustomerSource, ...CustomerSource[]]),
  adChannel: z
    .enum(Object.values(AdsChannel) as [AdsChannel, ...AdsChannel[]])
    .optional(),
  adCampaign: z.string().optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>
