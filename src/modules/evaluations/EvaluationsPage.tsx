import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarClock, Stethoscope, User } from 'lucide-react'
import { useTickets, useCustomers } from '@/modules/funnel/funnel.queries'
import TicketDetailSheet from '@/modules/funnel/TicketDetailSheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TicketStatus } from '@/types/enums'
import type { LeadTicket } from '@/types/models'
import { TICKET_STATUS_COLOR, TICKET_STATUS_LABELS } from '@/lib/labels'

export default function EvaluationsPage() {
  const { data: tickets = [], isLoading } = useTickets()
  const { data: customers = [] } = useCustomers()
  const [selectedTicket, setSelectedTicket] = useState<LeadTicket | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const customerMap = new Map(customers.map((c) => [c.id, c]))

  const scheduled   = tickets.filter((t) => t.status === TicketStatus.SCHEDULED)
  const inEvaluation = tickets.filter((t) => t.status === TicketStatus.IN_EVALUATION)

  function openTicket(ticket: LeadTicket) {
    setSelectedTicket(ticket)
    setSheetOpen(true)
  }

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Carregando avaliações…</div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Avaliações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pacientes aguardando avaliação e em andamento
        </p>
      </div>

      {/* ── Aguardando avaliação (SCHEDULED) ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-amber-600" />
          <h2 className="text-sm font-medium">
            Aguardando avaliação
            <span className="ml-2 text-muted-foreground font-normal">({scheduled.length})</span>
          </h2>
        </div>

        {scheduled.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-6">Nenhum paciente agendado.</p>
        ) : (
          <div className="grid gap-2">
            {scheduled.map((ticket) => {
              const customer = customerMap.get(ticket.customerId)
              return (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {customer?.name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.scheduledAt
                          ? format(new Date(ticket.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Data não registrada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={TICKET_STATUS_COLOR[ticket.status]}>
                      {TICKET_STATUS_LABELS[ticket.status]}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openTicket(ticket)}>
                      Abrir
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Em avaliação (IN_EVALUATION) ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="size-4 text-teal-600" />
          <h2 className="text-sm font-medium">
            Em avaliação
            <span className="ml-2 text-muted-foreground font-normal">({inEvaluation.length})</span>
          </h2>
        </div>

        {inEvaluation.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-6">Nenhuma avaliação em andamento.</p>
        ) : (
          <div className="grid gap-2">
            {inEvaluation.map((ticket) => {
              const customer = customerMap.get(ticket.customerId)
              return (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <Stethoscope className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {customer?.name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customer?.phone && customer.phone !== 'NULL'
                          ? customer.phone
                          : customer?.cpf
                            ? customer.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                            : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={TICKET_STATUS_COLOR[ticket.status]}>
                      {TICKET_STATUS_LABELS[ticket.status]}
                    </Badge>
                    <Button size="sm" onClick={() => openTicket(ticket)}>
                      Avaliar
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <TicketDetailSheet
        ticket={selectedTicket}
        customer={selectedTicket ? customerMap.get(selectedTicket.customerId) : undefined}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
