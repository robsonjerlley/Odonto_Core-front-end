import { useMemo, useState } from 'react'
import { format, addDays, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarPlus, Sparkles } from 'lucide-react'
import { useAwaitingAppointments, useDayAgenda } from './appointment.queries'
import { useExecutors } from './useExecutors'
import AppointmentRow from './AppointmentRow'
import ScheduleSheet from './ScheduleSheet'
import type { Appointment } from '@/types/models'
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_TYPE_DOT } from '@/lib/labels'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type View = 'agenda' | 'awaiting'

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/40" />
      ))}
    </div>
  )
}

// ─── Linha "A agendar" ──────────────────────────────────────────────────────────

function AwaitingRow({ appointment, onSchedule }: { appointment: Appointment; onSchedule: (a: Appointment) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40">
      <span className={cn('size-2 shrink-0 rounded-full', APPOINTMENT_TYPE_DOT[appointment.type])} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{appointment.customerName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {APPOINTMENT_TYPE_LABELS[appointment.type]} · {appointment.procedureName} · Sessão {appointment.sessionIndex}/{appointment.plannedSessions}
        </p>
      </div>
      <Button size="sm" className="min-h-9 shrink-0" onClick={() => onSchedule(appointment)}>
        <CalendarPlus className="size-3.5" /> Agendar
      </Button>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const currentUser = useAuthStore((s) => s.user)
  const { executors, solo } = useExecutors()
  const executorName = useMemo(
    () => new Map(executors.map((e) => [e.id, e.name])),
    [executors],
  )

  const [view, setView] = useState<View>('agenda')
  const [day, setDay] = useState(() => new Date())
  const [executorId, setExecutorId] = useState<string | undefined>(currentUser?.id)
  const [scheduleTarget, setScheduleTarget] = useState<Appointment | null>(null)

  const dayStr = format(day, 'yyyy-MM-dd')
  const from = `${dayStr}T00:00:00`
  const to = `${dayStr}T23:59:59`

  const agenda = useDayAgenda(executorId, from, to, view === 'agenda')
  const awaiting = useAwaitingAppointments()

  const sortedAgenda = useMemo(
    () =>
      (agenda.data ?? [])
        .filter((a) => a.status === 'SCHEDULED')
        .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '')),
    [agenda.data],
  )

  const [now] = useState(() => Date.now())
  const awaitingCount = awaiting.data?.length ?? 0

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="text-sm text-muted-foreground">Atendimentos agendados e o que ainda falta marcar.</p>
      </div>

      {/* Segmented control */}
      <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-sm">
        <button
          onClick={() => setView('agenda')}
          className={cn('rounded-md px-3 py-1.5 font-medium transition-colors',
            view === 'agenda' ? 'bg-card shadow-sm' : 'text-muted-foreground')}
        >
          Agenda
        </button>
        <button
          onClick={() => setView('awaiting')}
          className={cn('rounded-md px-3 py-1.5 font-medium transition-colors',
            view === 'awaiting' ? 'bg-card shadow-sm' : 'text-muted-foreground')}
        >
          A agendar{awaitingCount > 0 && ` (${awaitingCount})`}
        </button>
      </div>

      {view === 'agenda' ? (
        <>
          {/* Navegador de data + executor */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-9" aria-label="Dia anterior"
                onClick={() => setDay((d) => addDays(d, -1))}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-40 text-center text-sm font-medium capitalize">
                {format(day, "EEE',' dd 'de' MMM", { locale: ptBR })}
              </span>
              <Button variant="outline" size="icon" className="size-9" aria-label="Próximo dia"
                onClick={() => setDay((d) => addDays(d, 1))}>
                <ChevronRight className="size-4" />
              </Button>
              {!isToday(day) && (
                <Button variant="ghost" size="sm" onClick={() => setDay(new Date())}>Hoje</Button>
              )}
            </div>

            {/* Filtro de executor — oculto quando clínica solo (ADR-003 §5). */}
            {!solo && executors.length > 1 && (
              <Select value={executorId} onValueChange={setExecutorId}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Executor" /></SelectTrigger>
                <SelectContent>
                  {executors.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {agenda.isLoading ? (
            <SkeletonRows />
          ) : agenda.isError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
              <p className="text-rose-700 dark:text-rose-300">Não foi possível carregar a agenda.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => agenda.refetch()}>Tentar de novo</Button>
            </div>
          ) : sortedAgenda.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Sparkles className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum atendimento para {format(day, "dd 'de' MMM", { locale: ptBR })}.
              </p>
              {awaitingCount > 0 && (
                <Button variant="link" size="sm" onClick={() => setView('awaiting')}>
                  Ver o que falta agendar →
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedAgenda.map((a) => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
                  executorName={executorName.get(a.assignedTo)}
                  overdue={!!a.scheduledAt && new Date(a.scheduledAt).getTime() < now}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {awaiting.isLoading ? (
            <SkeletonRows />
          ) : awaiting.isError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
              <p className="text-rose-700 dark:text-rose-300">Não foi possível carregar a worklist.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => awaiting.refetch()}>Tentar de novo</Button>
            </div>
          ) : awaitingCount === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Badge variant="outline" className="mb-2">Tudo agendado</Badge>
              <p className="text-sm text-muted-foreground">Nenhum atendimento aguardando agendamento ✨</p>
            </div>
          ) : (
            <div className="space-y-2">
              {awaiting.data!.map((a) => (
                <AwaitingRow key={a.id} appointment={a} onSchedule={setScheduleTarget} />
              ))}
            </div>
          )}
        </>
      )}

      <ScheduleSheet
        appointment={scheduleTarget}
        awaiting={awaiting.data}
        open={!!scheduleTarget}
        onOpenChange={(v) => !v && setScheduleTarget(null)}
      />
    </div>
  )
}
