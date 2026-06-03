import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { LeadTicket, Customer } from '@/types/models'
import { SECTOR_LABELS } from '@/lib/labels'

const STATUS_BAR: Record<string, string> = {
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
      className="group relative cursor-grab space-y-1.5 overflow-hidden rounded-lg border bg-card p-3 pl-4 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
      onClick={onClick}
    >
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 ${STATUS_BAR[ticket.status] ?? 'bg-muted-foreground'}`}
      />
      <p className="text-sm font-medium leading-snug">{customer?.name ?? 'Cliente desconhecido'}</p>
      {customer && (
        <p className="text-xs text-muted-foreground">{customer.phone}</p>
      )}
      {ticket.scheduledAt && (
        <Badge variant="outline" className="gap-1 text-xs font-normal">
          <CalendarClock className="size-3" />
          {format(new Date(ticket.scheduledAt), "dd/MM HH:mm", { locale: ptBR })}
        </Badge>
      )}
      <p className="text-xs text-muted-foreground">{SECTOR_LABELS[ticket.currentSector]}</p>
    </div>
  )
}
