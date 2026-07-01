import { z } from 'zod'

export const procedureSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  code: z.string().optional(),
  defaultPrice: z.coerce.number({ error: 'Informe o valor' }).positive('Valor deve ser positivo'),
  active: z.boolean().optional(),
})

export type ProcedureFormInput = z.input<typeof procedureSchema>
export type ProcedureFormData = z.output<typeof procedureSchema>
