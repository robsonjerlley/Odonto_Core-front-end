import { useState } from 'react'
import { useTickets, useCustomers } from '@/modules/funnel/funnel.queries'
import { TicketStatus } from '@/types/enums'
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLOR } from '@/lib/labels'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { LeadTicket } from '@/types/models'
import DealSheet from './DealSheet'

const COMMERCIAL_STATUSES = [
  TicketStatus.NEGOTIATION,
  TicketStatus.WIN,
  TicketStatus.LOSS,
] as const

export default function DealsPage() {
  const { data: tickets = [], isLoading } = useTickets()
  const { data: customers = [] } = useCustomers()

  const [selectedTicket, setSelectedTicket] = useState<LeadTicket | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const customerMap = new Map(customers.map((c) => [c.id, c]))

  const commercialTickets = tickets.filter((t) =>
    COMMERCIAL_STATUSES.includes(t.status as (typeof COMMERCIAL_STATUSES)[number])
  )

  function openDeal(ticket: LeadTicket) {
    setSelectedTicket(ticket)
    setSheetOpen(true)
  }

  if (isLoading) return <p className="p-6 text-muted-foreground text-sm">Carregando...</p>

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Negociações</h1>
        <p className="text-sm text-muted-foreground">
          Orçamentos e fechamento de tratamentos em negociação.
        </p>
      </div>

      {commercialTickets.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum ticket em negociação, ganho ou perdido.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Cliente</th>
                <th className="text-left p-3 font-medium">Contato</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Criado em</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {commercialTickets.map((ticket) => {
                const customer = customerMap.get(ticket.customerId)
                return (
                  <tr key={ticket.id} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <p className="font-medium">{customer?.name ?? '—'}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {customer?.phone ?? '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={TICKET_STATUS_COLOR[ticket.status]}>
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {format(new Date(ticket.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeal(ticket)}
                      >
                        Ver orçamento
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <DealSheet
        ticket={selectedTicket}
        customer={selectedTicket ? customerMap.get(selectedTicket.customerId) : undefined}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
