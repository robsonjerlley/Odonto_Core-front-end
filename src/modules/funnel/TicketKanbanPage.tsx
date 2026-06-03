import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useTickets, useCustomers, useChangeTicketStatus } from './funnel.queries'
import KanbanColumn from './KanbanColumn'
import TicketDetailSheet from './TicketDetailSheet'
import CreateTicketDialog from './CreateTicketDialog'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LeadTicket } from '@/types/models'
import type { TicketStatus } from '@/types/enums'
import { KANBAN_COLUMN_ORDER, TICKET_STATUS_LABELS } from '@/lib/labels'

const COLUMNS: Array<{ status: TicketStatus; label: string }> = KANBAN_COLUMN_ORDER.map(
  (status) => ({ status, label: TICKET_STATUS_LABELS[status] }),
)

export default function TicketKanbanPage() {
  const { data: tickets = [] } = useTickets()
  const { data: customers = [] } = useCustomers()
  const changeStatus = useChangeTicketStatus()

  const [selectedTicket, setSelectedTicket] = useState<LeadTicket | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const ticketId = active.id as string
    const newStatus = over.id as TicketStatus

    changeStatus.mutate({ id: ticketId, status: newStatus })
  }

  function handleCardClick(ticket: LeadTicket) {
    setSelectedTicket(ticket)
    setSheetOpen(true)
  }

  const customerMap = new Map(customers.map((c) => [c.id, c]))

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe e mova os leads pelas etapas do funil.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Novo ticket
        </Button>
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

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />

      <TicketDetailSheet
        ticket={selectedTicket}
        customer={selectedTicket ? customerMap.get(selectedTicket.customerId) : undefined}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
