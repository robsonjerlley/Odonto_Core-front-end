import { z } from 'zod'

/** `datetime-local` devolve "YYYY-MM-DDTHH:mm". Rejeita vazio e data no passado. */
const futureDateTime = z
  .string()
  .min(1, 'Informe a data e a hora')
  .refine((v) => new Date(v).getTime() > Date.now() - 60_000, {
    message: 'A data não pode estar no passado',
  })

export const scheduleSchema = z.object({
  scheduledAt: futureDateTime,
  assignedTo: z.string().optional(),
  /** opt-in: planejar as N sessões de uma vez. */
  planAll: z.boolean().optional(),
  /** intervalo em dias entre sessões quando `planAll`. */
  intervalDays: z.coerce.number().int().min(1).max(90).optional(),
})
export type ScheduleFormInput = z.input<typeof scheduleSchema>
export type ScheduleFormData = z.output<typeof scheduleSchema>

export const rescheduleSchema = z.object({
  scheduledAt: futureDateTime,
})
export type RescheduleFormData = z.output<typeof rescheduleSchema>

export const cancelSchema = z.object({
  cancelReason: z.string().trim().min(1, 'Informe o motivo do cancelamento'),
})
export type CancelFormData = z.output<typeof cancelSchema>

export const reassignSchema = z.object({
  assignedTo: z.string().min(1, 'Selecione o profissional'),
})
export type ReassignFormData = z.output<typeof reassignSchema>
