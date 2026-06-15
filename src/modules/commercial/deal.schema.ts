import { z } from 'zod'
import { PaymentMethod } from '@/types/enums'

export const procedureSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  code: z.string().optional(),
  tableValue: z.coerce.number().positive('Valor deve ser positivo'),
  quantity: z.coerce.number().int().min(1, 'Mínimo 1'),
  note: z.string().optional(),
})

export const dealFormSchema = z.object({
  procedures: z.array(procedureSchema).min(1, 'Adicione pelo menos um procedimento'),
})

export const discountSchema = z.object({
  discountPct: z.coerce
    .number()
    .min(0.01, 'Informe um desconto')
    .max(100, 'Máximo 100%'),
})

export const closeDealSchema = z
  .object({
    paymentMethod: z.enum(
      Object.values(PaymentMethod) as [PaymentMethod, ...PaymentMethod[]],
      { message: 'Selecione a forma de pagamento' },
    ),
    // Apenas visual — não persiste no backend (sem módulo financeiro ainda).
    installments: z.coerce
      .number()
      .int()
      .min(2, 'Mínimo 2 parcelas')
      .max(24, 'Máximo 24 parcelas')
      .optional(),
  })
  .refine(
    (d) => d.paymentMethod !== PaymentMethod.INSTALLMENT || d.installments != null,
    { message: 'Informe o número de parcelas', path: ['installments'] },
  )

export type DealFormInput = z.input<typeof dealFormSchema>
export type DealFormData = z.output<typeof dealFormSchema>
export type DiscountFormInput = z.input<typeof discountSchema>
export type DiscountFormData = z.output<typeof discountSchema>
export type CloseDealFormInput = z.input<typeof closeDealSchema>
export type CloseDealFormData = z.output<typeof closeDealSchema>
