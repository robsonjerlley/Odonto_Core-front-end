import { z } from 'zod'

export const paySchema = z.object({
  paidAmount: z.number({ error: 'Informe o valor recebido' }).positive('O valor deve ser maior que zero'),
  paidAt: z.string().min(1, 'Informe a data do pagamento'),
})
export type PayFormInput = z.input<typeof paySchema>
export type PayFormData = z.output<typeof paySchema>
