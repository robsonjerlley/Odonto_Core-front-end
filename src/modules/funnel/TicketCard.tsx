import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import type { LeadTicket, Customer } from '@/types/models'
import { SECTOR_LABELS } from '@/lib/labels'

interface TicketCardProps {
  ticket: LeadTicket
  customer: Customer | undefined
  onClick: () => void
}

export default function TicketCard({ ticket, customer, onClick }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing space-y-1.5 shadow-sm hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <p className="font-medium text-sm leading-snug">{customer?.name ?? 'Cliente desconhecido'}</p>
      {customer && (
        <p className="text-xs text-muted-foreground">{customer.phone}</p>
      )}
      {ticket.scheduledAt && (
        <Badge variant="outline" className="text-xs">
          {format(new Date(ticket.scheduledAt), "dd/MM HH:mm", { locale: ptBR })}
        </Badge>
      )}
      <p className="text-xs text-muted-foreground">{SECTOR_LABELS[ticket.currentSector]}</p>
    </div>
  )
}
