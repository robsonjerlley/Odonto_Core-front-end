import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { MoreVertical, Check, CalendarClock, UserCog, Ban } from 'lucide-react'
import {
  rescheduleSchema, cancelSchema, reassignSchema,
  type RescheduleFormData, type CancelFormData, type ReassignFormData,
} from './appointment.schema'
import {
  useCompleteAppointment, useRescheduleAppointment,
  useReassignAppointment, useCancelAppointment,
} from './appointment.queries'
import { useExecutors } from './useExecutors'
import type { Appointment } from '@/types/models'
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_TYPE_DOT } from '@/lib/labels'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

function toLocalDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

// ─── Remarcar ─────────────────────────────────────────────────────────────────

function RescheduleDialog({ appointment, open, onOpenChange }: {
  appointment: Appointment; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const reschedule = useRescheduleAppointment()
  const form = useForm<RescheduleFormData>({ resolver: zodResolver(rescheduleSchema) })

  async function onSubmit(data: RescheduleFormData) {
    try {
      await reschedule.mutateAsync({ id: appointment.id, dto: { scheduledAt: toLocalDateTime(data.scheduledAt) } })
      toast('Atendimento remarcado', 'success')
      onOpenChange(false)
    } catch { /* toast pelo interceptor */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Remarcar atendimento</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="scheduledAt" render={({ field }) => (
              <FormItem>
                <FormLabel>Nova data e hora *</FormLabel>
                <FormControl><Input type="datetime-local" max="2099-12-31T23:59" autoFocus {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={reschedule.isPending}>
                {reschedule.isPending ? 'Salvando...' : 'Remarcar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Reatribuir ────────────────────────────────────────────────────────────────

function ReassignDialog({ appointment, open, onOpenChange }: {
  appointment: Appointment; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const reassign = useReassignAppointment()
  const { executors } = useExecutors()
  const form = useForm<ReassignFormData>({
    resolver: zodResolver(reassignSchema),
    defaultValues: { assignedTo: appointment.assignedTo },
  })

  async function onSubmit(data: ReassignFormData) {
    try {
      await reassign.mutateAsync({ id: appointment.id, dto: { assignedTo: data.assignedTo } })
      toast('Executor reatribuído', 'success')
      onOpenChange(false)
    } catch { /* toast pelo interceptor */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Reatribuir executor</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="assignedTo" render={({ field }) => (
              <FormItem>
                <FormLabel>Profissional *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {executors.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={reassign.isPending}>
                {reassign.isPending ? 'Salvando...' : 'Reatribuir'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cancelar (destrutivo, motivo obrigatório) ──────────────────────────────────

function CancelDialog({ appointment, open, onOpenChange }: {
  appointment: Appointment; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const cancel = useCancelAppointment()
  const form = useForm<CancelFormData>({ resolver: zodResolver(cancelSchema), defaultValues: { cancelReason: '' } })

  async function onSubmit(data: CancelFormData) {
    try {
      await cancel.mutateAsync({ id: appointment.id, dto: { cancelReason: data.cancelReason } })
      toast('Atendimento cancelado', 'success')
      onOpenChange(false)
    } catch { /* toast pelo interceptor */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="text-destructive">Cancelar atendimento</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {appointment.customerName} · {appointment.procedureName}. Esta ação retira o atendimento da agenda.
            </p>
            <FormField control={form.control} name="cancelReason" render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo do cancelamento *</FormLabel>
                <FormControl><Textarea rows={3} autoFocus placeholder="Ex: paciente desmarcou" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
              <Button type="submit" variant="destructive" disabled={cancel.isPending}>
                {cancel.isPending ? 'Cancelando...' : 'Confirmar cancelamento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Linha da agenda ────────────────────────────────────────────────────────────

interface AppointmentRowProps {
  appointment: Appointment
  executorName?: string
  /** Realça a linha quando o atendimento já passou do horário e não teve desfecho. */
  overdue?: boolean
}

export default function AppointmentRow({ appointment, executorName, overdue }: AppointmentRowProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const complete = useCompleteAppointment()

  const time = appointment.scheduledAt ? format(new Date(appointment.scheduledAt), 'HH:mm') : '--:--'

  async function handleComplete() {
    try {
      await complete.mutateAsync(appointment.id)
      toast('Atendimento concluído', 'success')
    } catch { /* toast pelo interceptor */ }
  }

  return (
    <>
      <div className={cn(
        'flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40',
        overdue && 'border-rose-300 dark:border-rose-800',
      )}>
        <div className="flex w-12 shrink-0 flex-col items-center">
          <span className="text-sm font-semibold tabular-nums">{time}</span>
          <span className={cn('mt-1 size-2 rounded-full', APPOINTMENT_TYPE_DOT[appointment.type])} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{appointment.customerName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {APPOINTMENT_TYPE_LABELS[appointment.type]} · {appointment.procedureName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Sessão {appointment.sessionIndex}/{appointment.plannedSessions}
            {executorName && ` · ${executorName}`}
            {overdue && <span className="ml-1 font-medium text-rose-600 dark:text-rose-400">· Atrasado</span>}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" variant="outline" className="min-h-9" onClick={handleComplete} disabled={complete.isPending}>
            <Check className="size-3.5" />
            <span className="hidden sm:inline">Concluir</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-9" aria-label="Mais ações">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setRescheduleOpen(true)}>
                <CalendarClock /> Remarcar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setReassignOpen(true)}>
                <UserCog /> Reatribuir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setCancelOpen(true)}>
                <Ban /> Cancelar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <RescheduleDialog appointment={appointment} open={rescheduleOpen} onOpenChange={setRescheduleOpen} />
      <ReassignDialog appointment={appointment} open={reassignOpen} onOpenChange={setReassignOpen} />
      <CancelDialog appointment={appointment} open={cancelOpen} onOpenChange={setCancelOpen} />
    </>
  )
}
