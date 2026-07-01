import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertTriangle, CalendarDays, CalendarPlus, Wallet, ArrowRight, Sparkles, type LucideIcon,
} from 'lucide-react'
import { useDayAgenda, useAwaitingAppointments } from '@/modules/appointment/appointment.queries'
import { useExecutors } from '@/modules/appointment/useExecutors'
import AppointmentRow from '@/modules/appointment/AppointmentRow'
import ScheduleSheet from '@/modules/appointment/ScheduleSheet'
import { useInstallmentsByMonth } from '@/modules/financial/installment.queries'
import InstallmentRow from '@/modules/financial/InstallmentRow'
import type { Appointment } from '@/types/models'
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_TYPE_DOT } from '@/lib/labels'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'
import { todayBrasiliaISO, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ─── Section wrapper ────────────────────────────────────────────────────────────

interface SectionProps {
  icon: LucideIcon
  title: string
  count: number
  accent: string
  to?: string
  children: ReactNode
}

function Section({ icon: Icon, title, count, accent, to, children }: SectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn('size-4', accent)} />
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">{count}</span>
        {to && (
          <Link to={to} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            ver tudo <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function AwaitingRow({ appointment, onSchedule }: { appointment: Appointment; onSchedule: (a: Appointment) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40">
      <span className={cn('size-2 shrink-0 rounded-full', APPOINTMENT_TYPE_DOT[appointment.type])} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{appointment.customerName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {APPOINTMENT_TYPE_LABELS[appointment.type]} · {appointment.procedureName}
        </p>
      </div>
      <Button size="sm" className="min-h-9 shrink-0" onClick={() => onSchedule(appointment)}>
        <CalendarPlus className="size-3.5" /> Agendar
      </Button>
    </div>
  )
}

// ─── Home Modo Operação ──────────────────────────────────────────────────────────

export default function OperationHome() {
  const user = useAuthStore((s) => s.user)
  const canAppt = usePermission('APPOINTMENT', 'READ')
  const canInst = usePermission('INSTALLMENT', 'READ')
  const { executors } = useExecutors()
  const executorName = useMemo(() => new Map(executors.map((e) => [e.id, e.name])), [executors])

  const [scheduleTarget, setScheduleTarget] = useState<Appointment | null>(null)

  const today = todayBrasiliaISO()
  const agenda = useDayAgenda(user?.id, `${today}T00:00:00`, `${today}T23:59:59`, canAppt)
  const awaiting = useAwaitingAppointments(canAppt)
  const month = format(new Date(), 'yyyy-MM')
  const installments = useInstallmentsByMonth(month, 'EXPECTED', canInst)

  const [now] = useState(() => Date.now())

  const scheduled = useMemo(
    () => (agenda.data ?? []).filter((a) => a.status === 'SCHEDULED')
      .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '')),
    [agenda.data],
  )
  const overdue = scheduled.filter((a) => a.scheduledAt && new Date(a.scheduledAt).getTime() < now)
  const upcoming = scheduled.filter((a) => !a.scheduledAt || new Date(a.scheduledAt).getTime() >= now)
  const toSchedule = awaiting.data ?? []
  const overduePayments = useMemo(
    () => (installments.data ?? []).filter((i) => i.overdue).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [installments.data],
  )

  const overdueCount = overdue.length + overduePayments.length
  const todayCount = upcoming.length
  const loading = (canAppt && agenda.isLoading) || (canInst && installments.isLoading)

  const everythingEmpty =
    overdue.length === 0 && upcoming.length === 0 && toSchedule.length === 0 && overduePayments.length === 0

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Resumo do dia */}
      <div>
        <h1 className="text-2xl font-semibold">
          Olá, {user?.name?.split(' ')[0] ?? ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground capitalize">
          {format(new Date(), "EEEE',' dd 'de' MMMM", { locale: ptBR })}
          {!loading && (
            <span className="ml-1 normal-case">
              · {overdueCount > 0
                ? <span className="font-medium text-rose-600 dark:text-rose-400">{overdueCount} atrasado{overdueCount > 1 ? 's' : ''}</span>
                : 'nada atrasado'} · {todayCount} para hoje
            </span>
          )}
        </p>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/40" />)}
        </div>
      )}

      {!loading && everythingEmpty && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Sparkles className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-2 font-medium">Tudo em dia ✨</p>
          <p className="mt-1 text-sm text-muted-foreground">Nenhuma pendência no momento.</p>
        </div>
      )}

      {!loading && overdue.length > 0 && (
        <Section icon={AlertTriangle} title="Atrasado" count={overdue.length} accent="text-rose-500" to="/agenda">
          {overdue.map((a) => (
            <AppointmentRow key={a.id} appointment={a} executorName={executorName.get(a.assignedTo)} overdue />
          ))}
        </Section>
      )}

      {!loading && upcoming.length > 0 && (
        <Section icon={CalendarDays} title="Hoje" count={upcoming.length} accent="text-orange-500" to="/agenda">
          {upcoming.map((a) => (
            <AppointmentRow key={a.id} appointment={a} executorName={executorName.get(a.assignedTo)} />
          ))}
        </Section>
      )}

      {!loading && toSchedule.length > 0 && (
        <Section icon={CalendarPlus} title="A agendar" count={toSchedule.length} accent="text-blue-500" to="/agenda">
          {toSchedule.slice(0, 5).map((a) => (
            <AwaitingRow key={a.id} appointment={a} onSchedule={setScheduleTarget} />
          ))}
        </Section>
      )}

      {!loading && overduePayments.length > 0 && (
        <Section icon={Wallet} title="Pagamentos pendentes" count={overduePayments.length} accent="text-amber-500" to="/financeiro">
          {overduePayments.slice(0, 5).map((i) => (
            <InstallmentRow key={i.id} installment={i} />
          ))}
        </Section>
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
