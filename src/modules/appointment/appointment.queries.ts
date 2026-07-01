import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  appointmentService,
  type ScheduleDTO,
  type RescheduleDTO,
  type AssigneeDTO,
  type CancelDTO,
  type BatchItemDTO,
} from './appointment.service'
import type { Appointment } from '@/types/models'
import { AppointmentStatus } from '@/types/enums'

export const APPOINTMENTS_KEY = ['appointments'] as const

const awaitingKey = ['appointments', 'awaiting'] as const
const dayKey = (assignedTo: string, from: string, to: string) =>
  ['appointments', 'day', assignedTo, from, to] as const

/** Worklist "A agendar" (status=AWAITING_SCHEDULE). */
export function useAwaitingAppointments(enabled = true) {
  return useQuery<Appointment[]>({
    queryKey: awaitingKey,
    queryFn: () => appointmentService.findByStatus(AppointmentStatus.AWAITING_SCHEDULE),
    enabled,
  })
}

/** Agenda do dia de um executor (from/to = limites do dia). */
export function useDayAgenda(
  assignedTo: string | undefined,
  from: string,
  to: string,
  enabled = true,
) {
  return useQuery<Appointment[]>({
    queryKey: dayKey(assignedTo ?? '', from, to),
    queryFn: () => appointmentService.findAssignedBetween(assignedTo!, from, to),
    enabled: enabled && !!assignedTo,
  })
}

function useInvalidateAppointments() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY })
}

export function useScheduleAppointment() {
  const invalidate = useInvalidateAppointments()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ScheduleDTO }) =>
      appointmentService.schedule(id, dto),
    onSuccess: invalidate,
  })
}

export function useRescheduleAppointment() {
  const invalidate = useInvalidateAppointments()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RescheduleDTO }) =>
      appointmentService.reschedule(id, dto),
    onSuccess: invalidate,
  })
}

export function useReassignAppointment() {
  const invalidate = useInvalidateAppointments()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AssigneeDTO }) =>
      appointmentService.assignee(id, dto),
    onSuccess: invalidate,
  })
}

export function useCancelAppointment() {
  const invalidate = useInvalidateAppointments()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CancelDTO }) =>
      appointmentService.cancel(id, dto),
    onSuccess: invalidate,
  })
}

export function useCompleteAppointment() {
  const invalidate = useInvalidateAppointments()
  return useMutation({
    mutationFn: (id: string) => appointmentService.complete(id),
    onSuccess: invalidate,
  })
}

export function useScheduleBatch() {
  const invalidate = useInvalidateAppointments()
  return useMutation({
    mutationFn: (items: BatchItemDTO[]) => appointmentService.scheduleBatch(items),
    onSuccess: invalidate,
  })
}
