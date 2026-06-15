import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useTickets, useCustomers, useChangeTicketStatus } from './funnel.queries'
import { usePermission } from '@/hooks/usePermission'
import KanbanColumn from './KanbanColumn'
import TicketDetailSheet from './TicketDetailSheet'
import { useAuthStore } from '@/store/auth.store'
import { canTransition } from './transitions'
import { toast } from '@/lib/toast'
import type { LeadTicket } from '@/types/models'
import { TicketStatus, Role } from '@/types/enums'
import { KANBAN_COLUMN_ORDER, TICKET_STATUS_LABELS } from '@/lib/labels'

// Leads e atendente veem somente as colunas do seu domínio —
// IN_EVALUATION e NEGOTIATION pertencem às telas de Avaliações e Negociações.
const LEADS_COLUMNS: TicketStatus[] = [
  TicketStatus.NEW,
  TicketStatus.IN_CONTACT,
  TicketStatus.SCHEDULED,
  TicketStatus.PENDING,
  TicketStatus.WIN,
  TicketStatus.POST_PROCEDURE,
]

// Evaluator e commercial não acessam mais o Pipeline (restrito por papel em
// `canAccessRoute`/ROUTE_ROLES). Aqui sobram leads/atendente (colunas do domínio)
// e ADM_SYSTEM, que enxerga o funil completo.
function getVisibleColumns(role: Role | undefined | null): TicketStatus[] {
  if (
    role === Role.USER_LEADS ||
    role === Role.ADM_LEADS ||
    role === Role.USER_ATTENDANT
  ) return LEADS_COLUMNS
  return KANBAN_COLUMN_ORDER
}

export default function TicketKanbanPage() {
  const canReadCustomers = usePermission('CUSTOMER', 'READ')
  const { data: tickets = [] } = useTickets()
  const { data: customers = [] } = useCustomers(canReadCustomers)
  const changeStatus = useChangeTicketStatus()
  const role = useAuthStore((state) => state.user?.role)

  const COLUMNS = getVisibleColumns(role).map(
    (status) => ({ status, label: TICKET_STATUS_LABELS[status] }),
  )

  const [selectedTicket, setSelectedTicket] = useState<LeadTicket | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const ticketId = active.id as string
    const newStatus = over.id as TicketStatus
    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket) return

    // Valida a transição contra a máquina de estados antes de chamar o backend.
    if (!canTransition(role, ticket.status, newStatus)) {
      toast(
        `Transição não permitida: ${TICKET_STATUS_LABELS[ticket.status]} → ${TICKET_STATUS_LABELS[newStatus]}.`,
        'error',
      )
      return
    }

    changeStatus.mutate({ id: ticketId, status: newStatus })
  }

  function handleCardClick(ticket: LeadTicket) {
    setSelectedTicket(ticket)
    setSheetOpen(true)
  }

  const customerMap = new Map(customers.map((c) => [c.id, c]))

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe e mova os leads pelas etapas do funil. Tickets são abertos
          automaticamente no cadastro do paciente.
        </p>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 overflow-x-auto">
          {COLUMNS.map(({ status, label }) => (
            <KanbanColumn
              key={status}
              status={status}
              label={label}
              tickets={tickets.filter((t) => t.status === status)}
              customers={customers}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </DndContext>

      <TicketDetailSheet
        ticket={selectedTicket}
        customer={selectedTicket ? customerMap.get(selectedTicket.customerId) : undefined}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
