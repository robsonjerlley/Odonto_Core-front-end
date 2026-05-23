import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useContactLogs, useRemoveContactLog } from './funnel.queries'
import AddContactLogDialog from './AddContactLogDialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { LeadTicket, Customer } from '@/types/models'
import { SECTOR_LABELS, TICKET_STATUS_LABELS, CONTACT_CHANNEL_LABELS } from '@/lib/labels'

interface TicketDetailSheetProps {
  ticket: LeadTicket | null
  customer: Customer | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TicketDetailSheet({ ticket, customer, open, onOpenChange }: TicketDetailSheetProps) {
  const [addLogOpen, setAddLogOpen] = useState(false)

  const { data: logs = [] } = useContactLogs(ticket?.id ?? '')
  const removeLog = useRemoveContactLog(ticket?.id ?? '')

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
                <Badge variant="outline">{TICKET_STATUS_LABELS[ticket.status]}</Badge>
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
                        <div className="flex items-start justify-between gap-2">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive shrink-0"
                            onClick={() => removeLog.mutate(log.id)}
                          >
                            ×
                          </Button>
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
