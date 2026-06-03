import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trophy, XCircle } from 'lucide-react'
import { useContactLogs, useChangeTicketStatus } from './funnel.queries'
import AddContactLogDialog from './AddContactLogDialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { TicketStatus } from '@/types/enums'
import type { LeadTicket, Customer } from '@/types/models'
import {
  SECTOR_LABELS, TICKET_STATUS_LABELS, TICKET_STATUS_COLOR,
  CONTACT_CHANNEL_LABELS, TERMINAL_STATUSES,
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

  const { data: logs = [] } = useContactLogs(ticket?.id ?? '')
  const changeStatus = useChangeTicketStatus()

  const isTerminal = ticket ? TERMINAL_STATUSES.includes(ticket.status) : false

  function markStatus(status: TicketStatus, reason?: string) {
    if (!ticket) return
    changeStatus.mutate(
      { id: ticket.id, status, lossReason: reason },
      {
        onSuccess: () => {
          setLossOpen(false)
          setLossReason('')
          onOpenChange(false)
        },
      },
    )
  }

  if (!ticket) return null

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
                      {customer.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p>{customer.phone}</p>
                  </div>
                </>
              )}
            </div>

            {!isTerminal && (
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-medium">Ações</h3>
                {!lossOpen ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={changeStatus.isPending}
                      onClick={() => markStatus(TicketStatus.WIN)}
                    >
                      <Trophy className="size-3.5" />
                      Marcar como ganho
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={changeStatus.isPending}
                      onClick={() => setLossOpen(true)}
                    >
                      <XCircle className="size-3.5" />
                      Marcar como perdido
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <label className="text-sm font-medium">Motivo da perda (opcional)</label>
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
                        disabled={changeStatus.isPending}
                        onClick={() => markStatus(TicketStatus.LOSS, lossReason || undefined)}
                      >
                        Confirmar perda
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Histórico de contatos</h3>
                <Button size="sm" onClick={() => setAddLogOpen(true)}>
                  + Registrar
                </Button>
              </div>

              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum contato registrado.</p>
              ) : (
                <ol className="relative border-l border-border space-y-4 ml-3">
                  {[...logs]
                    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
                    .map((log) => (
                      <li key={log.id} className="ml-4">
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.occurredAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            {' · '}
                            <span className="font-medium">{CONTACT_CHANNEL_LABELS[log.channel]}</span>
                          </p>
                          <p className="text-sm mt-0.5">{log.note}</p>
                          {log.statusBefore && log.statusAfter && log.statusBefore !== log.statusAfter && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {TICKET_STATUS_LABELS[log.statusBefore]} → {TICKET_STATUS_LABELS[log.statusAfter]}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                </ol>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {ticket && (
        <AddContactLogDialog
          ticketId={ticket.id}
          open={addLogOpen}
          onOpenChange={setAddLogOpen}
        />
      )}
    </>
  )
}
