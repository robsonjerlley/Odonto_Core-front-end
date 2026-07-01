import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, addDays } from 'date-fns'
import { scheduleSchema, type ScheduleFormInput, type ScheduleFormData } from './appointment.schema'
import { useScheduleAppointment, useScheduleBatch } from './appointment.queries'
import { useExecutors } from './useExecutors'
import type { Appointment } from '@/types/models'
import { APPOINTMENT_TYPE_LABELS } from '@/lib/labels'
import { toast } from '@/lib/toast'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ScheduleSheetProps {
  appointment: Appointment | null
  /** Lista completa de AWAITING_SCHEDULE — usada para achar as sessões irmãs (mesmo deal). */
  awaiting?: Appointment[]
  open: boolean
  onOpenChange: (v: boolean) => void
}

/** "YYYY-MM-DDTHH:mm" (input datetime-local) → LocalDateTime com segundos. */
function toLocalDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

export default function ScheduleSheet({ appointment, awaiting, open, onOpenChange }: ScheduleSheetProps) {
  const schedule = useScheduleAppointment()
  const batch = useScheduleBatch()
  const { executors, solo } = useExecutors()

  // Sessões irmãs ainda por agendar (mesmo deal), ordenadas por índice de sessão.
  const siblings = useMemo(() => {
    if (!appointment || !awaiting) return []
    return awaiting
      .filter((a) => a.dealId === appointment.dealId)
      .sort((a, b) => a.sessionIndex - b.sessionIndex)
  }, [appointment, awaiting])

  const canBatch = siblings.length > 1

  const form = useForm<ScheduleFormInput, unknown, ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      scheduledAt: '',
      assignedTo: appointment?.assignedTo ?? appointment?.evaluatorId ?? undefined,
      planAll: false,
      intervalDays: 7,
    },
  })

  // Re-sincroniza o executor default quando troca o appointment alvo.
  const planAll = useWatch({ control: form.control, name: 'planAll' })

  async function onSubmit(data: ScheduleFormData) {
    if (!appointment) return
    const assignedTo = data.assignedTo || undefined
    try {
      if (data.planAll && canBatch) {
        const start = new Date(data.scheduledAt)
        const interval = data.intervalDays ?? 7
        const items = siblings.map((s, i) => ({
          appointmentId: s.id,
          scheduledAt: toLocalDateTime(format(addDays(start, i * interval), "yyyy-MM-dd'T'HH:mm")),
          assignedTo,
        }))
        const result = await batch.mutateAsync(items)
        if (result.warnings.length > 0) {
          toast(`${siblings.length} sessões agendadas — ${result.warnings.length} com conflito de horário`, 'info')
        } else {
          toast(`${siblings.length} sessões agendadas`, 'success')
        }
      } else {
        await schedule.mutateAsync({
          id: appointment.id,
          dto: { scheduledAt: toLocalDateTime(data.scheduledAt), assignedTo },
        })
        toast('Atendimento agendado', 'success')
      }
      form.reset()
      onOpenChange(false)
    } catch {
      /* erro exibido via toast pelo interceptor; mantém o sheet aberto */
    }
  }

  if (!appointment) return null

  const pending = schedule.isPending || batch.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Agendar atendimento</SheetTitle>
          <SheetDescription>Defina a data e a hora. Os dados conhecidos já vêm preenchidos.</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-5">
          {/* Snapshot read-only */}
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{appointment.customerName}</span>
              <Badge variant="outline">{APPOINTMENT_TYPE_LABELS[appointment.type]}</Badge>
            </div>
            <p className="text-muted-foreground">{appointment.procedureName}</p>
            <p className="text-xs text-muted-foreground">
              Sessão {appointment.sessionIndex} de {appointment.plannedSessions}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e hora *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" max="2099-12-31T23:59" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!solo && executors.length > 0 && (
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissional</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o executor" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {executors.map((e) => (
                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {canBatch && (
                <div className="rounded-lg border p-3 space-y-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="size-4 accent-brand"
                      checked={!!planAll}
                      onChange={(e) => form.setValue('planAll', e.target.checked)}
                    />
                    Planejar as {siblings.length} sessões de uma vez
                  </label>
                  {planAll && (
                    <FormField
                      control={form.control}
                      name="intervalDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Intervalo entre sessões (dias)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={90}
                              {...field}
                              value={(field.value as number | string | undefined) ?? ''}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            A partir da 1ª data, no mesmo horário. Conflitos são avisos, não bloqueiam.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending
                  ? 'Agendando...'
                  : planAll && canBatch
                    ? `Agendar ${siblings.length} sessões`
                    : 'Agendar'}
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
