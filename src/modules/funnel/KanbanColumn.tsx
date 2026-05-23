import { useDroppable } from '@dnd-kit/core'
import type { LeadTicket, Customer } from '@/types/models'
import type { TicketStatus } from '@/types/enums'
import TicketCard from './TicketCard'

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
      className={`flex flex-col gap-2 min-h-[200px] rounded-lg p-3 transition-colors ${
        isOver ? 'bg-accent' : 'bg-muted/40'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
          {tickets.length}
        </span>
      </div>

      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          customer={customerMap.get(ticket.customerId)}
          onClick={() => onCardClick(ticket)}
        />
      ))}
    </div>
  )
}
