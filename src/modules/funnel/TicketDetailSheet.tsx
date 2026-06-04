import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trophy, XCircle, CheckCircle2, CalendarClock } from 'lucide-react'
import { useContactLogs, useChangeTicketStatus } from './funnel.queries'
import AddContactLogDialog from './AddContactLogDialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'
import { canTransition } from './transitions'
import { TicketStatus } from '@/types/enums'
import type { LeadTicket, Customer } from '@/types/models'
import {
  SECTOR_LABELS, TICKET_STATUS_LABELS, TICKET_STATUS_COLOR,
  CONTACT_CHANNEL_LABELS,
} from '@/lib/labels'

interface TicketDetailSheetProps {
  ticket: LeadTicket | null
  customer: Customer | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TicketDetailSheet({ ticket, customer, open, onOpenChange }: TicketDetailSheetProps) {
  const [addLogOpen, setAddLogOpen] = useState(false)
  const [lossOpen, setLossOpen] = useState(false)
  const [lossReason, setLossReason] = useState('')
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnDate, setReturnDate] = useState('')

  const { data: logs = [] } = useContactLogs(ticket?.id ?? '')
  const changeStatus = useChangeTicketStatus()
  const role = useAuthStore((state) => state.user?.role)
  const canLogContact = usePermission('CONTACT_LOG', 'CREATE')

  // Ações derivadas da máquina de estados (espelha TRANSITION_ROLES do backend):
  // WIN = comercial; LOSS = leads; POST_PROCEDURE = atendente/leads; retorno = pós-procedimento.
  const canWin = ticket != null && canTransition(role, ticket.status, TicketStatus.WIN)
  const canLoss = ticket != null && canTransition(role, ticket.status, TicketStatus.LOSS)
  const canPostProcedure = ticket != null && canTransition(role, ticket.status, TicketStatus.POST_PROCEDURE)
  const canScheduleReturn =
    ticket != null &&
    ticket.status === TicketStatus.POST_PROCEDURE &&
    canTransition(role, ticket.status, TicketStatus.SCHEDULED)

  // POST_PROCEDURE → LOSS exige motivo (US-PPR-04); demais perdas o motivo é opcional.
  const lossReasonRequired = ticket?.status === TicketStatus.POST_PROCEDURE

  function markStatus(
    status: TicketStatus,
    opts?: { lossReason?: string; returnScheduledAt?: string },
  ) {
    if (!ticket) return
    changeStatus.mutate(
      { id: ticket.id, status, lossReason: opts?.lossReason, returnScheduledAt: opts?.returnScheduledAt },
      {
        onSuccess: () => {
          setLossOpen(false)
          setLossReason('')
          setReturnOpen(false)
          setReturnDate('')
          onOpenChange(false)
        },
      },
    )
  }

  if (!ticket) return null

  const hasActions = canWin || canLoss || canPostProcedure || canScheduleReturn

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{customer?.name ?? 'Ticket'}</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
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

            {hasActions && (
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-medium">Ações</h3>
                {lossOpen ? (
                  <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setLossOpen(false); setLossReason('') }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={changeStatus.isPending || (lossReasonRequired && !lossReason.trim())}
                        onClick={() => markStatus(TicketStatus.LOSS, { lossReason: lossReason || undefined })}
                      >
                        Confirmar perda
                      </Button>
                    </div>
                  </div>
                ) : returnOpen ? (
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                    <label className="text-sm font-medium">Data do retorno</label>
                    <Input
                      type="datetime-local"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setReturnOpen(false); setReturnDate('') }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        disabled={changeStatus.isPending || !returnDate}
                        onClick={() => markStatus(TicketStatus.SCHEDULED, { returnScheduledAt: returnDate })}
                      >
                        Agendar retorno
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {canWin && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={changeStatus.isPending}
                        onClick={() => markStatus(TicketStatus.WIN)}
                      >
                        <Trophy className="size-3.5" />
                        Marcar como ganho
                      </Button>
                    )}
                    {canPostProcedure && (
                      <Button
                        size="sm"
                        disabled={changeStatus.isPending}
                        onClick={() => markStatus(TicketStatus.POST_PROCEDURE)}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Procedimento realizado
                      </Button>
                    )}
                    {canScheduleReturn && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={changeStatus.isPending}
                        onClick={() => setReturnOpen(true)}
                      >
                        <CalendarClock className="size-3.5" />
                        Agendar retorno
                      </Button>
                    )}
                    {canLoss && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={changeStatus.isPending}
                        onClick={() => setLossOpen(true)}
                      >
                        <XCircle className="size-3.5" />
                        Marcar como perdido
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Histórico de contatos</h3>
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
                    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
                    .map((log) => {
                      // Logs automáticos de mudança de status vêm com nota em inglês
                      // ("Status changed: X → Y") — substituímos pela transição em PT.
                      const isAutoStatusNote = /^status changed:/i.test(log.note ?? '')
                      return (
                        <li key={log.id} className="ml-4">
                          <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.occurredAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              {log.channel !== 'OTHER' && (
                                <>
                                  {' · '}
                                  <span className="font-medium">{CONTACT_CHANNEL_LABELS[log.channel]}</span>
                                </>
                              )}
                            </p>
                            {log.statusBefore && log.statusAfter && log.statusBefore !== log.statusAfter && (
                              <p className="mt-1">
                                <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                  {TICKET_STATUS_LABELS[log.statusBefore]} → {TICKET_STATUS_LABELS[log.statusAfter]}
                                </span>
                              </p>
                            )}
                            {!isAutoStatusNote && <p className="text-sm mt-1">{log.note}</p>}
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
