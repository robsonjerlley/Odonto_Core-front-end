import { useDroppable } from '@dnd-kit/core'
import type { LeadTicket, Customer } from '@/types/models'
import type { TicketStatus } from '@/types/enums'
import TicketCard from './TicketCard'

/** Extrai a cor do texto (text-xxx-800) do mapa de status para usar como ponto colorido. */
const STATUS_DOT: Record<string, string> = {
  NEW: 'bg-sky-500',
  IN_CONTACT: 'bg-teal-500',
  SCHEDULED: 'bg-amber-500',
  IN_EVALUATION: 'bg-teal-500',
  NEGOTIATION: 'bg-teal-500',
  PENDING: 'bg-amber-500',
  WIN: 'bg-emerald-500',
  LOSS: 'bg-rose-500',
  RECYCLED: 'bg-slate-400',
  POST_PROCEDURE: 'bg-violet-500',
}

interface KanbanColumnProps {
  status: TicketStatus
  label: string
  tickets: LeadTicket[]
  customers: Customer[]
  onCardClick: (ticket: LeadTicket) => void
}

export default function KanbanColumn({ status, label, tickets, customers, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  const customerMap = new Map(customers.map((c) => [c.id, c]))

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[200px] flex-col gap-2 rounded-xl border p-3 transition-colors ${
        isOver ? 'border-brand/40 bg-brand/5' : 'border-transparent bg-muted/40'
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${STATUS_DOT[status] ?? 'bg-muted-foreground'}`} />
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tickets.length}
        </span>
      </div>

      {tickets.length === 0 ? (
        <p className="px-1 py-6 text-center text-xs text-muted-foreground/70">
          Nenhum lead aqui
        </p>
      ) : (
        tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            customer={customerMap.get(ticket.customerId)}
            onClick={() => onCardClick(ticket)}
          />
        ))
      )}
    </div>
  )
}
