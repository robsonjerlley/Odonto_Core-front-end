import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Trophy, XCircle, CheckCircle2, CalendarClock,
  Phone, Stethoscope, Handshake, Clock, type LucideIcon,
} from 'lucide-react'
import { useContactLogs, useChangeTicketStatus } from './funnel.queries'
import { useDealForTicket, useCreateDeal } from '@/modules/commercial/commercial.queries'
import { dealFormSchema, type DealFormInput, type DealFormData } from '@/modules/commercial/deal.schema'
import ProcedureListEditor from '@/modules/commercial/ProcedureListEditor'
import AddContactLogDialog from './AddContactLogDialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'
import { availableTransitions } from './transitions'
import { TicketStatus } from '@/types/enums'
import type { LeadTicket, Customer } from '@/types/models'
import {
  SECTOR_LABELS, TICKET_STATUS_LABELS, TICKET_STATUS_COLOR,
  CONTACT_CHANNEL_LABELS,
} from '@/lib/labels'

// ─── Configuração visual por transição (destino) ──────────────────────────────

type BtnVariant = 'default' | 'destructive' | 'outline'

interface ActionCfg {
  label: (from: TicketStatus) => string
  icon: LucideIcon
  variant: BtnVariant
  className?: string
}

const ACTION_CFG: Partial<Record<TicketStatus, ActionCfg>> = {
  [TicketStatus.IN_CONTACT]: {
    label: () => 'Entrar em Contato',
    icon: Phone,
    variant: 'default',
  },
  [TicketStatus.SCHEDULED]: {
    label: (from) => from === TicketStatus.POST_PROCEDURE ? 'Agendar Retorno' : 'Agendar Consulta',
    icon: CalendarClock,
    variant: 'default',
  },
  [TicketStatus.IN_EVALUATION]: {
    label: () => 'Iniciar Avaliação',
    icon: Stethoscope,
    variant: 'default',
  },
  [TicketStatus.NEGOTIATION]: {
    label: () => 'Encaminhar p/ Negociação',
    icon: Handshake,
    variant: 'default',
  },
  [TicketStatus.WIN]: {
    label: () => 'Fechar como Ganho',
    icon: Trophy,
    variant: 'default',
    className: 'bg-emerald-600 text-white hover:bg-emerald-700',
  },
  [TicketStatus.PENDING]: {
    label: () => 'Colocar em Pendente',
    icon: Clock,
    variant: 'outline',
  },
  [TicketStatus.POST_PROCEDURE]: {
    label: () => 'Procedimento Realizado',
    icon: CheckCircle2,
    variant: 'default',
  },
  [TicketStatus.LOSS]: {
    label: () => 'Marcar como Perdido',
    icon: XCircle,
    variant: 'destructive',
  },
}

// Destinos que abrem um formulário inline em vez de agir direto
const NEEDS_SCHEDULE: TicketStatus[] = [TicketStatus.SCHEDULED]
const NEEDS_LOSS_REASON: TicketStatus[] = [TicketStatus.LOSS]

// ─── Seção de orçamento (avaliador) ──────────────────────────────────────────

interface DealSectionProps {
  ticket: LeadTicket
}

function DealSection({ ticket }: DealSectionProps) {
  const canCreate = usePermission('DEAL', 'CREATE')
  const canRead = usePermission('DEAL', 'READ')
  const { data: deal, isLoading } = useDealForTicket(ticket.id)
  const createDeal = useCreateDeal(ticket.id)

  const form = useForm<DealFormInput, unknown, DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: { procedures: [{ name: '', code: '', tableValue: 0, quantity: 1, note: '' }] },
  })

  if (!canRead || isLoading) return null

  // Deal já existe — exibe resumo
  if (deal) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Orçamento
        </p>
        <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Procedimentos:</span>{' '}
            <span className="font-medium">{deal.procedures.length}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Total tabela:</span>{' '}
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.totalValue)}
            </span>
          </p>
          {deal.finalValue != null && (
            <p>
              <span className="text-muted-foreground">Valor final:</span>{' '}
              <span className="font-medium text-emerald-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.finalValue)}
              </span>
            </p>
          )}
        </div>
      </div>
    )
  }

  // Sem deal + sem permissão para criar: nada
  if (!canCreate) return null

  // Sem deal + avaliador: exibe formulário de criação
  async function onSubmit(data: DealFormData) {
    try {
      await createDeal.mutateAsync(data)
    } catch {
      /* erro exibido via toast pelo interceptor */
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Criar Orçamento
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <ProcedureListEditor control={form.control} />
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={createDeal.isPending}
          >
            {createDeal.isPending ? 'Salvando...' : 'Salvar Orçamento'}
          </Button>
        </form>
      </Form>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface TicketDetailSheetProps {
  ticket: LeadTicket | null
  customer: Customer | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TicketDetailSheet({ ticket, customer, open, onOpenChange }: TicketDetailSheetProps) {
  const [addLogOpen, setAddLogOpen] = useState(false)
  // null = nenhum form inline aberto; outros valores abrem o form correspondente
  const [activeForm, setActiveForm] = useState<TicketStatus | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [lossReason, setLossReason] = useState('')

  const { data: logs = [] } = useContactLogs(ticket?.id ?? '')
  const changeStatus = useChangeTicketStatus()
  const role = useAuthStore((state) => state.user?.role)
  const canLogContact = usePermission('CONTACT_LOG', 'CREATE')

  // Transições disponíveis para este papel + status atual
  const transitions = ticket ? availableTransitions(role, ticket.status) : []

  // POST_PROCEDURE → LOSS exige motivo (contrato §10)
  const lossReasonRequired = ticket?.status === TicketStatus.POST_PROCEDURE

  function closeForm() {
    setActiveForm(null)
    setScheduleDate('')
    setLossReason('')
  }

  function markStatus(status: TicketStatus, opts?: { lossReason?: string; returnScheduledAt?: string }) {
    if (!ticket) return
    changeStatus.mutate(
      { id: ticket.id, status, lossReason: opts?.lossReason, returnScheduledAt: opts?.returnScheduledAt },
      {
        onSuccess: () => {
          closeForm()
          onOpenChange(false)
        },
      },
    )
  }

  function handleAction(to: TicketStatus) {
    if (NEEDS_SCHEDULE.includes(to)) {
      setActiveForm(to)
      return
    }
    if (NEEDS_LOSS_REASON.includes(to)) {
      setActiveForm(to)
      return
    }
    markStatus(to)
  }

  if (!ticket) return null

  const showDealSection =
    ticket.status === TicketStatus.IN_EVALUATION ||
    ticket.status === TicketStatus.NEGOTIATION ||
    ticket.status === TicketStatus.WIN ||
    ticket.status === TicketStatus.POST_PROCEDURE

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{customer?.name ?? 'Ticket'}</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-5">
            {/* ── Informações do ticket ── */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant="outline" className={TICKET_STATUS_COLOR[ticket.status]}>
                  {TICKET_STATUS_LABELS[ticket.status]}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Setor</p>
                <p className="font-medium">{SECTOR_LABELS[ticket.currentSector]}</p>
              </div>
              {ticket.scheduledAt && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Agendado para</p>
                  <p className="font-medium">
                    {format(new Date(ticket.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
              {customer && (
                <>
                  <div>
                    <p className="text-muted-foreground">CPF</p>
                    <p className="font-mono text-sm">
                      {customer.cpf
                        ? customer.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p>{customer.phone && customer.phone !== 'NULL' ? customer.phone : '—'}</p>
                  </div>
                </>
              )}
            </div>

            {/* ── Orçamento (avaliador / comercial) ── */}
            {showDealSection && (
              <>
                <Separator />
                <DealSection ticket={ticket} />
              </>
            )}

            {/* ── Ações disponíveis ── */}
            {transitions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Ações
                  </p>

                  {/* Form inline: agendamento */}
                  {activeForm && NEEDS_SCHEDULE.includes(activeForm) ? (
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                      <label className="text-sm font-medium">
                        {activeForm === TicketStatus.SCHEDULED && ticket.status === TicketStatus.POST_PROCEDURE
                          ? 'Data do retorno'
                          : 'Data da consulta'}
                      </label>
                      <Input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={closeForm}>
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          disabled={changeStatus.isPending || !scheduleDate}
                          onClick={() =>
                            markStatus(activeForm, { returnScheduledAt: scheduleDate })
                          }
                        >
                          {ticket.status === TicketStatus.POST_PROCEDURE
                            ? 'Confirmar Retorno'
                            : 'Confirmar Agendamento'}
                        </Button>
                      </div>
                    </div>
                  ) : activeForm && NEEDS_LOSS_REASON.includes(activeForm) ? (
                    /* Form inline: perda */
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                      <label className="text-sm font-medium">
                        Motivo da perda{lossReasonRequired ? '' : ' (opcional)'}
                      </label>
                      <Textarea
                        value={lossReason}
                        onChange={(e) => setLossReason(e.target.value)}
                        placeholder="Ex: optou por outra clínica, sem retorno…"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={closeForm}>
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={
                            changeStatus.isPending ||
                            (lossReasonRequired && !lossReason.trim())
                          }
                          onClick={() =>
                            markStatus(TicketStatus.LOSS, {
                              lossReason: lossReason || undefined,
                            })
                          }
                        >
                          Confirmar perda
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Botões de ação normais */
                    <div className="flex flex-wrap gap-2">
                      {transitions.map((to) => {
                        const cfg = ACTION_CFG[to]
                        if (!cfg) return null
                        const Icon = cfg.icon
                        return (
                          <Button
                            key={to}
                            size="sm"
                            variant={cfg.variant}
                            className={cfg.className}
                            disabled={changeStatus.isPending}
                            onClick={() => handleAction(to)}
                          >
                            <Icon className="size-3.5" />
                            {cfg.label(ticket.status)}
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Histórico de contatos ── */}
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Histórico de contatos
                </p>
                {canLogContact && (
                  <Button size="sm" onClick={() => setAddLogOpen(true)}>
                    + Registrar
                  </Button>
                )}
              </div>

              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum contato registrado.</p>
              ) : (
                <ol className="relative border-l border-border space-y-4 ml-3">
                  {[...logs]
                    .sort(
                      (a, b) =>
                        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
                    )
                    .map((log) => {
                      const isAutoStatusNote = /^status changed:/i.test(log.note ?? '')
                      return (
                        <li key={log.id} className="ml-4">
                          <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.occurredAt), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                              {log.channel !== 'OTHER' && (
                                <>
                                  {' · '}
                                  <span className="font-medium">
                                    {CONTACT_CHANNEL_LABELS[log.channel]}
                                  </span>
                                </>
                              )}
                            </p>
                            {log.statusBefore &&
                              log.statusAfter &&
                              log.statusBefore !== log.statusAfter && (
                                <p className="mt-1">
                                  <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                    {TICKET_STATUS_LABELS[log.statusBefore]} →{' '}
                                    {TICKET_STATUS_LABELS[log.statusAfter]}
                                  </span>
                                </p>
                              )}
                            {!isAutoStatusNote && (
                              <p className="text-sm mt-1">{log.note}</p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                </ol>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {ticket && (
        <AddContactLogDialog
          ticketId={ticket.id}
          ticketStatus={ticket.status}
          open={addLogOpen}
          onOpenChange={setAddLogOpen}
        />
      )}
    </>
  )
}
